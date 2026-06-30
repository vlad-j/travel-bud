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
import HeroBanner from '../components/home/HeroBanner';
import TripCarousel from '../components/home/TripCarousel';
import QuickAccess from '../components/home/QuickAccess';
import TodayActivities from '../components/home/TodayActivities';
import BudgetSnapshot from '../components/home/BudgetSnapshot';
import HomeHeader from '../components/home/HomeHeader';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

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
       <HomeHeader
  greeting={getGreeting(userName)}
  weather={weather}
  tripCount={trips.length}
  statusBarHeight={statusBarHeight}
  heroColor={heroConfig.pillBg}
  onProfile={() => navigation.navigate('ProfileSettings')}
  onNotifications={() => navigation.navigate('Notifications')}
  onTrips={() => navigation.navigate('MyTrips')}
/>

<HeroBanner
  hero={heroConfig}
  destination={heroDestination?.name}
/>

        {/* ─── TRIP CARDS — horizontal FlatList (NOT inside ScrollView) */}
     <TripCarousel
  trips={trips}
  currentTripIndex={currentTripIndex}
  cardWidth={CARD_WIDTH}
  flatListRef={flatListRef}
  onTripChange={onTripChange}
  onOpenTrip={(tripId) => navigation.navigate('TripOverview', { tripId })}
  onCreateTrip={() => navigation.navigate('CreateTrip')}
  onJoinTrip={() => navigation.navigate('JoinTrip')}
/>

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
<QuickAccess
  tripId={currentTripIdRef.current}
  onNavigate={(screen, params) => navigation.navigate(screen, params)}
/>

<TodayActivities
  activities={activities}
  loading={activitiesLoading}
  onOpenItinerary={() => navigation.navigate('Itinerary')}
/>
          {/* Budget Snapshot */}
   <BudgetSnapshot
  currency={tripCurrency}
  total={budgetData.total}
  spent={budgetData.spent}
  today={budgetData.todaySpending}
  percent={budgetData.percentUsed}
  onPress={() => navigation.navigate('Budget')}
/>
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
  heroArea: { paddingHorizontal: 16, paddingTop: 2, paddingBottom: 0 },
  heroBackdrop: {
    height: 136,
    borderRadius: 30,
    backgroundColor: '#DFF3EC',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.10)',
  },
  heroBlob: { position: 'absolute', borderRadius: 999, opacity: 0.75 },
  heroBlobOne: { width: 150, height: 150, backgroundColor: '#FFF3D6', top: -58, left: -34 },
  heroBlobTwo: { width: 170, height: 170, backgroundColor: '#CFEDE4', right: -54, bottom: -74 },
  heroCloudLeft: { position: 'absolute', top: 20, left: 28, fontSize: 22, opacity: 0.82 },
  heroCloudRight: { position: 'absolute', top: 38, right: 98, fontSize: 18, opacity: 0.72 },
  heroDestinationPill: {
    position: 'absolute',
    left: 18,
    top: 58,
    maxWidth: '48%',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heroDestinationText: { fontSize: 13, fontWeight: '800', color: '#2E7D57' },
  heroHillBack: {
    position: 'absolute',
    left: -24,
    right: -42,
    bottom: -34,
    height: 78,
    backgroundColor: '#A7DCC3',
    borderTopLeftRadius: 120,
    borderTopRightRadius: 140,
    transform: [{ rotate: '-2deg' }],
  },
  heroHillFront: {
    position: 'absolute',
    left: 60,
    right: -18,
    bottom: -42,
    height: 82,
    backgroundColor: '#76C999',
    borderTopLeftRadius: 120,
    borderTopRightRadius: 120,
    transform: [{ rotate: '3deg' }],
  },
  heroIllustration: { position: 'absolute', right: -12, bottom: -10, width: 310, height: 145 },

  // Trip cards
  emptyCarousel: { paddingHorizontal: 16, marginBottom: 12 },
  emptyBtn: { backgroundColor: '#fff', borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  tripCarouselShell: { height: 158, marginTop: -20 },
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
  paginationRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 4, marginBottom: 4, gap: 6 },
  paginationDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#CCC' },
  paginationDotActive: { width: 18, backgroundColor: '#4CAF50', borderRadius: 3 },

  // Scrollable content
  scroll: { flex: 1 },
  contextCardWrap: { marginHorizontal: 16, marginTop: 12, marginBottom: 4 },


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

});
