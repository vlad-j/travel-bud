import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Circle, Path } from 'react-native-svg';
import StatusBadge from '../components/StatusBadge';
import { supabase } from '../lib/supabase';
import { useStatusBarHeight } from '../../hooks/useStatusBarHeight';
import { getDestinationHero } from '../lib/destinationHero';

function localDate(date: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d);
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

  const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diff + 1;
}

function getDaysUntilStart(startDate: string): number {
  const start = localDate(startDate);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return Math.max(
    Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
    0,
  );
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = localDate(startDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });

  const end = localDate(endDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return `${start} → ${end}`;
}

function getDestinationSummary(destinations: any[]): string {
  if (!destinations || destinations.length === 0) return 'No destinations yet';

  const visible = destinations.slice(0, 3).map((d) => d.name).filter(Boolean);
  const remaining = destinations.length - visible.length;

  if (remaining > 0) return `${visible.join(' • ')} +${remaining}`;
  return visible.join(' • ');
}

function getCurrentDestinationIndex(destinations: any[], currentDay: number): number {
  if (!destinations || destinations.length === 0) return 0;
  if (currentDay <= 0) return 0;

  let dayCounter = 0;

  for (let i = 0; i < destinations.length; i += 1) {
    const nights = destinations[i]?.nights ?? 1;
    dayCounter += nights;

    if (currentDay <= dayCounter) return i;
  }

  return destinations.length - 1;
}

function getTripMood(destinations: any[]): string {
  const names = destinations
    ?.map((d) => `${d?.name ?? ''} ${d?.country ?? ''}`.toLowerCase())
    .join(' ') ?? '';

  if (
    names.includes('phi phi') ||
    names.includes('phuket') ||
    names.includes('krabi') ||
    names.includes('bali') ||
    names.includes('island')
  ) {
    return '🏝 Island journey';
  }

  if (
    names.includes('bangkok') ||
    names.includes('chiang mai') ||
    names.includes('kyoto') ||
    names.includes('rome') ||
    names.includes('athens')
  ) {
    return '🏯 Culture adventure';
  }

  if (
    names.includes('bromo') ||
    names.includes('khao sok') ||
    names.includes('alps') ||
    names.includes('fuji') ||
    names.includes('mount')
  ) {
    return '🥾 Nature explorer';
  }

  if (destinations?.length >= 4) return '✨ Multi-stop adventure';

  return '✨ Travel journey';
}

function TripRouteMap({
  count,
  currentIndex,
  color,
}: {
  count: number;
  currentIndex: number;
  color: string;
}) {
  const visibleCount = Math.min(Math.max(count, 1), 6);

  const points = [
    { x: 18, y: 30 },
    { x: 68, y: 30 },
    { x: 108, y: 62 },
    { x: 160, y: 62 },
    { x: 202, y: 28 },
    { x: 250, y: 28 },
  ].slice(0, visibleCount);

  const path = points
    .map((point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      return `L ${point.x} ${point.y}`;
    })
    .join(' ');

  return (
    <View style={styles.routeMapWrap}>
      <Svg width="100%" height="100%" viewBox="0 0 268 92">
        {points.length > 1 && (
          <Path
            d={path}
            stroke={color}
            strokeWidth={7}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.28}
            fill="none"
          />
        )}

        {points.map((point, index) => {
          const isPast = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;

          return (
            <Circle
              key={`${point.x}-${point.y}`}
              cx={point.x}
              cy={point.y}
              r={isCurrent ? 10 : 7}
              fill={isFuture ? '#FFFCFA' : color}
              stroke={color}
              strokeWidth={isCurrent ? 4 : 3}
              opacity={isPast || isCurrent ? 1 : 0.75}
            />
          );
        })}
      </Svg>

      {count > 6 && (
        <View style={styles.routeMoreBadge}>
          <Text style={styles.routeMoreText}>+{count - 6}</Text>
        </View>
      )}
    </View>
  );
}

function HeroBanner({
  trip,
  destinations,
  theme,
}: {
  trip: any;
  destinations: any[];
  theme: any;
}) {
  const destinationName = destinations?.[0]?.name ?? trip.cover_destination ?? 'Next adventure';

  return (
    <View
      style={[
        styles.hero,
        {
          backgroundColor: theme.background,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={[styles.heroBlobOne, { backgroundColor: theme.blobOne }]} />
      <View style={[styles.heroBlobTwo, { backgroundColor: theme.blobTwo }]} />

      <Text style={styles.heroCloudLeft}>☁️</Text>
      <Text style={styles.heroCloudRight}>☁️</Text>

      <View style={[styles.heroHillBack, { backgroundColor: theme.hillBack }]} />
      <View style={[styles.heroHillFront, { backgroundColor: theme.hillFront }]} />

      <View style={[styles.heroPill, { backgroundColor: theme.pillBg }]}>
        <Text style={[styles.heroPillText, { color: theme.text }]} numberOfLines={1}>
          {destinationName}
        </Text>
      </View>

      <View style={styles.heroTitleBlock}>
        <Text style={styles.heroTitle} numberOfLines={2}>
          {trip.name}
        </Text>
        <Text style={styles.heroSubtitle} numberOfLines={1}>
          {getTripMood(destinations)}
        </Text>
      </View>
    </View>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function DestinationRow({
  destination,
  index,
  theme,
  onPress,
}: {
  destination: any;
  index: number;
  theme: any;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.destinationRow}
      onPress={onPress}
      activeOpacity={0.78}
    >
      <View style={[styles.destinationNumber, { backgroundColor: theme.blobOne }]}>
        <Text style={[styles.destinationNumberText, { color: theme.text }]}>
          {index + 1}
        </Text>
      </View>

      <View style={styles.destinationInfo}>
        <Text style={styles.destinationName} numberOfLines={1}>
          {destination.name}
        </Text>

        <Text style={styles.destinationMeta} numberOfLines={1}>
          {destination.nights ?? 0} nights
          {destination.country ? ` • ${destination.country}` : ''}
        </Text>
      </View>

      <Text style={styles.destinationChevron}>›</Text>
    </TouchableOpacity>
  );
}

export default function TripOverviewScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const statusBarHeight = useStatusBarHeight();

  const [trip, setTrip] = useState<any>(null);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const paramTripId = route.params?.tripId;
    let tripData: any = null;

    if (paramTripId) {
      const { data } = await supabase
        .from('trips')
        .select('*')
        .eq('id', paramTripId)
        .single();

      tripData = data;
    } else {
      const { data: memberships } = await supabase
        .from('trip_members')
        .select('trip_id')
        .eq('user_id', user.id);

      if (!memberships || memberships.length === 0) {
        setLoading(false);
        return;
      }

      const tripIds = memberships.map((m: any) => m.trip_id);

      const { data: tripsData } = await supabase
        .from('trips')
        .select('*')
        .in('id', tripIds)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      tripData = tripsData?.[0] ?? null;
    }

    if (!tripData) {
      setLoading(false);
      return;
    }

    setTrip(tripData);

    const { data: destsData } = await supabase
      .from('destinations')
      .select('*')
      .eq('trip_id', tripData.id)
      .order('order_index', { ascending: true });

    setDestinations(destsData ?? []);

    const { data: expData } = await supabase
      .from('expenses')
      .select('amount')
      .eq('trip_id', tripData.id);

    setExpenses(expData ?? []);

    const { data: actsData } = await supabase
      .from('activities')
      .select('id')
      .eq('trip_id', tripData.id);

    setActivities(actsData ?? []);

    setLoading(false);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      </SafeAreaView>
    );
  }

  if (!trip) {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <View style={[styles.header, { paddingTop: statusBarHeight + 12 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trip Overview</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>✈️</Text>
          <Text style={styles.emptyTitle}>No active trip</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalDays = getTotalDays(trip.start_date, trip.end_date);
  const currentDay = getCurrentDay(trip.start_date, trip.end_date);
  const safeDay = Math.min(Math.max(currentDay, 1), totalDays);
  const daysUntilStart = getDaysUntilStart(trip.start_date);
  const isUpcoming = daysUntilStart > 0;
  const daysLeft = Math.max(totalDays - safeDay, 0);

  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const percentUsed = trip.budget > 0 ? Math.round((totalSpent / trip.budget) * 100) : 0;
  const progressPercent = isUpcoming ? 0 : Math.round((safeDay / totalDays) * 100);

  const firstDestination = destinations[0] ?? null;
  const theme = getDestinationHero(firstDestination?.name, firstDestination?.country);
  const currentDestinationIndex = getCurrentDestinationIndex(destinations, safeDay);

  const currency = trip.currency ?? 'EUR';

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={[styles.header, { paddingTop: statusBarHeight + 12 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Trip Overview</Text>

          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => navigation.navigate('TripSettings', { tripId: trip.id })}
            activeOpacity={0.8}
          >
            <Text style={styles.settingsIcon}>⋯</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroWrap}>
          <HeroBanner trip={trip} destinations={destinations} theme={theme} />
        </View>

        <View
          style={[
            styles.progressCard,
            {
              backgroundColor: theme.hillBack,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.progressTopRow}>
            <View style={styles.progressTextBlock}>
              <Text style={styles.progressTitle}>
                {isUpcoming ? `Departs in ${daysUntilStart} days` : `Day ${safeDay} of ${totalDays}`}
              </Text>

              <Text style={styles.progressSubtitle}>
                {isUpcoming ? `${totalDays} days total` : `${daysLeft} days left`}
              </Text>
            </View>

            <TripRouteMap
              count={destinations.length}
              currentIndex={currentDestinationIndex}
              color={theme.text}
            />
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPercent}%`,
                  backgroundColor: theme.text,
                },
              ]}
            />
          </View>

          <View style={styles.destinationSummaryRow}>
            <View>
              <Text style={styles.destinationSummaryLabel}>
                📍 {destinations.length} destinations
              </Text>

              <Text style={styles.destinationSummaryText} numberOfLines={1}>
                {getDestinationSummary(destinations)}
              </Text>
            </View>

            <Text style={styles.progressPercent}>{progressPercent}%</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatCard icon="📅" label="Days" value={String(totalDays)} />
          <StatCard icon="📍" label="Destinations" value={String(destinations.length)} />
          <StatCard icon="🎯" label="Activities" value={String(activities.length)} />
          <StatCard icon="💸" label="Spent" value={`${currency} ${totalSpent.toFixed(0)}`} />
        </View>

        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: theme.background,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Destinations</Text>
              <Text style={styles.sectionSubtitle}>
                Your route, stop by stop
              </Text>
            </View>
          </View>

          <View style={styles.destinationList}>
            {destinations.map((destination, index) => (
              <DestinationRow
                key={destination.id}
                destination={destination}
                index={index}
                theme={theme}
                onPress={() => navigation.navigate('DestinationDetails', { destinationId: destination.id })}
              />
            ))}
          </View>
        </View>

        <View style={styles.budgetCard}>
          <View>
            <Text style={styles.sectionTitle}>Budget</Text>
            <Text style={styles.sectionSubtitle}>
              {currency} {totalSpent.toFixed(0)} spent of {currency} {trip.budget?.toLocaleString() ?? 0}
            </Text>
          </View>

          <View style={styles.budgetTrack}>
            <View
              style={[
                styles.budgetFill,
                {
                  width: `${Math.min(percentUsed, 100)}%`,
                  backgroundColor: theme.text,
                },
              ]}
            />
          </View>

          <Text style={styles.budgetPercent}>{percentUsed}% used</Text>
        </View>

        <View style={{ height: 28 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingBottom: 120,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backIcon: {
    fontSize: 30,
    color: '#1A1A1A',
    fontWeight: '300',
    marginTop: -2,
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
  },

  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  settingsIcon: {
    fontSize: 24,
    color: '#1A1A1A',
    fontWeight: '800',
    marginTop: -4,
  },

  heroWrap: {
    marginHorizontal: 16,
  },

  hero: {
    height: 190,
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },

  heroBlobOne: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 999,
    top: -64,
    left: -44,
    opacity: 0.78,
  },

  heroBlobTwo: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 999,
    right: -70,
    bottom: -88,
    opacity: 0.72,
  },

  heroCloudLeft: {
    position: 'absolute',
    top: 24,
    left: 34,
    fontSize: 24,
    opacity: 0.72,
  },

  heroCloudRight: {
    position: 'absolute',
    top: 42,
    right: 72,
    fontSize: 20,
    opacity: 0.62,
  },

  heroHillBack: {
    position: 'absolute',
    left: -24,
    right: -40,
    bottom: -38,
    height: 92,
    borderTopLeftRadius: 130,
    borderTopRightRadius: 150,
    transform: [{ rotate: '-2deg' }],
  },

  heroHillFront: {
    position: 'absolute',
    left: 72,
    right: -16,
    bottom: -48,
    height: 96,
    borderTopLeftRadius: 130,
    borderTopRightRadius: 130,
    transform: [{ rotate: '3deg' }],
  },

  heroPill: {
    position: 'absolute',
    top: 18,
    left: 18,
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 7,
    maxWidth: '58%',
  },

  heroPillText: {
    fontSize: 13,
    fontWeight: '900',
  },

  heroTitleBlock: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 24,
  },

  heroTitle: {
    fontSize: 27,
    fontWeight: '900',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },

  heroSubtitle: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '800',
    color: '#3D2B1F',
    opacity: 0.74,
  },

  progressCard: {
    marginHorizontal: 16,
    marginTop: -22,
    borderRadius: 30,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 7 },
    elevation: 7,
  },

  progressTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },

  progressTextBlock: {
    flex: 1,
  },

  progressTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A1A1A',
  },

  progressSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '800',
    color: '#3D2B1F',
    opacity: 0.72,
  },

  routeMapWrap: {
    width: 138,
    height: 72,
    position: 'relative',
    marginTop: -4,
  },

  routeMoreBadge: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFCFA',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },

  routeMoreText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#1A1A1A',
  },

  progressTrack: {
    marginTop: 12,
    height: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.55)',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 999,
  },

  destinationSummaryRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
  },

  destinationSummaryLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#1A1A1A',
    opacity: 0.8,
  },

  destinationSummaryText: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '700',
    color: '#3D2B1F',
    opacity: 0.78,
    maxWidth: 230,
  },

  progressPercent: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A1A1A',
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 16,
  },

  statCard: {
    width: '48.5%',
    backgroundColor: '#FFFCFA',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#F3EFEA',
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.045,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  statIcon: {
    fontSize: 23,
    marginBottom: 8,
  },

  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A1A1A',
  },

  statLabel: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
    color: '#8A817A',
  },

  sectionCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },

  sectionHeader: {
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },

  sectionSubtitle: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '700',
    color: '#8A817A',
  },

  destinationList: {
    gap: 8,
  },

  destinationRow: {
    minHeight: 70,
    borderRadius: 20,
    backgroundColor: '#FFFCFA',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },

  destinationNumber: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  destinationNumberText: {
    fontSize: 16,
    fontWeight: '900',
  },

  destinationInfo: {
    flex: 1,
  },

  destinationName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1A1A1A',
  },

  destinationMeta: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    color: '#8A817A',
  },

  destinationChevron: {
    fontSize: 24,
    color: '#B8AEA5',
    fontWeight: '300',
    marginLeft: 10,
  },

  budgetCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#FFFCFA',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#F3EFEA',
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },

  budgetTrack: {
    marginTop: 14,
    height: 9,
    borderRadius: 999,
    backgroundColor: '#F2ECE6',
    overflow: 'hidden',
  },

  budgetFill: {
    height: '100%',
    borderRadius: 999,
  },

  budgetPercent: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '800',
    color: '#8A817A',
  },

  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
});