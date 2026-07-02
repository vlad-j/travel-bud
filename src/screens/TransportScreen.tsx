import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { currentTripIdRef } from '../context/TripContext';
import { createActivityFromTransport } from '../lib/itineraryAutoCreate';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';
import { useStatusBarHeight } from '../../hooks/useStatusBarHeight';
import { getDestinationHero } from '../lib/destinationHero';
import TransportCard, { formatDayMonth, formatDuration } from '../components/transport/TransportCard';
import AddTransportSheet from '../components/transport/AddTransportSheet';
import AddFlightModal from '../components/transport/AddFlightModal';
import AddTransferModal from '../components/transport/AddTransferModal';

const VISIBLE_LIMIT = 5;

// ─── Date helpers (matches Packing/Itinerary convention) ──────────────────
function localDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatShortRange(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return '';
  const s = localDate(startDate);
  const e = localDate(endDate);
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  if (sameMonth) return `${s.getDate()} – ${e.getDate()} ${MONTHS[e.getMonth()]} ${e.getFullYear()}`;
  return `${s.getDate()} ${MONTHS[s.getMonth()]} – ${e.getDate()} ${MONTHS[e.getMonth()]} ${e.getFullYear()}`;
}

function getDaysUntilStart(startDate: string): number {
  const start = localDate(startDate);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)), 0);
}

function getTotalDays(startDate: string, endDate: string): number {
  const start = localDate(startDate);
  const end = localDate(endDate);
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

function getCurrentDay(startDate: string, endDate: string): number {
  const start = localDate(startDate);
  const end = localDate(endDate);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (today < start) return 0;
  if (today > end) return getTotalDays(startDate, endDate);
  return Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

// ─── Small stat block for the overview card ────────────────────────────────
function StatBlock({ icon, value, label }: { icon: string; value: string | number; label: string }) {
  return (
    <View style={styles.statBlock}>
      <Text style={{ fontSize: 18 }}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function TransportScreen() {
  const navigation = useNavigation<any>();
  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [addFlightVisible, setAddFlightVisible] = useState(false);
  const [addTransferVisible, setAddTransferVisible] = useState(false);
  const [addOtherVisible, setAddOtherVisible] = useState(false);
  const [transports, setTransports] = useState<any[]>([]);
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const statusBarHeight = useStatusBarHeight();

  useFocusEffect(useCallback(() => { loadData(); }, []));
  useRealtimeSync({ tripId: currentTripIdRef.current, tables: ['transport'], onChange: loadData });

  async function loadData() {
    const tripId = currentTripIdRef.current;
    if (!tripId) { setLoading(false); return; }

    const { data: tripData } = await supabase
      .from('trips')
      .select('*, destinations(id, name, country)')
      .eq('id', tripId)
      .single();
    setTrip(tripData ?? null);

    const { data, error } = await supabase
      .from('transport')
      .select('*')
      .eq('trip_id', tripId)
      .order('departure_time', { ascending: true });
    if (!error) setTransports(data ?? []);
    setLoading(false);
  }

  async function handleSave(data: any) {
    const tripId = currentTripIdRef.current;
    if (!tripId) { Alert.alert('Error', 'No active trip.'); return; }

    const { _addToBudget, _costAmount, ...transportData } = data;

    const { data: saved, error } = await supabase
      .from('transport')
      .insert({ ...transportData, trip_id: tripId })
      .select()
      .single();

    if (error) { Alert.alert('Error', error.message); return; }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && saved) {
        await createActivityFromTransport(saved.id, tripId, transportData, user.id);

        if (_addToBudget && _costAmount && parseFloat(_costAmount) > 0) {
          const label = transportData.airline
            ? `${transportData.airline}${transportData.flight_number ? ' ' + transportData.flight_number : ''}`
            : `${transportData.type}: ${transportData.departure_location} → ${transportData.arrival_location}`;
          await supabase.from('expenses').insert({
            trip_id: tripId,
            title: label,
            amount: parseFloat(_costAmount),
            currency: trip?.currency ?? 'EUR',
            category: 'transport',
            date: new Date().toISOString(),
            paid_by: user.id,
            notes: `${transportData.departure_location} → ${transportData.arrival_location}`,
          });
        }
      }
    } catch (e) {
      console.warn('Could not auto-create itinerary activity:', e);
    }

    Alert.alert('✅ Saved', 'Transport added to your itinerary.');
    await loadData();
  }

  // ─── Derived data ─────────────────────────────────────────────────────
  const flights = transports.filter((t) => t.type === 'Flight');
  const transfers = transports.filter((t) => ['Taxi', 'Rental Car'].includes(t.type));
  const others = transports.filter((t) => !['Flight', 'Taxi', 'Rental Car'].includes(t.type));

  const totalMinutes = transports.reduce((sum, t) => {
    const dur = formatDuration(t.departure_time, t.arrival_time);
    if (!dur) return sum;
    const hMatch = dur.match(/(\d+)h/);
    const mMatch = dur.match(/(\d+)m/);
    const h = hMatch ? parseInt(hMatch[1], 10) : 0;
    const m = mMatch ? parseInt(mMatch[1], 10) : 0;
    return sum + h * 60 + m;
  }, 0);
  const totalTravelLabel = totalMinutes > 0
    ? `${Math.floor(totalMinutes / 60)}h${totalMinutes % 60 ? ` ${totalMinutes % 60}m` : ''}`
    : '—';

  const heroDestination = trip?.destinations?.[0] ?? null;
  const heroTheme = getDestinationHero(heroDestination?.name, heroDestination?.country);
  const daysUntilStart = trip ? getDaysUntilStart(trip.start_date) : 0;
  const totalDays = trip ? getTotalDays(trip.start_date, trip.end_date) : 0;
  const currentDay = trip ? getCurrentDay(trip.start_date, trip.end_date) : 0;
  const isCompleted = trip?.status === 'completed';
  const isUpcoming = daysUntilStart > 0;

  const visibleTransports = expanded ? transports : transports.slice(0, VISIBLE_LIMIT);
  const hasMore = transports.length > VISIBLE_LIMIT;

  // Group the visible slice by date, preserving arrival order.
  const groups: { key: string; day: string; month: string; items: any[] }[] = [];
  visibleTransports.forEach((t) => {
    const dm = formatDayMonth(t.departure_time);
    const key = dm ? `${dm.day}-${dm.month}` : 'unscheduled';
    let group = groups.find((g) => g.key === key);
    if (!group) {
      group = { key, day: dm?.day ?? '', month: dm?.month ?? '', items: [] };
      groups.push(group);
    }
    group.items.push(t);
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <View style={[styles.headerOverlay, { paddingTop: statusBarHeight + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Transport</Text>
        <TouchableOpacity style={styles.menuBtn} onPress={() => setAddSheetVisible(true)}>
          <Text style={{ fontSize: 20 }}>⋯</Text>
        </TouchableOpacity>
      </View>

      {!trip ? (
        <View style={styles.emptyWrap}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🧭</Text>
          <Text style={styles.emptyTitle}>No active trip</Text>
          <Text style={styles.emptySubtitle}>Create a trip to start planning transport</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Hero */}
          <View style={[styles.heroCard, { backgroundColor: heroTheme.background, borderColor: heroTheme.border }]}>
            <View style={[styles.heroBlobOne, { backgroundColor: heroTheme.blobOne }]} />
            <View style={[styles.heroBlobTwo, { backgroundColor: heroTheme.blobTwo }]} />
            <View style={[styles.heroHillBack, { backgroundColor: heroTheme.hillBack }]} />
            <View style={[styles.heroHillFront, { backgroundColor: heroTheme.hillFront }]} />

            <View style={styles.heroTextBlock}>
              <Text style={styles.heroName} numberOfLines={1}>
                {heroDestination?.name ?? trip.name}
              </Text>
              {trip.start_date && trip.end_date && (
                <Text style={styles.heroDates}>{formatShortRange(trip.start_date, trip.end_date)}</Text>
              )}
              <View style={[styles.heroPill, { backgroundColor: heroTheme.pillBg }]}>
                <Text style={[styles.heroPillText, { color: heroTheme.text }]}>
                  {isCompleted
                    ? '✓ Trip completed'
                    : isUpcoming
                      ? `🗓 ${daysUntilStart} day${daysUntilStart === 1 ? '' : 's'} until trip`
                      : `📍 Day ${currentDay} of ${totalDays}`}
                </Text>
              </View>
            </View>
          </View>

          {/* Overview card */}
          <View style={styles.overviewCard}>
            {transports.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                <Text style={{ fontSize: 34, marginBottom: 8 }}>🧭</Text>
                <Text style={styles.overviewEmptyTitle}>No transport planned yet.</Text>
                <Text style={styles.overviewEmptySubtitle}>Start building your journey.</Text>
                <TouchableOpacity style={styles.overviewAddBtn} onPress={() => setAddSheetVisible(true)}>
                  <Text style={styles.overviewAddBtnText}>＋ Add Transport</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.statsRow}>
                  <StatBlock icon="✈️" value={flights.length} label="Flights" />
                  <StatBlock icon="🚖" value={transfers.length} label="Transfers" />
                  <StatBlock icon="🚌" value={others.length} label="Other" />
                  <StatBlock icon="⏱" value={totalTravelLabel} label="Total travel" />
                </View>
                <View style={styles.routesPill}>
                  <Text style={styles.routesPillText}>📍 {transports.length} route{transports.length === 1 ? '' : 's'} planned</Text>
                </View>
              </>
            )}
          </View>

          {/* Timeline */}
          {transports.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Journey</Text>

              {groups.map((group, gi) => (
                <View key={group.key} style={{ marginBottom: 4 }}>
                  <Text style={styles.dateHeader}>{group.day ? `${group.day} ${group.month}` : 'No date set'}</Text>
                  {group.items.map((item, ii) => {
                    const isVeryLast = gi === groups.length - 1 && ii === group.items.length - 1;
                    return (
                      <View key={item.id} style={styles.timelineRow}>
                        <View style={styles.timelineRail}>
                          <View style={styles.timelineDot} />
                          {!isVeryLast && <View style={styles.timelineLine} />}
                        </View>
                        <View style={{ flex: 1, marginBottom: 14 }}>
                          <TransportCard
                            item={item}
                            onPress={() => navigation.navigate('TransportDetails', { transportId: item.id })}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))}

              {hasMore && !expanded && (
                <TouchableOpacity style={styles.viewAllBtn} onPress={() => setExpanded(true)}>
                  <Text style={styles.viewAllText}>View full timeline ({transports.length})</Text>
                  <Text style={styles.viewAllChevron}>›</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>
      )}

      {trip && (
        <TouchableOpacity style={styles.fab} onPress={() => setAddSheetVisible(true)}>
          <Text style={styles.fabText}>＋</Text>
        </TouchableOpacity>
      )}

      <AddTransportSheet
        visible={addSheetVisible}
        onClose={() => setAddSheetVisible(false)}
        onSelectFlight={() => setAddFlightVisible(true)}
        onSelectTransfer={() => setAddTransferVisible(true)}
        onSelectOther={() => setAddOtherVisible(true)}
      />

      <AddFlightModal
        visible={addFlightVisible}
        onClose={() => setAddFlightVisible(false)}
        tripName={trip?.name}
        tripCurrency={trip?.currency}
        destinationContext={heroDestination ? { name: heroDestination.name, country: heroDestination.country ?? null } : null}
        onSave={handleSave}
      />

      <AddTransferModal
        visible={addTransferVisible}
        onClose={() => setAddTransferVisible(false)}
        title="Add Transfer"
        initialType="Taxi"
        tripName={trip?.name}
        tripCurrency={trip?.currency}
        destinationContext={heroDestination ? { name: heroDestination.name, country: heroDestination.country ?? null } : null}
        onSave={handleSave}
      />

      <AddTransferModal
        visible={addOtherVisible}
        onClose={() => setAddOtherVisible(false)}
        title="Add Other Transport"
        initialType="Train"
        tripName={trip?.name}
        tripCurrency={trip?.currency}
        destinationContext={heroDestination ? { name: heroDestination.name, country: heroDestination.country ?? null } : null}
        onSave={handleSave}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF8F0' },
  scroll: { flex: 1 },

  headerOverlay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 30, color: '#1A1A1A', fontWeight: '300' },
  title: { fontSize: 18, fontWeight: '900', color: '#1A1A1A' },
  menuBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: '#8A817A', fontWeight: '600' },

  // Hero
  heroCard: {
    marginHorizontal: 16, height: 150, borderRadius: 28, borderWidth: 1,
    overflow: 'hidden', position: 'relative', justifyContent: 'flex-end', marginBottom: 20,
  },
  heroBlobOne: { position: 'absolute', width: 140, height: 140, borderRadius: 999, top: -50, left: -34, opacity: 0.78 },
  heroBlobTwo: { position: 'absolute', width: 160, height: 160, borderRadius: 999, right: -54, bottom: -68, opacity: 0.72 },
  heroHillBack: { position: 'absolute', left: -24, right: -40, bottom: -28, height: 70, borderTopLeftRadius: 120, borderTopRightRadius: 140, transform: [{ rotate: '-2deg' }] },
  heroHillFront: { position: 'absolute', left: 60, right: -16, bottom: -34, height: 74, borderTopLeftRadius: 120, borderTopRightRadius: 120, transform: [{ rotate: '3deg' }] },
  heroTextBlock: { padding: 16 },
  heroName: { fontSize: 22, fontWeight: '900', color: '#1A1A1A' },
  heroDates: { fontSize: 13, fontWeight: '700', color: '#5C5148', marginTop: 4, opacity: 0.8 },
  heroPill: { alignSelf: 'flex-start', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7, marginTop: 10 },
  heroPillText: { fontSize: 12, fontWeight: '900' },

  // Overview card
  overviewCard: {
    marginHorizontal: 16, marginTop: -46, marginBottom: 20,
    backgroundColor: '#fff', borderRadius: 24, padding: 18,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  statBlock: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 16, fontWeight: '900', color: '#1A1A1A', marginTop: 4 },
  statLabel: { fontSize: 10, color: '#8A817A', fontWeight: '700', marginTop: 2 },
  routesPill: { backgroundColor: '#E8F5E9', borderRadius: 14, paddingVertical: 9, alignItems: 'center' },
  routesPillText: { fontSize: 12, fontWeight: '800', color: '#2E7D32' },
  overviewEmptyTitle: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  overviewEmptySubtitle: { fontSize: 12, color: '#8A817A', fontWeight: '600', marginTop: 2, marginBottom: 14 },
  overviewAddBtn: { backgroundColor: '#4CAF50', borderRadius: 14, paddingHorizontal: 22, paddingVertical: 12 },
  overviewAddBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },

  // Timeline
  section: { marginHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#1A1A1A', marginBottom: 12 },
  dateHeader: { fontSize: 12, fontWeight: '900', color: '#E9A86A', letterSpacing: 0.6, marginBottom: 8, marginLeft: 26 },
  timelineRow: { flexDirection: 'row', alignItems: 'stretch' },
  timelineRail: { width: 26, alignItems: 'center' },
  timelineDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: '#4CAF50', marginTop: 6 },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#E5DFD7', marginTop: 4, marginBottom: 4, minHeight: 30 },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 14 },
  viewAllText: { fontSize: 14, fontWeight: '700', color: '#4CAF50' },
  viewAllChevron: { fontSize: 16, color: '#4CAF50' },

  fab: {
    position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#4CAF50', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#4CAF50', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  fabText: { fontSize: 28, color: '#fff', fontWeight: '400', lineHeight: 30 },
});
