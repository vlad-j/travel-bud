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
import { supabase } from '../lib/supabase';
import { useStatusBarHeight } from '../../hooks/useStatusBarHeight';
import { getDestinationHero } from '../lib/destinationHero';
import TripHero from '../components/tripOverview/TripHero';
import JourneyTimeline, { TimelineItem, TransportMode } from '../components/tripOverview/JourneyTimeline';
import WhatsNextRow, { WhatsNextItem } from '../components/tripOverview/WhatsNextRow';
import { JourneyCardData } from '../components/tripOverview/JourneyCard';

// ─── Date helpers (unchanged business logic) ──────────────────────────────────
function localDate(date: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function localDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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

  if (names.includes('phi phi') || names.includes('phuket') || names.includes('krabi') || names.includes('bali') || names.includes('island')) {
    return '🏝 Island journey';
  }
  if (names.includes('bangkok') || names.includes('chiang mai') || names.includes('kyoto') || names.includes('rome') || names.includes('athens')) {
    return '🏯 Culture adventure';
  }
  if (names.includes('bromo') || names.includes('khao sok') || names.includes('alps') || names.includes('fuji') || names.includes('mount')) {
    return '🥾 Nature explorer';
  }
  if (destinations?.length >= 4) return '✨ Multi-stop adventure';
  return '✨ Travel journey';
}

// ─── Cumulative destination date calculation ──────────────────────────────────
function getDestinationDateRange(
  destinations: any[],
  index: number,
  tripStartDate: string,
): { arrival: string; departure: string } {
  const dest = destinations[index];

  // Prefer explicit fields if present on the destination row
  if (dest?.start_date && dest?.end_date) {
    return { arrival: dest.start_date, departure: dest.end_date };
  }

  // Otherwise calculate cumulatively from nights
  let dayOffset = 0;
  for (let i = 0; i < index; i += 1) {
    dayOffset += destinations[i]?.nights ?? 1;
  }
  const nights = dest?.nights ?? 1;

  const [sy, sm, sd] = tripStartDate.split('-').map(Number);
  const arrivalDate = new Date(sy, sm - 1, sd + dayOffset);
  const departureDate = new Date(sy, sm - 1, sd + dayOffset + nights);

  return {
    arrival: localDateStr(arrivalDate),
    departure: localDateStr(departureDate),
  };
}

// ─── Category emoji (for highlights dedup logic) ──────────────────────────────
const CATEGORY_EMOJI: Record<string, string> = {
  food: '🍜', activity: '🎯', shopping: '🛍️', other: '📍',
};

const TRANSPORT_TYPE_TO_MODE: Record<string, TransportMode> = {
  Flight: 'flight',
  Train: 'train',
  Bus: 'bus',
  Ferry: 'boat',
  Boat: 'boat',
  Car: 'car',
  Taxi: 'car',
  Walking: 'walk',
};

export default function TripOverviewScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const statusBarHeight = useStatusBarHeight();

  const [trip, setTrip] = useState<any>(null);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [accommodations, setAccommodations] = useState<any[]>([]);
  const [transport, setTransport] = useState<any[]>([]);
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
      .select('*')
      .eq('trip_id', tripData.id)
      .order('date', { ascending: true })
      .order('time', { ascending: true });
    setActivities(actsData ?? []);

    const { data: accomData } = await supabase
      .from('accommodations')
      .select('*')
      .eq('trip_id', tripData.id);
    setAccommodations(accomData ?? []);

    const { data: transportData } = await supabase
      .from('transport')
      .select('*')
      .eq('trip_id', tripData.id)
      .order('departure_time', { ascending: true });
    setTransport(transportData ?? []);

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

  // ─── Derived values (unchanged business logic) ──────────────────────────────
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
  const today = localDateStr(new Date());

  // ─── Build Journey timeline items ────────────────────────────────────────────
  const timelineItems: TimelineItem[] = destinations.map((dest, index) => {
    const destTheme = getDestinationHero(dest.name, dest.country);
    const destNameLower = (dest.name ?? '').toLowerCase();
    const { arrival, departure } = getDestinationDateRange(destinations, index, trip.start_date);

    // Accommodation match — destination_id first, then address/name/location text fallback
    const matchedAccom = accommodations.find((a: any) =>
      a.destination_id === dest.id ||
      a.address?.toLowerCase().includes(destNameLower) ||
      a.name?.toLowerCase().includes(destNameLower) ||
      a.city?.toLowerCase().includes(destNameLower) ||
      a.location?.toLowerCase().includes(destNameLower)
    ) ?? null;

    // Highlights — activities matched by location, excluding transport categories
    const destActivities = activities.filter((a: any) =>
      (a.destination_id === dest.id || a.location?.toLowerCase().includes(destNameLower)) &&
      !['transport', 'flight'].includes(a.category ?? '')
    );

    const uniqueCategories: string[] = [];
    for (const act of destActivities) {
      const cat = act.category ?? 'other';
      if (!uniqueCategories.includes(cat)) uniqueCategories.push(cat);
      if (uniqueCategories.length >= 4) break;
    }
    const highlightCategories = uniqueCategories.length > 0
      ? uniqueCategories
      : destActivities.slice(0, 4).map((a: any) => a.category ?? 'other');
    const extraHighlightsCount = Math.max(0, destActivities.length - highlightCategories.length);

    // Transport icon — arrival_location matches this destination; first destination falls back to flight
    const matchedTransport = transport.find((t: any) =>
      t.arrival_location?.toLowerCase().includes(destNameLower)
    );
    const transportMode: TransportMode = matchedTransport
      ? (TRANSPORT_TYPE_TO_MODE[matchedTransport.type] ?? 'car')
      : (index === 0 ? 'flight' : 'car');

    // Status
    let status: JourneyCardData['status'] = 'upcoming';
    if (index === currentDestinationIndex && !isUpcoming) status = 'current';
    else if (index === currentDestinationIndex + 1) status = 'next';
    else if (index < currentDestinationIndex) status = 'completed';

    const cardData: JourneyCardData = {
      id: dest.id,
      index,
      name: dest.name,
      country: dest.country ?? null,
      arrivalDate: arrival,
      departureDate: departure,
      nights: dest.nights ?? null,
      accommodation: matchedAccom
        ? { name: matchedAccom.name, checkIn: matchedAccom.check_in ?? null }
        : null,
      highlightCategories,
      extraHighlightsCount,
      status,
      heroImage: destTheme.image ?? null,
    };

    return {
      card: cardData,
      transportMode,
      accentColor: destTheme.accent,
      cardBg: destTheme.background,
    };
  });

  // ─── What's Next data ─────────────────────────────────────────────────────────
  const upcomingActivity = activities
    .filter((a: any) => a.status !== 'completed' && (!a.date || a.date >= today))
    .sort((a: any, b: any) => (a.date ?? '').localeCompare(b.date ?? '') || (a.time ?? '').localeCompare(b.time ?? ''))[0] ?? null;

  const currentAccommodation = accommodations.find((a: any) => {
    if (!a.check_in || !a.check_out) return false;
    const checkIn = a.check_in.split('T')[0];
    const checkOut = a.check_out.split('T')[0];
    return checkIn <= today && today <= checkOut;
  }) ?? accommodations[0] ?? null;

  const nextTransport = transport
    .filter((t: any) => !t.departure_time || t.departure_time.split('T')[0] >= today)
    .sort((a: any, b: any) => (a.departure_time ?? '').localeCompare(b.departure_time ?? ''))[0] ?? null;

  const whatsNextItems: WhatsNextItem[] = [
    {
      icon: '📅',
      label: "What's Next",
      title: upcomingActivity ? upcomingActivity.title : 'Nothing planned',
      subtitle: upcomingActivity
        ? `${upcomingActivity.date === today ? 'Today' : upcomingActivity.date ?? ''}, ${upcomingActivity.time?.slice(0, 5) ?? ''}`
        : 'All caught up',
      onPress: () => navigation.navigate('Itinerary'),
      accentColor: theme.accent,
    },
    {
      icon: '🛏️',
      label: 'Accommodation',
      title: currentAccommodation ? currentAccommodation.name : 'No accommodation',
      subtitle: currentAccommodation?.check_in
        ? `Check-in ${currentAccommodation.check_in.split('T')[0] === today ? 'today' : currentAccommodation.check_in.split('T')[0]}`
        : 'Not set',
      onPress: () => navigation.navigate('Accommodation', { tripId: trip.id }),
      accentColor: theme.accent,
    },
    {
      icon: '✈️',
      label: 'Transportation',
      title: nextTransport
        ? `${nextTransport.departure_location ?? ''} → ${nextTransport.arrival_location ?? ''}`
        : 'No transport',
      subtitle: nextTransport?.departure_time
        ? `${nextTransport.departure_time.split('T')[0] === today ? 'Today' : nextTransport.departure_time.split('T')[0]}, ${new Date(nextTransport.departure_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
        : 'Not set',
      onPress: () => navigation.navigate('Transport', { tripId: trip.id }),
      accentColor: theme.accent,
    },
    {
      icon: '💰',
      label: 'Budget',
      title: `${currency} ${totalSpent.toFixed(0)} / ${trip.budget?.toLocaleString() ?? 0}`,
      subtitle: `${percentUsed}% used`,
      onPress: () => navigation.navigate('Budget', { tripId: trip.id }),
      accentColor: theme.accent,
      progressPercent: percentUsed,
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={[styles.header, { paddingTop: statusBarHeight + 12 }]}>
          <Text style={styles.headerTitle}>Trip Overview</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => navigation.navigate('Notifications')}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 18 }}>🔔</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => navigation.navigate('TripSettings', { tripId: trip.id })}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 18 }}>⋯</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Hero ─────────────────────────────────────────────────────── */}
        <View style={styles.heroWrap}>
          <TripHero trip={trip} destinations={destinations} theme={theme} />
        </View>

        {/* ─── Progress card (with route map + stats inline, per mockup) ── */}
        <View
          style={[
            styles.progressCard,
            { backgroundColor: theme.hillBack, borderColor: theme.border },
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
            <Text style={styles.progressPercent}>{progressPercent}%</Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressPercent}%`, backgroundColor: theme.text },
              ]}
            />
          </View>
        </View>

        {/* ─── Quick stats row ──────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>📍</Text>
            <View>
              <Text style={styles.statValue}>{destinations.length}</Text>
              <Text style={styles.statLabel}>destinations</Text>
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>📅</Text>
            <View>
              <Text style={styles.statValue}>{activities.length}</Text>
              <Text style={styles.statLabel}>activities</Text>
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>💵</Text>
            <View>
              <Text style={styles.statValue}>{currency} {totalSpent.toFixed(0)}</Text>
              <Text style={styles.statLabel}>spent</Text>
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>👥</Text>
            <View>
              <Text style={styles.statValue}>2</Text>
              <Text style={styles.statLabel}>travelers</Text>
            </View>
          </View>
        </View>

        {/* ─── Your Journey ─────────────────────────────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Your Journey</Text>
          <TouchableOpacity
            style={styles.viewMapBtn}
            onPress={() => navigation.navigate('Explore')}
            activeOpacity={0.8}
          >
            <Text style={styles.viewMapText}>🗺️ View on Map</Text>
          </TouchableOpacity>
        </View>

        {destinations.length === 0 ? (
          <View style={styles.emptyJourney}>
            <Text style={styles.emptyEmoji}>📍</Text>
            <Text style={styles.emptyTitle}>No destinations yet</Text>
          </View>
        ) : (
          <JourneyTimeline
            items={timelineItems}
            onCardPress={(destinationId) => navigation.navigate('DestinationDetails', { destinationId })}
          />
        )}

        {/* ─── What's Next ──────────────────────────────────────────────── */}
        <View style={[styles.sectionHeaderRow, { marginTop: 8 }]}>
          <Text style={styles.sectionTitle}>What's Next</Text>
        </View>
        <WhatsNextRow items={whatsNextItems} />

        <View style={{ height: 28 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF8F0' },
  scroll: { flex: 1 },
  content: { paddingBottom: 120 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 10,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 28, color: '#1A1A1A', fontWeight: '300' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#1A1A1A' },
  headerRight: { flexDirection: 'row', gap: 8 },
  headerIconBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },

  heroWrap: { marginHorizontal: 16, marginBottom: 12 },

  progressCard: {
    marginHorizontal: 16, borderRadius: 22, borderWidth: 1,
    paddingHorizontal: 18, paddingVertical: 14, marginBottom: 12,
  },
  progressTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  progressTextBlock: { flex: 1 },
  progressTitle: { fontSize: 16, fontWeight: '900', color: '#1A1A1A' },
  progressSubtitle: { marginTop: 2, fontSize: 12, fontWeight: '700', color: '#3D2B1F', opacity: 0.7 },
  progressPercent: { fontSize: 18, fontWeight: '900', color: '#1A1A1A' },
  progressTrack: { marginTop: 10, height: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.55)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },

  statsRow: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 20,
    backgroundColor: '#fff', borderRadius: 20, paddingVertical: 14, paddingHorizontal: 8,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  statItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  statIcon: { fontSize: 16 },
  statValue: { fontSize: 14, fontWeight: '900', color: '#1A1A1A' },
  statLabel: { fontSize: 9, color: '#8A817A', fontWeight: '600' },
  statDivider: { width: 1, backgroundColor: '#F0EBE5' },

  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, marginBottom: 12,
  },
  sectionTitle: { fontSize: 19, fontWeight: '900', color: '#1A1A1A', letterSpacing: -0.3 },
  viewMapBtn: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  viewMapText: { fontSize: 12, fontWeight: '700', color: '#1A1A1A' },

  emptyJourney: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A1A' },
});
