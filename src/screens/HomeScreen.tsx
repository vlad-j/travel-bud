import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Dimensions, ActivityIndicator, FlatList, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import CartoonIcon from '../components/CartoonIcon';
import StatusBadge from '../components/StatusBadge';
import BudgetDonut from '../components/BudgetDonut';
import ContextCard from '../components/ContextCard';
import { Sparkle, Dot } from '../components/TravelDecorations';
import { STATUS_BG } from '../data/colors';
import { getTodayActivities, calculateTripStatus } from '../lib/tripService';
import { useCurrentTrip, currentTripIdRef } from '../context/TripContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useStatusBarHeight } from '../../hooks/useStatusBarHeight';
import { getDestinationHero } from '../lib/destinationHero';
import { evaluateContextCard } from '../lib/contextCardProvider';
import type { ContextCardInput } from '../lib/contextCardProvider';
import { useWeather } from '../../hooks/useWeather';

function WalletEmoji() {
  return <Text style={{ fontSize: 28 }}>👛</Text>;
}

const { width } = Dimensions.get('window');
const HERO_H = 200;
const CARD_WIDTH = width - 32;

const QUICK_PILLS = [
  { label: 'Packing', icon: require('../../assets/icons/packing.png'), screen: 'Packing' as const, color: '#4CAF50' },
  { label: 'Documents', icon: require('../../assets/icons/documents.png'), screen: 'Documents' as const, color: '#FF9800' },
  { label: 'Accommodation', icon: require('../../assets/icons/accom.png'), screen: 'Accommodation' as const, color: '#9C27B0' },
  { label: 'Transport', icon: require('../../assets/icons/transportation.png'), screen: 'Transport' as const, color: '#2196F3' },
  { label: 'Memories', icon: require('../../assets/icons/memories.png'), screen: 'MemoriesRecap' as const, color: '#FF9800' },
  { label: 'Trip Settings', icon: require('../../assets/icons/tripSettings.png'), screen: 'TripSettings' as const, color: '#666' },
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

function getGreeting(name: string): { text: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return { text: `Good morning${name ? `, ${name}` : ''}`, emoji: '☀️' };
  if (hour >= 12 && hour < 17) return { text: `Good afternoon${name ? `, ${name}` : ''}`, emoji: '🌤️' };
  if (hour >= 17 && hour < 21) return { text: `Good evening${name ? `, ${name}` : ''}`, emoji: '🌅' };
  return { text: `Good night${name ? `, ${name}` : ''}`, emoji: '🌙' };
}

function localDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const CATEGORY_ICONS: Record<string, { icon: string; bg: string }> = {
  food: { icon: '🍜', bg: '#FFF3E0' },
  transport: { icon: '🚗', bg: '#E3F2FD' },
  accommodation: { icon: '🏡', bg: '#FCE4EC' },
  activity: { icon: '🎯', bg: '#E8F5E9' },
  flight: { icon: '✈️', bg: '#EDE7F6' },
  default: { icon: '📍', bg: '#F5F5F5' },
};

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { setCurrentTripId, currentDestination } = useCurrentTrip();
  const statusBarHeight = useStatusBarHeight();

  const [trips, setTrips] = useState<any[]>([]);
  const [currentTripIndex, setCurrentTripIndex] = useState(0);
  const currentTripIndexRef = useRef(0);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const tripsLoadedRef = useRef(false);
  const [budgetData, setBudgetData] = useState({ total: 0, spent: 0, todaySpending: 0, percentUsed: 0 });
  const [contextCardInput, setContextCardInput] = useState<ContextCardInput | null>(null);
  const [userName, setUserName] = useState('');

  // Weather for current destination
  const weatherQuery = currentDestination?.name ?? currentDestination?.country ?? null;
  const { weather } = useWeather(weatherQuery);

  // Load user name once
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('profiles').select('name').eq('id', user.id).single().then(({ data }) => {
        if (data?.name) setUserName(data.name.split(' ')[0]);
      });
    });
  }, []);

  useFocusEffect(useCallback(() => {
    loadData();
  }, []));

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: memberships } = await supabase
      .from('trip_members').select('trip_id').eq('user_id', user.id);

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
        currentTripIndexRef.current = 0;
        setCurrentTripIndex(0);
        const acts = await getTodayActivities(sorted[0].id);
        setActivities(acts);
        await loadBudget(sorted[0].id, sorted[0].budget ?? 0, sorted[0].currency ?? 'EUR');
        await loadContextCardData(sorted[0].id, sorted[0].budget ?? 0, sorted[0].currency ?? 'EUR', acts);
      } else if (tripsLoadedRef.current) {
        const idx = currentTripIndexRef.current;
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
    currentTripIndexRef.current = index;
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
    const { data: allExpenses } = await supabase
      .from('expenses').select('amount, date').eq('trip_id', tripId);
    const spent = (allExpenses ?? []).reduce((sum, e) => sum + Number(e.amount), 0);
    const todaySpending = (allExpenses ?? [])
      .filter(e => e.date?.startsWith(today))
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const percentUsed = totalBudget > 0 ? Math.round((spent / totalBudget) * 100) : 0;
    setBudgetData({ total: totalBudget, spent: Math.round(spent), todaySpending: Math.round(todaySpending), percentUsed });
  }

  async function loadContextCardData(tripId: string, totalBudget: number, currency: string, todayActs: any[]) {
    const now = new Date();
    const today = localDateStr(now);
    const tomorrow = localDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));

    // Fetch in parallel — minimal data only
    const [transportRes, accommodationRes, expensesRes, journalRes] = await Promise.all([
      supabase.from('transport')
        .select('id, type, departure_location, arrival_location, departure_time, arrival_time')
        .eq('trip_id', tripId)
        .in('status', ['UPCOMING', 'upcoming'])
        .order('departure_time', { ascending: true }),

      supabase.from('accommodations')
        .select('id, name, check_in_date, check_out_date')
        .eq('trip_id', tripId),

      supabase.from('expenses')
        .select('amount')
        .eq('trip_id', tripId),

      supabase.from('journal_entries')
        .select('id')
        .eq('trip_id', tripId)
        .gte('date', `${today}T00:00:00`)
        .lte('date', `${today}T23:59:59`)
        .limit(1),
    ]);

    const transport = transportRes.data ?? [];
    const accommodations = accommodationRes.data ?? [];
    const expenses = expensesRes.data ?? [];
    const journalEntries = journalRes.data ?? [];

    // Find relevant transport
    const flightToday = transport.find(t =>
      t.type === 'Flight' && t.departure_time?.startsWith(today)
    ) ?? null;

    const flightTomorrow = transport.find(t =>
      t.type === 'Flight' && t.departure_time?.startsWith(tomorrow)
    ) ?? null;

    const transportToday = !flightToday
      ? transport.find(t => t.type !== 'Flight' && t.departure_time?.startsWith(today)) ?? null
      : null;

    // Accommodation
    const checkinToday = accommodations.find(a => a.check_in_date === today) ?? null;
    const checkoutToday = accommodations.find(a => a.check_out_date === today) ?? null;

    // Activities
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const nextActivity = todayActs
      .filter(a => a.time && a.status !== 'completed')
      .find(a => {
        const [h, m] = a.time.split(':').map(Number);
        return h * 60 + m >= nowMinutes;
      }) ?? null;

    // Budget
    const budgetSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    const input: ContextCardInput = {
      flightToday,
      flightTomorrow,
      transportToday,
      checkinToday,
      checkoutToday,
      activitiesTodayCount: todayActs.length,
      nextActivity: nextActivity ? {
        id: nextActivity.id,
        title: nextActivity.title,
        time: nextActivity.time,
        location: nextActivity.location ?? null,
      } : null,
      budgetTotal: totalBudget,
      budgetSpent: Math.round(budgetSpent),
      hasJournalToday: journalEntries.length > 0,
      currentHour: now.getHours(),
    };

    setContextCardInput(input);
  }

  const currentTrip = trips[currentTripIndex];
  const greeting = getGreeting(userName);

  // Hero: use TripContext currentDestination if available, else trip data
  const heroDestination = currentDestination ?? currentTrip?.destinations?.[0] ?? null;
  const heroConfig = getDestinationHero(heroDestination?.name, heroDestination?.country);

  // Context card
  const contextCard = contextCardInput ? evaluateContextCard(contextCardInput) : null;
  const tripCurrency = currentTrip?.currency ?? 'EUR';

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ─── Hero ─────────────────────────────────────────────────── */}
        <View style={styles.heroBlock}>
          <View style={[styles.heroScene, { height: HERO_H + statusBarHeight }]}>
            <View style={styles.heroBgSky} />
            <View style={styles.heroBgGround} />
            <View style={[styles.heroHill, { left: -10, backgroundColor: '#66BB6A' }]} />
            <View style={[styles.heroHill, { right: -10, backgroundColor: '#81C784', width: 160 }]} />
            <View style={styles.heroLandmarkWrap}>
              <Text style={styles.heroLandmarkEmoji}>{heroConfig.emoji}</Text>
            </View>
            <Text style={[styles.heroDecor, { left: 18, top: 16 }]}>☁️</Text>
            <Text style={[styles.heroDecor, { left: 80, top: 22 }]}>☁️</Text>
            <Text style={[styles.heroDecor, { right: 18, top: 14 }]}>☀️</Text>
            <Text style={[styles.heroDecor, { left: 14, bottom: 52 }]}>🌴</Text>
            <Text style={[styles.heroDecor, { right: 16, bottom: 56 }]}>🌴</Text>
            <Sparkle color="#FFD700" size={12} style={{ position: 'absolute', left: 46, top: 34 }} />
            <Sparkle color="#FFD700" size={10} style={{ position: 'absolute', right: 54, top: 28 }} />

            {/* Greeting + Weather */}
            <View style={[styles.greetingWrap, { top: statusBarHeight + 12 }]}>
              <Text style={styles.greetingText}>{greeting.text} {greeting.emoji}</Text>
              {weather && (
                <View style={styles.weatherPill}>
                  <Text style={styles.weatherEmoji}>{weather.icon}</Text>
                  <Text style={styles.weatherText}>{weather.tempC}°C · {weather.condition}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Bell + MyTrips buttons */}
          <TouchableOpacity
            style={[styles.heroBell, { top: statusBarHeight + 14 }]}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 20 }}>🔔</Text>
            <View style={styles.bellDot} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.heroTripsBtn, { top: statusBarHeight + 14 }]}
            onPress={() => navigation.navigate('MyTrips')}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 18 }}>🗺️</Text>
            {trips.length > 0 && (
              <View style={styles.tripCountBadge}>
                <Text style={styles.tripCountText}>{trips.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Trip carousel or empty state */}
          {trips.length === 0 ? (
            <View style={styles.emptyTripWrap}>
              <TouchableOpacity
                style={styles.tripCard}
                onPress={() => navigation.navigate('CreateTrip')}
                activeOpacity={0.88}
              >
                <View style={styles.tripCardInner}>
                  <View style={styles.tripAvatar}>
                    <Text style={{ fontSize: 22 }}>✈️</Text>
                  </View>
                  <View style={styles.tripCardLeft}>
                    <Text style={styles.tripName}>Create a trip</Text>
                    <Text style={styles.tripDayText}>Plan your next adventure</Text>
                  </View>
                  <Text style={styles.tripChevronText}>›</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.joinTripCard}
                onPress={() => navigation.navigate('JoinTrip')}
                activeOpacity={0.88}
              >
                <View style={styles.tripCardInner}>
                  <View style={[styles.tripAvatar, { backgroundColor: '#E3F2FD' }]}>
                    <Text style={{ fontSize: 22 }}>🔗</Text>
                  </View>
                  <View style={styles.tripCardLeft}>
                    <Text style={styles.tripName}>Join a trip</Text>
                    <Text style={styles.tripDayText}>Enter an invite code</Text>
                  </View>
                  <Text style={styles.tripChevronText}>›</Text>
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.carouselWrap}>
              <FlatList
                ref={flatListRef}
                data={trips}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
                  onTripChange(index);
                }}
                renderItem={({ item }) => {
                  const dayNum = getDayNumber(item.start_date);
                  const totalD = getTotalDays(item.start_date, item.end_date);
                  const loc = item.destinations?.[0]?.name ?? '';
                  const active = item.computedStatus === 'active';
                  return (
                    <TouchableOpacity
                      style={[styles.tripCard, styles.carouselCard]}
                      onPress={() => navigation.navigate('TripOverview', { tripId: item.id })}
                      activeOpacity={0.88}
                    >
                      <View style={styles.tripCardInner}>
                        <TouchableOpacity
                          onPress={() => navigation.navigate('ProfileSettings')}
                          activeOpacity={0.8}
                          style={styles.tripAvatarWrap}
                        >
                          <View style={styles.tripAvatar}>
                            <Text style={{ fontSize: 22 }}>👨</Text>
                          </View>
                        </TouchableOpacity>
                        <View style={styles.tripCardLeft}>
                          <View style={styles.tripNameRow}>
                            <Text style={styles.tripName} numberOfLines={1}>{item.name}</Text>
                            {active && <View style={styles.activeDot} />}
                          </View>
                          <View style={styles.tripDayRow}>
                            <View style={[styles.tripDayDot, { backgroundColor: active ? '#4CAF50' : '#888' }]} />
                            <Text style={[styles.tripDayText, { color: active ? '#4CAF50' : '#888' }]}>
                              {active ? `Day ${dayNum} of ${totalD}` : item.computedStatus?.toUpperCase()}
                            </Text>
                          </View>
                          {loc ? (
                            <View style={styles.tripLocRow}>
                              <Text style={styles.tripLocIcon}>📍</Text>
                              <Text style={styles.tripLocText}>{loc}</Text>
                            </View>
                          ) : null}
                        </View>
                        <View style={styles.tripCardChevron}>
                          <Text style={styles.tripChevronText}>›</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
              {trips.length > 1 && (
                <View style={styles.paginationRow}>
                  {trips.map((_, i) => (
                    <View
                      key={i}
                      style={[styles.paginationDot, i === currentTripIndex && styles.paginationDotActive]}
                    />
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* ─── Context Card ─────────────────────────────────────────── */}
        {contextCard && (
          <View style={styles.contextCardWrap}>
            <ContextCard
              card={contextCard}
              currency={tripCurrency}
              onAction={(screen, params) => navigation.navigate(screen, params)}
            />
          </View>
        )}

        {/* ─── Quick Pills ──────────────────────────────────────────── */}
        <View style={[styles.gridWrap, { marginTop: -(statusBarHeight + 30) }]}>
          {QUICK_PILLS.map((pill) => (
            <TouchableOpacity
              key={pill.label}
              style={styles.gridTile}
              onPress={() => navigation.navigate(pill.screen, { tripId: currentTripIdRef.current })}
              activeOpacity={0.75}
            >
              <View style={styles.gridIconCircle}>
                <Image source={pill.icon} style={styles.gridIconImage} resizeMode="cover" />
              </View>
              <Text style={[styles.gridLabel, { color: pill.color }]}>{pill.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── Today's Activities ───────────────────────────────────── */}
        <SectionBlock
          title="TODAY'S ACTIVITIES"
          headerColor="#C8E6C9"
          textColor="#1B5E20"
          right={<Text style={styles.seeAll}>See all</Text>}
        >
          {activitiesLoading ? (
            <ActivityIndicator color="#4CAF50" style={{ padding: 20 }} />
          ) : activities.length > 0 ? (
            activities.map((activity) => {
              const status = getActivityStatus(activity.time?.slice(0, 5) ?? '00:00', activity.status ?? 'upcoming');
              const iconData = CATEGORY_ICONS[activity.category?.toLowerCase() ?? 'default'] ?? CATEGORY_ICONS.default;
              return (
                <View
                  key={activity.id}
                  style={[styles.activityCard, { backgroundColor: STATUS_BG[status] ?? '#fff' }]}
                >
                  <View style={styles.activityTimeCol}>
                    <Text style={styles.activityTime}>{activity.time?.slice(0, 5)}</Text>
                  </View>
                  <CartoonIcon emoji={iconData.icon} bg={iconData.bg} size={46} />
                  <View style={styles.activityTextCol}>
                    <Text style={styles.activityTitle} numberOfLines={1}>{activity.title}</Text>
                    {activity.location ? (
                      <Text style={styles.activitySub} numberOfLines={1}>{activity.location}</Text>
                    ) : null}
                  </View>
                  <StatusBadge status={status} small />
                </View>
              );
            })
          ) : (
            <Text style={{ padding: 16, color: '#888', textAlign: 'center' }}>
              No activities for today
            </Text>
          )}
        </SectionBlock>

        {/* ─── Budget Snapshot ──────────────────────────────────────── */}
        <SectionBlock
          title="BUDGET SNAPSHOT"
          headerColor="#C8E6C9"
          textColor="#1B5E20"
          right={<Sparkle color="#1B5E20" size={14} style={{ position: 'relative' }} />}
        >
          <View style={styles.budgetCard}>
            <View style={styles.budgetLeft}>
              <BudgetDonut percentage={budgetData.percentUsed} size={108} strokeWidth={12} />
            </View>
            <View style={styles.budgetRight}>
              <BudgetRow label="Total budget" value={`${tripCurrency} ${budgetData.total.toLocaleString()}`} dotColor="#1A1A1A" />
              <BudgetRow label="Spent so far" value={`${tripCurrency} ${budgetData.spent.toLocaleString()}`} dotColor="#4CAF50" />
              <BudgetRow label="Today's spending" value={`${tripCurrency} ${budgetData.todaySpending}`} dotColor="#FF9800" />
            </View>
            <View style={styles.walletEmojiWrap}>
              <WalletEmoji />
            </View>
          </View>
        </SectionBlock>

        {/* TODO: Travel Feed — populate with real events in future phases */}

        <View style={styles.footerDecor}>
          <Dot color="#DDD" size={5} style={{ position: 'relative' }} />
          <Dot color="#DDD" size={4} style={{ position: 'relative', marginLeft: 8 }} />
          <Dot color="#DDD" size={6} style={{ position: 'relative', marginLeft: 6 }} />
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionBlock({ title, headerColor, textColor, right, children }: {
  title: string; headerColor: string; textColor: string; right?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionBlock}>
      <View style={[styles.sectionHeader, { backgroundColor: headerColor }]}>
        <View style={styles.sectionTitleWrap}>
          <Sparkle color={textColor} size={12} style={{ position: 'relative', marginRight: 6 }} />
          <Text style={[styles.sectionTitle, { color: textColor }]}>{title}</Text>
        </View>
        {right}
      </View>
      <View style={styles.sectionCard}>{children}</View>
    </View>
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
  safe: { flex: 1, backgroundColor: '#E8E8E8' },
  scroll: { flex: 1 },
  heroBlock: { position: 'relative', marginBottom: 80 },
  heroScene: { overflow: 'hidden', position: 'relative' },
  heroBgSky: { ...StyleSheet.absoluteFillObject, backgroundColor: '#81D4FA' },
  heroBgGround: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, backgroundColor: '#A5D6A7' },
  heroHill: { position: 'absolute', bottom: 0, width: 140, height: 80, borderRadius: 60 },
  heroLandmarkWrap: { position: 'absolute', bottom: 28, left: 0, right: 0, alignItems: 'center' },
  heroLandmarkEmoji: { fontSize: 80 },
  heroDecor: { position: 'absolute', fontSize: 22 },
  greetingWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  greetingText: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.92)', textShadowColor: 'rgba(0,0,0,0.15)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  weatherPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginTop: 6 },
  weatherEmoji: { fontSize: 14 },
  weatherText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.92)' },
  heroBell: { position: 'absolute', right: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.28)', alignItems: 'center', justifyContent: 'center' },
  bellDot: { position: 'absolute', top: 6, right: 6, width: 9, height: 9, borderRadius: 4.5, backgroundColor: '#FF5252', borderWidth: 1.5, borderColor: '#fff' },
  heroTripsBtn: { position: 'absolute', left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.28)', alignItems: 'center', justifyContent: 'center' },
  tripCountBadge: { position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: '#4CAF50', alignItems: 'center', justifyContent: 'center' },
  tripCountText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  emptyTripWrap: { position: 'absolute', bottom: -80, left: 16, right: 16, gap: 10 },
  carouselWrap: { position: 'absolute', bottom: -60, left: 0, right: 0 },
  tripCard: { backgroundColor: '#fff', borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  joinTripCard: { backgroundColor: '#fff', borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  carouselCard: { width: CARD_WIDTH, marginHorizontal: 16 },
  tripCardInner: { flexDirection: 'row', alignItems: 'center', paddingRight: 14, paddingVertical: 12, paddingLeft: 10, gap: 10 },
  tripAvatarWrap: { alignSelf: 'flex-start', marginTop: -22 },
  tripAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF9C4', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 },
  tripCardLeft: { flex: 1 },
  tripNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  tripName: { fontSize: 16, fontWeight: '800', color: '#1A1A1A', flex: 1 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' },
  tripDayRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  tripDayDot: { width: 8, height: 8, borderRadius: 4 },
  tripDayText: { fontSize: 13, fontWeight: '600' },
  tripLocRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tripLocIcon: { fontSize: 13 },
  tripLocText: { fontSize: 13, color: '#666', fontWeight: '500', flex: 1 },
  tripCardChevron: { paddingLeft: 4 },
  tripChevronText: { fontSize: 26, color: '#CCC', fontWeight: '300' },
  paginationRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8, gap: 6 },
  paginationDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#CCC' },
  paginationDotActive: { width: 18, backgroundColor: '#4CAF50' },
  contextCardWrap: { marginHorizontal: 16, marginBottom: 8 },
  gridWrap: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingVertical: 16, justifyContent: 'space-between', rowGap: 20 },
  gridTile: { width: '30%', alignItems: 'center', justifyContent: 'center', gap: 8 },
  gridIconCircle: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  gridIconImage: { width: '100%', height: '100%' },
  gridLabel: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  sectionBlock: { marginHorizontal: 16, marginTop: 16, borderRadius: 20, overflow: 'hidden', backgroundColor: '#C8E6C9', borderWidth: 3, borderColor: '#C8E6C9' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 24 },
  sectionTitleWrap: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  seeAll: { fontSize: 13, fontWeight: '600', color: '#1B5E20' },
  sectionCard: { backgroundColor: '#fff', borderRadius: 16, margin: 4, marginTop: -16, paddingHorizontal: 10, paddingVertical: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: -2 }, elevation: 3 },
  activityCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 10, marginBottom: 6 },
  activityTimeCol: { width: 40, alignItems: 'flex-start' },
  activityTime: { fontSize: 12, fontWeight: '600', color: '#666' },
  activityTextCol: { flex: 1 },
  activityTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  activitySub: { fontSize: 12, color: '#888', marginTop: 2 },
  budgetCard: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  budgetLeft: { alignItems: 'center', justifyContent: 'center' },
  budgetRight: { flex: 1 },
  walletEmojiWrap: { position: 'absolute', top: -4, right: 0 },
  budgetRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  budgetDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, flexShrink: 0 },
  budgetLabel: { fontSize: 11, color: '#888', marginBottom: 1 },
  budgetValue: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  footerDecor: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
});
