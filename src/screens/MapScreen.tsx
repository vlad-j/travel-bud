import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Sparkle, Dot } from '../components/TravelDecorations';
import { supabase } from '../lib/supabase';
import { currentTripIdRef } from '../context/TripContext';
import { useStatusBarHeight } from '../../hooks/useStatusBarHeight';

// ─── ExploreItem model ────────────────────────────────────────────────────────
// Common model for all explore items. Future-proof for mixing sources.

type ExploreItemType = 'activity' | 'accommodation' | 'transport' | 'saved';
type ExploreCategory = 'food' | 'attraction' | 'hotel' | 'transport' | 'saved' | 'other';

interface ExploreItem {
  id: string;
  type: ExploreItemType;
  title: string;
  subtitle: string | null;
  emoji: string;
  location: string | null;
  time: string | null;
  date: string | null;
  status: 'upcoming' | 'completed' | 'now' | 'saved';
  category: ExploreCategory;
  raw: any; // original DB record
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function localDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getTodayStr(): string {
  const now = new Date();
  return localDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
}

const ACTIVITY_CATEGORY_MAP: Record<string, ExploreCategory> = {
  food: 'food', transport: 'transport', accommodation: 'hotel',
  activity: 'attraction', flight: 'transport', hotel_checkin: 'hotel',
  hotel_checkout: 'hotel', shopping: 'attraction', other: 'other',
};

const ACTIVITY_EMOJIS: Record<string, string> = {
  food: '🍜', transport: '🚗', accommodation: '🏨', activity: '🎯',
  flight: '✈️', hotel_checkin: '🏨', hotel_checkout: '🧳',
  shopping: '🛍️', other: '📍',
};

const TRANSPORT_EMOJIS: Record<string, string> = {
  Flight: '✈️', Bus: '🚌', Train: '🚂', Ferry: '⛴️',
  Car: '🚗', Taxi: '🚕', Other: '🚐',
};

const DESTINATION_FLAGS: Record<string, string> = {
  thailand: '🇹🇭', indonesia: '🇮🇩', japan: '🇯🇵', france: '🇫🇷',
  italy: '🇮🇹', spain: '🇪🇸', greece: '🇬🇷', portugal: '🇵🇹',
  germany: '🇩🇪', uk: '🇬🇧', norway: '🇳🇴', romania: '🇷🇴',
  usa: '🇺🇸', vietnam: '🇻🇳', cambodia: '🇰🇭', malaysia: '🇲🇾',
  singapore: '🇸🇬', bali: '🇮🇩', lombok: '🇮🇩', java: '🇮🇩',
};

function getCountryFlag(text: string): string {
  const lower = (text ?? '').toLowerCase();
  for (const [key, flag] of Object.entries(DESTINATION_FLAGS)) {
    if (lower.includes(key)) return flag;
  }
  return '🌍';
}

function activityToExploreItem(a: any): ExploreItem {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  let status: ExploreItem['status'] = 'upcoming';
  if (a.status === 'completed') status = 'completed';
  else if (a.time) {
    const [h, m] = a.time.split(':').map(Number);
    const actMin = h * 60 + m;
    if (Math.abs(actMin - nowMinutes) <= 30) status = 'now';
  }

  return {
    id: `activity-${a.id}`,
    type: 'activity',
    title: a.title,
    subtitle: a.location ?? null,
    emoji: ACTIVITY_EMOJIS[a.category] ?? '📍',
    location: a.location ?? null,
    time: a.time?.slice(0, 5) ?? null,
    date: a.date ?? null,
    status,
    category: ACTIVITY_CATEGORY_MAP[a.category] ?? 'other',
    raw: a,
  };
}

function accommodationToExploreItem(a: any): ExploreItem {
  return {
    id: `accom-${a.id}`,
    type: 'accommodation',
    title: a.name,
    subtitle: a.address ?? null,
    emoji: '🏨',
    location: a.address ?? null,
    time: null,
    date: a.check_in ? a.check_in.split('T')[0] : null,
    status: 'upcoming',
    category: 'hotel',
    raw: a,
  };
}

function transportToExploreItem(t: any): ExploreItem {
  return {
    id: `transport-${t.id}`,
    type: 'transport',
    title: t.airline
      ? `${t.airline}${t.flight_number ? ` ${t.flight_number}` : ''}`
      : `${t.type}: ${t.departure_location} → ${t.arrival_location}`,
    subtitle: `${t.departure_location} → ${t.arrival_location}`,
    emoji: TRANSPORT_EMOJIS[t.type] ?? '🚐',
    location: t.departure_location ?? null,
    time: t.departure_time ? new Date(t.departure_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : null,
    date: t.departure_time ? t.departure_time.split('T')[0] : null,
    status: 'upcoming',
    category: 'transport',
    raw: t,
  };
}

// ─── Filter config ────────────────────────────────────────────────────────────

interface FilterOption {
  key: string;
  label: string;
  emoji: string;
  category?: ExploreCategory;
}

const FILTERS: FilterOption[] = [
  { key: 'all', label: 'All', emoji: '🌍' },
  { key: 'saved', label: 'Saved', emoji: '⭐' },
  { key: 'food', label: 'Food', emoji: '🍜', category: 'food' },
  { key: 'attraction', label: 'Attractions', emoji: '🏛️', category: 'attraction' },
  { key: 'hotel', label: 'Hotels', emoji: '🏨', category: 'hotel' },
  { key: 'transport', label: 'Transport', emoji: '✈️', category: 'transport' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function TodayPlanCard({ item }: { item: ExploreItem }) {
  const isNow = item.status === 'now';
  const isDone = item.status === 'completed';

  return (
    <View style={[
      tp.card,
      isNow && tp.cardNow,
      isDone && tp.cardDone,
    ]}>
      <View style={tp.timeCol}>
        <Text style={[tp.time, isNow && { color: '#4CAF50' }, isDone && { color: '#BBB' }]}>
          {item.time ?? '—'}
        </Text>
        {isNow && <View style={tp.nowDot} />}
      </View>
      <View style={[tp.iconWrap, isDone && { opacity: 0.5 }]}>
        <Text style={{ fontSize: 18 }}>{item.emoji}</Text>
      </View>
      <View style={tp.info}>
        <Text style={[tp.title, isDone && tp.titleDone]} numberOfLines={1}>{item.title}</Text>
        {item.subtitle ? <Text style={tp.sub} numberOfLines={1}>📍 {item.subtitle}</Text> : null}
      </View>
      {isDone && <Text style={tp.check}>✓</Text>}
      {isNow && <View style={tp.nowBadge}><Text style={tp.nowBadgeText}>NOW</Text></View>}
    </View>
  );
}

const tp = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  cardNow: { backgroundColor: '#F1F8E9', borderRadius: 12, paddingHorizontal: 10, borderBottomWidth: 0, marginBottom: 4 },
  cardDone: { opacity: 0.6 },
  timeCol: { width: 44, alignItems: 'center' },
  time: { fontSize: 12, fontWeight: '700', color: '#888' },
  nowDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50', marginTop: 3 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  titleDone: { textDecorationLine: 'line-through', color: '#888' },
  sub: { fontSize: 11, color: '#888', marginTop: 2 },
  check: { fontSize: 16, color: '#4CAF50', fontWeight: '700' },
  nowBadge: { backgroundColor: '#4CAF50', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  nowBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
});

function ExploreCard({ item, onSave, onUnsave, isSaved }: {
  item: ExploreItem;
  onSave: (item: ExploreItem) => void;
  onUnsave: (item: ExploreItem) => void;
  isSaved: boolean;
}) {
  const isDone = item.status === 'completed';

  return (
    <View style={[ec.card, isDone && ec.cardDone]}>
      <View style={[ec.iconWrap, { opacity: isDone ? 0.5 : 1 }]}>
        <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
      </View>
      <View style={ec.info}>
        <Text style={[ec.title, isDone && ec.titleDone]} numberOfLines={1}>{item.title}</Text>
        {item.subtitle ? <Text style={ec.sub} numberOfLines={1}>📍 {item.subtitle}</Text> : null}
        {item.time ? <Text style={ec.time}>🕐 {item.time}</Text> : null}
        {isDone && <Text style={ec.visitedBadge}>✅ Visited</Text>}
      </View>
      <TouchableOpacity
        style={ec.saveBtn}
        onPress={() => isSaved ? onUnsave(item) : onSave(item)}
      >
        <Text style={{ fontSize: 20 }}>{isSaved ? '⭐' : '☆'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const ec = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  cardDone: { backgroundColor: '#FAFAFA' },
  iconWrap: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  titleDone: { color: '#888' },
  sub: { fontSize: 12, color: '#888', marginTop: 2 },
  time: { fontSize: 11, color: '#4CAF50', fontWeight: '600', marginTop: 2 },
  visitedBadge: { fontSize: 11, color: '#4CAF50', fontWeight: '600', marginTop: 3 },
  saveBtn: { padding: 4 },
});

// ─── Saved Places Storage (local per session + Supabase future) ───────────────
// For v1, saved places are stored in a 'saved_places' table.
// Schema: id, trip_id, user_id, item_type, item_id, title, subtitle, emoji, location, created_at

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MapScreen() {
  const navigation = useNavigation<any>();
  const statusBarHeight = useStatusBarHeight();

  const [trip, setTrip] = useState<any>(null);
  const [allItems, setAllItems] = useState<ExploreItem[]>([]);
  const [todayItems, setTodayItems] = useState<ExploreItem[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savedItems, setSavedItems] = useState<ExploreItem[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [destinations, setDestinations] = useState<any[]>([]);

  useFocusEffect(useCallback(() => { loadData(); }, []));

  async function loadData() {
    console.log('loadData started, tripId:', currentTripIdRef.current);
    const tripId = currentTripIdRef.current;
    if (!tripId) { setLoading(false); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [tripRes, destsRes, actsRes, accomsRes, transportRes, savedRes] = await Promise.all([
      supabase.from('trips').select('*').eq('id', tripId).single(),
      supabase.from('destinations').select('*').eq('trip_id', tripId).order('order_index', { ascending: true }),
      supabase.from('activities').select('*').eq('trip_id', tripId).order('date', { ascending: true }).order('time', { ascending: true }),
      supabase.from('accommodations').select('*').eq('trip_id', tripId),
      supabase.from('transport').select('*').eq('trip_id', tripId).order('departure_time', { ascending: true }),
      supabase.from('saved_places').select('*').eq('trip_id', tripId).eq('user_id', user.id),
    ]);

    setTrip(tripRes.data);
    setDestinations(destsRes.data ?? []);

    const today = getTodayStr();

    // Build all explore items
    const items: ExploreItem[] = [
      ...(actsRes.data ?? []).map(activityToExploreItem),
      ...(accomsRes.data ?? []).map(accommodationToExploreItem),
      ...(transportRes.data ?? []).map(transportToExploreItem),
    ];

    setAllItems(items);

    // Today's items — sorted by time
    const todayActivities = (actsRes.data ?? [])
      .filter((a: any) => a.date === today)
      .map(activityToExploreItem)
      .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));
    setTodayItems(todayActivities);

    // Saved places
    const saved = savedRes?.data ?? [];
    const savedIdSet = new Set<string>(saved.map((s: any) => s.item_id));
    setSavedIds(savedIdSet);

    // Reconstruct saved ExploreItems
    const savedExploreItems = items.filter(item => savedIdSet.has(item.id));
    setSavedItems(savedExploreItems);

    setLoading(false);
  }

  async function handleSave(item: ExploreItem) {
    const tripId = currentTripIdRef.current;
    const { data: { user } } = await supabase.auth.getUser();
    if (!tripId || !user) return;

    // Try to insert into saved_places — gracefully handle if table doesn't exist
    try {
      await supabase.from('saved_places').insert({
        trip_id: tripId,
        user_id: user.id,
        item_id: item.id,
        item_type: item.type,
        title: item.title,
        subtitle: item.subtitle,
        emoji: item.emoji,
        location: item.location,
      });
    } catch (e) {
      // Table may not exist yet — store locally only
    }

    setSavedIds(prev => new Set([...prev, item.id]));
    setSavedItems(prev => [...prev, item]);
  }

  async function handleUnsave(item: ExploreItem) {
    const tripId = currentTripIdRef.current;
    const { data: { user } } = await supabase.auth.getUser();
    if (!tripId || !user) return;

    try {
      await supabase.from('saved_places').delete()
        .eq('trip_id', tripId)
        .eq('user_id', user.id)
        .eq('item_id', item.id);
    } catch (e) {}

    setSavedIds(prev => {
      const next = new Set(prev);
      next.delete(item.id);
      return next;
    });
    setSavedItems(prev => prev.filter(s => s.id !== item.id));
  }

  // Filtered items
  const filteredItems = (() => {
    if (activeFilter === 'saved') return savedItems;
    if (activeFilter === 'all') return allItems;
    return allItems.filter(item => item.category === activeFilter);
  })();

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <View style={[styles.header, { paddingTop: statusBarHeight + 12 }]}>
          <Text style={styles.title}>Explore</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      </SafeAreaView>
    );
  }

  if (!trip) {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <View style={[styles.header, { paddingTop: statusBarHeight + 12 }]}>
          <Text style={styles.title}>Explore</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 64, marginBottom: 16 }}>🗺️</Text>
          <Text style={styles.emptyTitle}>No active trip</Text>
          <Text style={styles.emptySubtitle}>Create a trip to explore your destinations</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('CreateTrip')}>
            <Text style={styles.emptyBtnText}>Create trip</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: statusBarHeight + 12 }]}>
        <View>
          <Text style={styles.title}>Explore</Text>
          <Text style={styles.headerSub}>{trip.name}</Text>
        </View>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
            onPress={() => setActiveFilter(f.key)}
          >
            <Text style={{ fontSize: 14 }}>{f.emoji}</Text>
            <Text style={[styles.filterLabel, activeFilter === f.key && styles.filterLabelActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Today's Plan */}
        {todayItems.length > 0 && (
          <View style={styles.todaySection}>
            <View style={styles.todayHeader}>
              <Text style={styles.todayTitle}>📅 Today's Plan</Text>
              <Text style={styles.todayCount}>{todayItems.length} activities</Text>
            </View>
            <View style={styles.todayCard}>
              {todayItems.map(item => (
                <TodayPlanCard key={item.id} item={item} />
              ))}
            </View>
          </View>
        )}

        {/* Destinations summary */}
        {destinations.length > 0 && activeFilter === 'all' && (
          <View style={styles.routeWrap}>
            <Text style={styles.sectionLabel}>🗺️ TRIP ROUTE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.routeScroll}>
              {destinations.map((dest, i) => (
                <View key={dest.id} style={styles.routeChip}>
                  <Text style={{ fontSize: 20 }}>{getCountryFlag(dest.country ?? dest.name)}</Text>
                  <Text style={styles.routeChipName}>{dest.name}</Text>
                  {dest.nights ? <Text style={styles.routeChipNights}>{dest.nights}n</Text> : null}
                  {i < destinations.length - 1 && <Text style={styles.routeArrow}>→</Text>}
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Explore items */}
        <View style={styles.itemsSection}>
          {activeFilter !== 'all' && activeFilter !== 'saved' && (
            <Text style={styles.sectionLabel}>
              {FILTERS.find(f => f.key === activeFilter)?.emoji} {FILTERS.find(f => f.key === activeFilter)?.label.toUpperCase()}
            </Text>
          )}
          {activeFilter === 'saved' && (
            <Text style={styles.sectionLabel}>⭐ SAVED PLACES</Text>
          )}
          {activeFilter === 'all' && (
            <Text style={styles.sectionLabel}>🌍 ALL PLACES</Text>
          )}

          {filteredItems.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={{ fontSize: 40, marginBottom: 10 }}>
                {activeFilter === 'saved' ? '⭐' : '🔍'}
              </Text>
              <Text style={styles.emptySectionTitle}>
                {activeFilter === 'saved' ? 'No saved places yet' : 'Nothing here yet'}
              </Text>
              <Text style={styles.emptySectionSub}>
                {activeFilter === 'saved'
                  ? 'Tap ☆ on any place to save it'
                  : 'Add more items to your trip'}
              </Text>
            </View>
          ) : (
            filteredItems.map(item => (
              <ExploreCard
                key={item.id}
                item={item}
                onSave={handleSave}
                onUnsave={handleUnsave}
                isSaved={savedIds.has(item.id)}
              />
            ))
          )}
        </View>

        <View style={styles.footerDecor}>
          <Dot color="#DDD" size={5} style={{ position: 'relative' }} />
          <Dot color="#DDD" size={4} style={{ position: 'relative', marginLeft: 8 }} />
          <Sparkle color="#FF9800" size={10} style={{ position: 'relative', marginLeft: 6 }} />
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F0F0' },
  header: { paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  title: { fontSize: 22, fontWeight: '900', color: '#1A1A1A' },
  headerSub: { fontSize: 13, fontWeight: '600', color: '#4CAF50', marginTop: 2 },
  filterScroll: { backgroundColor: '#fff', maxHeight: 56 },
  filterContent: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F0F0F0' },
  filterChipActive: { backgroundColor: '#4CAF50' },
  filterLabel: { fontSize: 13, fontWeight: '600', color: '#666' },
  filterLabelActive: { color: '#fff' },
  scroll: { flex: 1 },
  todaySection: { margin: 16, marginBottom: 8 },
  todayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  todayTitle: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  todayCount: { fontSize: 12, color: '#888', fontWeight: '600' },
  todayCard: { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  routeWrap: { marginHorizontal: 16, marginBottom: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#888', letterSpacing: 0.8, marginBottom: 10 },
  routeScroll: { flexDirection: 'row', gap: 0, paddingVertical: 4 },
  routeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, marginRight: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  routeChipName: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
  routeChipNights: { fontSize: 11, color: '#4CAF50', fontWeight: '600' },
  routeArrow: { fontSize: 14, color: '#CCC', marginLeft: 4 },
  itemsSection: { marginHorizontal: 16, marginBottom: 8 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 24 },
  emptyBtn: { backgroundColor: '#4CAF50', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14 },
  emptyBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  emptySection: { alignItems: 'center', paddingVertical: 40 },
  emptySectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  emptySectionSub: { fontSize: 13, color: '#888', textAlign: 'center' },
  footerDecor: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
});
