import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Dimensions, ActivityIndicator, FlatList, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import BudgetDonut from '../components/BudgetDonut';
import ContextCard from '../components/ContextCard';
import { getTodayActivities, calculateTripStatus } from '../lib/tripService';
import { useCurrentTrip, currentTripIdRef } from '../context/TripContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useStatusBarHeight } from '../../hooks/useStatusBarHeight';
import { getDestinationHero } from '../lib/destinationHero';
import { evaluateContextCard } from '../lib/contextCardProvider';
import type { ContextCardInput } from '../lib/contextCardProvider';
import { useWeather } from '../../hooks/useWeather';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

const ACTIVITY_ICONS: Record<string, { icon: any; bg: string }> = {
  food:           { icon: require('../../assets/icons/activity_food.png'),          bg: '#FFF3E0' },
  transport:      { icon: require('../../assets/icons/activity_transport.png'),     bg: '#E3F2FD' },
  accommodation:  { icon: require('../../assets/icons/activity_accommodation.png'), bg: '#FCE4EC' },
  activity:       { icon: require('../../assets/icons/activity_activity.png'),      bg: '#E8F5E9' },
  flight:         { icon: require('../../assets/icons/activity_flight.png'),        bg: '#EDE7F6' },
  hotel_checkin:  { icon: require('../../assets/icons/activity_accommodation.png'), bg: '#F3E5F5' },
  hotel_checkout: { icon: require('../../assets/icons/activity_accommodation.png'), bg: '#FFF8E1' },
  default:        { icon: require('../../assets/icons/activity_activity.png'),      bg: '#F5F5F5' },
};

const QUICK_PILLS = [
  { label: 'Packing',       icon: require('../../assets/icons/packing.png'),        screen: 'Packing' as const,       bg: '#F2FAF3', border: '#DDEFE0' },
  { label: 'Documents',     icon: require('../../assets/icons/documents.png'),      screen: 'Documents' as const,     bg: '#FFF8EB', border: '#F3E0B8' },
  { label: 'Stays', icon: require('../../assets/icons/accom.png'),          screen: 'Accommodation' as const, bg: '#F8F2FF', border: '#E5D4F6' },
  { label: 'Transport',     icon: require('../../assets/icons/transportation.png'), screen: 'Transport' as const,     bg: '#F2F8FF', border: '#D6E8F8' },
  { label: 'Memories',      icon: require('../../assets/icons/memories.png'),       screen: 'MemoriesRecap' as const, bg: '#FFF5EE', border: '#F2D8C8' },
  { label: 'Settings', icon: require('../../assets/icons/tripSettings.png'),   screen: 'TripSettings' as const,  bg: '#F6F6F6', border: '#E3E3E3' },
];

function getDayNumber(startDate: string): number {
  const [sy, sm, sd] = startDate.split('-').map(Number);
  const start = new Date(sy, sm - 1, sd);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff + 1);
}

function getTotalDays(startDate: string, endDate: string): number {
  const [sy, sm, sd] = startDate.split('-').map(Number);
  const [ey, em, ed] = endDate.split('-').map(Number);
  const start = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

function getActivityStatus(time: string, status: string): 'DONE' | 'NOW' | 'UPCOMING' {
  if (status === 'completed') return 'DONE';
  if (status === 'in_progress') return 'NOW';
  const now = new Date();
  const [h, m] = time.split(':').map(Number);
  const activityMinutes = h * 60 + m;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  if (activityMinutes < nowMinutes - 30) return 'DONE';
  if (Math.abs(activityMinutes - nowMinutes) <= 30) return 'NOW';
  return 'UPCOMING';
}

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  const n = name ? `, ${name}` : '';
  if (hour >= 6 && hour < 12) return `Good morning${n} ☀️`;
  if (hour >= 12 && hour < 17) return `Good afternoon${n} 🌤️`;
  if (hour >= 17 && hour < 21) return `Good evening${n} 🌅`;
  return `Good night${n} 🌙`;
}

function localDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const STATUS_BG_ACTIVITY: Record<string, string> = {
  DONE: '#F1F8E9', NOW: '#FFF8E1', UPCOMING: '#F3E8FF',
};
const STATUS_BADGE_COLOR: Record<string, { bg: string; text: string }> = {
  DONE:     { bg: '#4CAF50', text: '#fff' },
  NOW:      { bg: '#FF9800', text: '#fff' },
  UPCOMING: { bg: '#7C3AED', text: '#fff' },
};

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { setCurrentTripId, currentDestination } = useCurrentTrip();
  const statusBarHeight = useStatusBarHeight();

  const [trips, setTrips] = useState<any[]>([]);
  const [currentTripIndex, setCurrentTripIndex] = useState(0);
  const currentTripIndexRef2 = useRef(0);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const tripsLoadedRef = useRef(false);
  const [budgetData, setBudgetData] = useState({ total: 0, spent: 0, todaySpending: 0, percentUsed: 0 });
  const [contextCardInput, setContextCardInput] = useState<ContextCardInput | null>(null);
  const [userName, setUserName] = useState('');

  const currentTrip = trips[currentTripIndex];
  const weatherQuery = currentDestination?.name ?? currentDestination?.country ?? currentTrip?.destinations?.[0]?.name ?? null;
  const { weather } = useWeather(weatherQuery);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('profiles').select('name').eq('id', user.id).single().then(({ data }) => {
        if (data?.name) setUserName(data.name.split(' ')[0]);
      });
    });
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, []));
  useRealtimeSync({ tripId: currentTripIdRef.current, tables: ['activities', 'expenses'], onChange: loadData });

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data: memberships } = await supabase.from('trip_members').select('trip_id').eq('user_id', user.id);
    if (!memberships || memberships.length === 0) { setLoading(false); return; }
    const tripIds = memberships.map((m: any) => m.trip_id);
    const { data: tripsData } = await supabase
      .from('trips')
      .select(`*, destinations(id, name, country, nights, order_index)`)
      .in('id', tripIds)
      .order('start_date', { ascending: true });

    if (tripsData && tripsData.length > 0) {
      const processed = tripsData
        .map((t: any) => ({ ...t, computedStatus: calculateTripStatus(t.start_date, t.end_date) }))
        .filter((t: any) => t.computedStatus !== 'completed');
      const sorted = [
        ...processed.filter((t: any) => t.computedStatus === 'active'),
        ...processed.filter((t: any) => t.computedStatus === 'upcoming'),
      ];
      setTrips(sorted);
      if (!tripsLoadedRef.current && sorted[0]) {
        tripsLoadedRef.current = true;
        currentTripIdRef.current = sorted[0].id;
        setCurrentTripId(sorted[0].id);
        currentTripIndexRef2.current = 0;
        setCurrentTripIndex(0);
        const acts = await getTodayActivities(sorted[0].id);
        setActivities(acts);
        await loadBudget(sorted[0].id, sorted[0].budget ?? 0, sorted[0].currency ?? 'EUR');
        await loadContextCardData(sorted[0].id, sorted[0].budget ?? 0, sorted[0].currency ?? 'EUR', acts);
      } else if (tripsLoadedRef.current) {
        const idx = currentTripIndexRef2.current;
        if (sorted[idx]) {
          const acts = await getTodayActivities(sorted[idx].id);
          setActivities([...acts]);
          await loadBudget(sorted[idx].id, sorted[idx].budget ?? 0, sorted[idx].currency ?? 'EUR');
          await loadContextCardData(sorted[idx].id, sorted[idx].budget ?? 0, sorted[idx].currency ?? 'EUR', acts);
        }
      }
    }
    setLoading(false);
  }

  async function onTripChange(index: number) {
    currentTripIndexRef2.current = index;
    setCurrentTripIndex(index);
    if (trips[index]) {
      currentTripIdRef.current = trips[index].id;
      setCurrentTripId(trips[index].id);
      setActivitiesLoading(true);
      const acts = await getTodayActivities(trips[index].id);
      setActivities([...acts]);
      setActivitiesLoading(false);
      await loadBudget(trips[index].id, trips[index].budget ?? 0, trips[index].currency ?? 'EUR');
      await loadContextCardData(trips[index].id, trips[index].budget ?? 0, trips[index].currency ?? 'EUR', acts);
    }
  }

  async function loadBudget(tripId: string, totalBudget: number, currency: string) {
    const today = localDateStr(new Date());
    const { data: allExpenses } = await supabase.from('expenses').select('amount, date').eq('trip_id', tripId);
    const spent = (allExpenses ?? []).reduce((sum, e) => sum + Number(e.amount), 0);
    const todaySpending = (allExpenses ?? []).filter(e => e.date?.startsWith(today)).reduce((sum, e) => sum + Number(e.amount), 0);
    const percentUsed = totalBudget > 0 ? Math.round((spent / totalBudget) * 100) : 0;
    setBudgetData({ total: totalBudget, spent: Math.round(spent), todaySpending: Math.round(todaySpending), percentUsed });
  }

  async function loadContextCardData(tripId: string, totalBudget: number, currency: string, todayActs: any[]) {
    const now = new Date();
    const today = localDateStr(now);
    const tomorrow = localDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
    const [transportRes, accommodationRes, expensesRes, journalRes] = await Promise.all([
      supabase.from('transport').select('id, type, departure_location, arrival_location, departure_time, arrival_time').eq('trip_id', tripId).in('status', ['UPCOMING', 'upcoming']).order('departure_time', { ascending: true }),
      supabase.from('accommodations').select('id, name, check_in_date, check_out_date').eq('trip_id', tripId),
      supabase.from('expenses').select('amount').eq('trip_id', tripId),
      supabase.from('journal_entries').select('id').eq('trip_id', tripId).gte('date', `${today}T00:00:00`).lte('date', `${today}T23:59:59`).limit(1),
    ]);
    const transport = transportRes.data ?? [];
    const accommodations = accommodationRes.data ?? [];
    const expenses = expensesRes.data ?? [];
    const journalEntries = journalRes.data ?? [];
    const flightToday = transport.find(t => t.type === 'Flight' && t.departure_time?.startsWith(today)) ?? null;
    const flightTomorrow = transport.find(t => t.type === 'Flight' && t.departure_time?.startsWith(tomorrow)) ?? null;
    const transportToday = !flightToday ? transport.find(t => t.type !== 'Flight' && t.departure_time?.startsWith(today)) ?? null : null;
    const checkinToday = accommodations.find(a => a.check_in_date === today) ?? null;
    const checkoutToday = accommodations.find(a => a.check_out_date === today) ?? null;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const nextActivity = todayActs.filter(a => a.time && a.status !== 'completed').find(a => { const [h, m] = a.time.split(':').map(Number); return h * 60 + m >= nowMinutes; }) ?? null;
    const budgetSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    setContextCardInput({
      flightToday, flightTomorrow, transportToday, checkinToday, checkoutToday,
      activitiesTodayCount: todayActs.length,
      nextActivity: nextActivity ? { id: nextActivity.id, title: nextActivity.title, time: nextActivity.time, location: nextActivity.location ?? null } : null,
      budgetTotal: totalBudget, budgetSpent: Math.round(budgetSpent),
      hasJournalToday: journalEntries.length > 0, currentHour: now.getHours(),
    });
  }

  const heroDestination = currentDestination ?? currentTrip?.destinations?.[0] ?? null;
  const heroConfig = getDestinationHero(heroDestination?.name, heroDestination?.country);
  const contextCard = contextCardInput ? evaluateContextCard(contextCardInput) : null;
  const tripCurrency = currentTrip?.currency ?? 'EUR';

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
      <View style={styles.container}>

        {/* ─── HEADER (fixed) ───────────────────────────────────────── */}
        <View style={[styles.header, { paddingTop: statusBarHeight + 12 }]}>
          <TouchableOpacity onPress={() => navigation.navigate('ProfileSettings')} activeOpacity={0.8}>
            <View style={styles.avatar}>
              <Text style={{ fontSize: 26 }}>👨</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.greetingText}>{getGreeting(userName)}</Text>
            {weather && (
              <View style={styles.weatherPill}>
                <Text style={styles.weatherIcon}>{weather.icon}</Text>
                <Text style={styles.weatherText}>{weather.tempC}°C · {weather.condition}</Text>
              </View>
            )}
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconHeaderBtn}
              onPress={() => navigation.navigate('Notifications')}
              activeOpacity={0.8}
            >
              <Text style={styles.headerActionEmoji}>🔔</Text>
              <View style={styles.notificationDot} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconHeaderBtn}
              onPress={() => navigation.navigate('MyTrips')}
              activeOpacity={0.8}
            >
              <Text style={styles.headerActionEmoji}>🗺️</Text>
              {trips.length > 0 && (
                <View style={styles.myTripsBadge}>
                  <Text style={styles.myTripsBadgeText}>{trips.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── HERO + LANDMARK (fixed) ──────────────────────────────── */}
        <View style={styles.heroArea}>
          <View style={styles.heroLandmarkArea}>
            <Text style={styles.heroLandmarkEmoji}>{heroConfig.emoji}</Text>
          </View>
        </View>

        {/* ─── TRIP CARDS — horizontal FlatList (NOT inside ScrollView) */}
        {trips.length === 0 ? (
          <View style={styles.emptyCarousel}>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('CreateTrip')} activeOpacity={0.88}>
              <View style={styles.tripCardInner}>
                <View style={[styles.tripAvatar, { backgroundColor: '#E8F5E9' }]}>
                  <Text style={{ fontSize: 22 }}>✈️</Text>
                </View>
                <View style={styles.tripCardLeft}>
                  <Text style={styles.tripName}>Create a trip</Text>
                  <Text style={styles.tripDayText}>Plan your next adventure</Text>
                </View>
                <Text style={styles.tripChevron}>›</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.emptyBtn, { marginTop: 8 }]} onPress={() => navigation.navigate('JoinTrip')} activeOpacity={0.88}>
              <View style={styles.tripCardInner}>
                <View style={[styles.tripAvatar, { backgroundColor: '#E3F2FD' }]}>
                  <Text style={{ fontSize: 22 }}>🔗</Text>
                </View>
                <View style={styles.tripCardLeft}>
                  <Text style={styles.tripName}>Join a trip</Text>
                  <Text style={styles.tripDayText}>Enter an invite code</Text>
                </View>
                <Text style={styles.tripChevron}>›</Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.tripCarouselShell}>
              <FlatList
                ref={flatListRef}
              data={trips}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              snapToInterval={CARD_WIDTH}
              decelerationRate="fast"
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
                onTripChange(index);
              }}
              renderItem={({ item }) => {
                const active = item.computedStatus === 'active';
                const dest = item.destinations?.[0] ?? null;
                const dayNum = getDayNumber(item.start_date);
                const totalD = getTotalDays(item.start_date, item.end_date);
                return (
                  <TouchableOpacity
                    style={[styles.tripCard, { width: CARD_WIDTH }]}
                    onPress={() => navigation.navigate('TripOverview', { tripId: item.id })}
                    activeOpacity={0.88}
                  >
                    <View style={styles.tripCardInner}>
                      <View style={styles.tripCardLeft}>
                        <View style={styles.tripNameRow}>
                          <Text style={styles.tripName} numberOfLines={1}>{item.name}</Text>
                          {active && <View style={styles.activeDot} />}
                        </View>
                        <View style={styles.tripDayRow}>
                          <View style={[styles.tripDayDotSmall, { backgroundColor: active ? '#4CAF50' : '#888' }]} />
                          <Text style={[styles.tripDayText, { color: active ? '#4CAF50' : '#888' }]}>
                            {active ? `Day ${dayNum} of ${totalD}` : item.computedStatus?.toUpperCase()}
                          </Text>
                        </View>
                        {dest ? (
                          <View style={styles.tripLocRow}>
                            <Text style={styles.tripLocPin}>📍</Text>
                            <Text style={styles.tripLocText} numberOfLines={1}>{dest.name}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.tripChevron}>›</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
              />
            </View>
            {trips.length > 1 && (
              <View style={styles.paginationRow}>
                {trips.map((_, i) => (
                  <View key={i} style={[styles.paginationDot, i === currentTripIndex && styles.paginationDotActive]} />
                ))}
              </View>
            )}
          </>
        )}

        {/* ─── SCROLLABLE CONTENT (vertical ScrollView) ─────────────── */}
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* Context Card */}
          {contextCard && (
            <View style={styles.contextCardWrap}>
              <ContextCard
                card={contextCard}
                currency={tripCurrency}
                onAction={(screen, params) => navigation.navigate(screen, params)}
              />
            </View>
          )}

          {/* Quick Access Grid */}
          <View style={styles.quickAccessCard}>
            <View style={styles.gridWrap}>
              {QUICK_PILLS.map((pill) => (
                <TouchableOpacity
                  key={pill.label}
                  style={[styles.gridTile, { backgroundColor: pill.bg, borderColor: pill.border }]}
                  onPress={() => navigation.navigate(pill.screen, { tripId: currentTripIdRef.current })}
                  activeOpacity={0.78}
                >
                  <View style={styles.gridIconCircle}>
                    <Image source={pill.icon} style={styles.gridIcon} resizeMode="contain" />
                  </View>
                  <Text style={styles.gridLabel} numberOfLines={1}>{pill.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Today's Activities */}
          <View style={styles.sectionWrap}>
            <View style={styles.sectionTopRow}>
              <Text style={styles.sectionTitle}>✦ TODAY'S ACTIVITIES</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Itinerary')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>

            {activitiesLoading ? (
              <ActivityIndicator color="#4CAF50" style={{ padding: 20 }} />
            ) : activities.length === 0 ? (
              <TouchableOpacity style={styles.emptyActivities} onPress={() => navigation.navigate('Itinerary')} activeOpacity={0.8}>
                <Text style={styles.emptyActivitiesEmoji}>🌤️</Text>
                <Text style={styles.emptyActivitiesText}>No activities planned today</Text>
                <Text style={styles.emptyActivitiesAction}>Tap to add to itinerary →</Text>
              </TouchableOpacity>
            ) : (
              activities.map((activity) => {
                const status = getActivityStatus(activity.time?.slice(0, 5) ?? '00:00', activity.status ?? 'upcoming');
                const iconData = ACTIVITY_ICONS[activity.category?.toLowerCase() ?? 'default'] ?? ACTIVITY_ICONS.default;
                const badgeStyle = STATUS_BADGE_COLOR[status];
                const cardBg = STATUS_BG_ACTIVITY[status] ?? '#fff';
                return (
                  <View key={activity.id} style={[styles.activityCard, { backgroundColor: cardBg }]}>
                    <View style={[styles.activityIconWrap, { backgroundColor: iconData.bg }]}>
                      <Image source={iconData.icon} style={styles.activityIcon} resizeMode="contain" />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTime}>{activity.time?.slice(0, 5) ?? '--:--'}</Text>
                      <Text style={styles.activityTitle} numberOfLines={1}>{activity.title}</Text>
                      {activity.location ? <Text style={styles.activityLocation} numberOfLines={1}>{activity.location}</Text> : null}
                    </View>
                    <View style={[styles.activityBadge, { backgroundColor: badgeStyle.bg }]}>
                      <Text style={[styles.activityBadgeText, { color: badgeStyle.text }]}>{status}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Budget Snapshot */}
          <View style={styles.sectionWrap}>
            <View style={styles.sectionTopRow}>
              <Text style={styles.sectionTitle}>✦ BUDGET SNAPSHOT</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Budget')}>
                <Text style={styles.seeAll}>Details</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.budgetCard}>
              <BudgetDonut percentage={budgetData.percentUsed} size={110} strokeWidth={13} />
              <View style={styles.budgetRows}>
                <BudgetRow label="Total budget" value={`${tripCurrency} ${budgetData.total.toLocaleString()}`} dotColor="#1A1A1A" />
                <BudgetRow label="Spent so far" value={`${tripCurrency} ${budgetData.spent.toLocaleString()}`} dotColor="#4CAF50" />
                <BudgetRow label="Today" value={`${tripCurrency} ${budgetData.todaySpending}`} dotColor="#FF9800" />
              </View>
              <Text style={styles.walletEmoji}>👛</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function BudgetRow({ label, value, dotColor }: { label: string; value: string; dotColor: string }) {
  return (
    <View style={styles.budgetRow}>
      <View style={[styles.budgetDot, { backgroundColor: dotColor }]} />
      <View>
        <Text style={styles.budgetLabel}>{label}</Text>
        <Text style={styles.budgetValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF8F0' },
  container: { flex: 1, backgroundColor: '#FFF8F0' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8, gap: 10 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconHeaderBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.72)', alignItems: 'center', justifyContent: 'center', position: 'relative', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  headerActionEmoji: { fontSize: 18 },
  notificationDot: { position: 'absolute', top: 5, right: 5, width: 9, height: 9, borderRadius: 5, backgroundColor: '#F44336', borderWidth: 1.5, borderColor: '#fff' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFE0B2', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  headerCenter: { flex: 1, alignItems: 'center' },
  greetingText: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  weatherPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF3E0', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginTop: 4 },
  weatherIcon: { fontSize: 12 },
  weatherText: { fontSize: 11, fontWeight: '600', color: '#E65100' },
  myTripsBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  myTripsBadge: { position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: 8, backgroundColor: '#4CAF50', alignItems: 'center', justifyContent: 'center' },
  myTripsBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },

  // Hero
  heroArea: { paddingHorizontal: 16, paddingBottom: 0, minHeight: 92, justifyContent: 'flex-end' },
  heroLandmarkArea: { alignItems: 'flex-end', paddingRight: 14 },
  heroLandmarkEmoji: { fontSize: 72 },

  // Trip cards
  emptyCarousel: { paddingHorizontal: 16, marginBottom: 12 },
  emptyBtn: { backgroundColor: '#fff', borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  tripCarouselShell: { height: 168 },
  tripCard: { height: 148, backgroundColor: '#fff', borderRadius: 24, shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 12, elevation: 6 },
  tripCardInner: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingRight: 18, paddingVertical: 18, paddingLeft: 22, gap: 12 },
  tripAvatarWrap: { alignSelf: 'center' },
  tripAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF9C4', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, elevation: 4 },
  tripCardLeft: { flex: 1 },
  tripNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  tripName: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', flex: 1 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' },
  tripDayRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  tripDayDotSmall: { width: 8, height: 8, borderRadius: 4 },
  tripDayText: { fontSize: 15, fontWeight: '700' },
  tripLocRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tripLocPin: { fontSize: 13 },
  tripLocText: { fontSize: 15, color: '#666', fontWeight: '500', flex: 1 },
  tripChevron: { fontSize: 26, color: '#CCC', fontWeight: '300' },
  paginationRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10, marginBottom: 4, gap: 6 },
  paginationDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#CCC' },
  paginationDotActive: { width: 18, backgroundColor: '#4CAF50', borderRadius: 3 },

  // Scrollable content
  scroll: { flex: 1 },
  contextCardWrap: { marginHorizontal: 16, marginTop: 12, marginBottom: 4 },

  // Quick access
  quickAccessCard: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 14,
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.045,
    shadowRadius: 12,
    elevation: 2,
  },

  // Grid
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
  },
  gridTile: {
    width: '31.5%',
    height: 94,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 6,
    paddingBottom: 6,
  },
gridIconCircle: {
  width: 72,
  height: 64,
  justifyContent: 'flex-start',
  alignItems: 'center',
  marginBottom: -4,
},
  gridIcon: {
    width: 72,
    height: 72,
  },
gridLabel: {
  marginTop: 0,
  fontSize: 12,
  fontWeight: '600',
  color: '#303030',
},

  // Activities
  sectionWrap: { marginHorizontal: 16, marginBottom: 16 },
  sectionTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#1A1A1A', letterSpacing: 0.8 },
  seeAll: { fontSize: 13, fontWeight: '600', color: '#4CAF50' },
  emptyActivities: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', gap: 6, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  emptyActivitiesEmoji: { fontSize: 32, marginBottom: 4 },
  emptyActivitiesText: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  emptyActivitiesAction: { fontSize: 12, color: '#4CAF50', fontWeight: '600' },
  activityCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  activityIconWrap: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  activityIcon: { width: 40, height: 40 },
  activityContent: { flex: 1 },
  activityTime: { fontSize: 12, fontWeight: '600', color: '#888', marginBottom: 2 },
  activityTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  activityLocation: { fontSize: 11, color: '#888', marginTop: 2 },
  activityBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  activityBadgeText: { fontSize: 10, fontWeight: '800' },

  // Budget
  budgetCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 3, flexDirection: 'row', alignItems: 'center', gap: 16, position: 'relative' },
  budgetRows: { flex: 1 },
  walletEmoji: { position: 'absolute', top: 12, right: 16, fontSize: 24 },
  budgetRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  budgetDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, flexShrink: 0 },
  budgetLabel: { fontSize: 11, color: '#888' },
  budgetValue: { fontSize: 14, fontWeight: '800', color: '#1A1A1A' },
});
