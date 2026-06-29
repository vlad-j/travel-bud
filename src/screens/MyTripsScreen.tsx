import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Sparkle, Dot, Cloud } from '../components/TravelDecorations';
import { supabase } from '../lib/supabase';
import { calculateTripStatus } from '../lib/tripService';
import { useStatusBarHeight } from '../../hooks/useStatusBarHeight';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: '#E8F5E9', text: '#4CAF50' },
  upcoming: { bg: '#E3F2FD', text: '#2196F3' },
  completed: { bg: '#F5F5F5', text: '#888' },
};

function getTotalDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString('en-GB', opts)} – ${end.toLocaleDateString('en-GB', { ...opts, year: 'numeric' })}`;
}

export default function MyTripsScreen() {
  const navigation = useNavigation<any>();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const statusBarHeight = useStatusBarHeight();

  useEffect(() => { loadTrips(); }, []);

  async function loadTrips() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: memberships } = await supabase
      .from('trip_members').select('trip_id').eq('user_id', user.id);

    if (!memberships || memberships.length === 0) { setLoading(false); return; }

    const tripIds = memberships.map((m) => m.trip_id);
    const { data: tripsData } = await supabase
      .from('trips')
      .select(`*, destinations(id, name)`)
      .in('id', tripIds)
      .order('start_date', { ascending: true });

    if (tripsData) {
      // Calculează status din date
      const processed = tripsData.map((t: any) => ({
        ...t,
        computedStatus: calculateTripStatus(t.start_date, t.end_date),
      }));
      setTrips(processed);
    }
    setLoading(false);
  }

  const activeTrips = trips.filter((t) => t.computedStatus === 'active');
  const upcomingTrips = trips.filter((t) => t.computedStatus === 'upcoming');
  const completedTrips = trips.filter((t) => t.computedStatus === 'completed');

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <View style={[styles.header, { paddingTop: statusBarHeight + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Trips</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('CreateTrip')} activeOpacity={0.8}>
          <Text style={styles.addBtnText}>＋</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {activeTrips.length > 0 && (
            <>
              <View style={styles.groupLabel}>
                <Sparkle color="#4CAF50" size={12} style={{ position: 'relative', marginRight: 4 }} />
                <Text style={styles.groupLabelText}>ACTIVE</Text>
              </View>
              {activeTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} computedStatus="active" onPress={() => navigation.navigate('TripOverview', { tripId: trip.id })} />
              ))}
            </>
          )}

          {upcomingTrips.length > 0 && (
            <>
              <View style={[styles.groupLabel, { marginTop: 10 }]}>
                <Cloud size={16} style={{ position: 'relative', marginRight: 4 }} />
                <Text style={styles.groupLabelText}>UPCOMING</Text>
              </View>
              {upcomingTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} computedStatus="upcoming" onPress={() => navigation.navigate('HomeMain')} />
              ))}
            </>
          )}

          {completedTrips.length > 0 && (
            <>
              <View style={[styles.groupLabel, { marginTop: 10 }]}>
                <Dot color="#888" size={8} style={{ position: 'relative', marginRight: 4 }} />
                <Text style={styles.groupLabelText}>COMPLETED</Text>
              </View>
              {completedTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} computedStatus="completed" onPress={() => {}} />
              ))}
            </>
          )}

          {trips.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>✈️</Text>
              <Text style={styles.emptyTitle}>No trips yet</Text>
              <Text style={styles.emptySubtitle}>Tap + to create your first adventure</Text>
            </View>
          )}

          <View style={styles.footerDecor}>
            <Dot color="#DDD" size={5} style={{ position: 'relative' }} />
            <Dot color="#DDD" size={4} style={{ position: 'relative', marginLeft: 8 }} />
            <Sparkle color="#FF9800" size={10} style={{ position: 'relative', marginLeft: 6 }} />
          </View>
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function TripCard({ trip, computedStatus, onPress }: { trip: any; computedStatus: string; onPress: () => void }) {
  const statusStyle = STATUS_COLORS[computedStatus] ?? STATUS_COLORS.completed;
  const totalDays = getTotalDays(trip.start_date, trip.end_date);
  const dateRange = formatDateRange(trip.start_date, trip.end_date);
  const destinationCount = trip.destinations?.length ?? 0;
  const isActive = computedStatus === 'active';
  const isCompleted = computedStatus === 'completed';

  return (
    <TouchableOpacity
      style={[styles.tripCard, isActive && styles.tripCardActive]}
      onPress={onPress}
      activeOpacity={isCompleted ? 1 : 0.85}
    >
      <View style={[styles.tripHero, { backgroundColor: isActive ? '#E8F5E9' : '#F5F5F5' }]}>
        <View style={styles.heroSky} />
        <View style={[styles.heroHill, { left: -10, bottom: 0, backgroundColor: '#66BB6A' }]} />
        <View style={[styles.heroHill, { right: -10, bottom: 0, backgroundColor: '#81C784', width: 120 }]} />
        <Text style={styles.heroEmoji}>{trip.cover_destination ?? '✈️'}</Text>
        <Text style={[styles.heroDecor, { left: 12, top: 10 }]}>☁️</Text>
        <Text style={[styles.heroDecor, { right: 18, top: 8 }]}>☀️</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: statusStyle.text }]} />
          <Text style={[styles.statusText, { color: statusStyle.text }]}>{computedStatus.toUpperCase()}</Text>
        </View>
        {isActive && (
          <View style={styles.activePill}>
            <Text style={styles.activePillText}>✓ Current</Text>
          </View>
        )}
      </View>

      <View style={styles.tripInfo}>
        <Text style={styles.tripName}>{trip.name}</Text>
        <Text style={styles.tripDates}>{dateRange}</Text>
        <View style={styles.statsRow}>
          <Stat label="days" value={String(totalDays)} />
          <View style={styles.statDivider} />
          <Stat label="destinations" value={String(destinationCount)} />
          <View style={styles.statDivider} />
          <Stat label="budget" value={`€${trip.budget ?? 0}`} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  backBtn: { padding: 4 },
  backIcon: { fontSize: 28, color: '#1A1A1A', fontWeight: '300' },
  title: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  addBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#4CAF50', alignItems: 'center', justifyContent: 'center' },
  addBtnText: { fontSize: 20, color: '#fff', lineHeight: 24, fontWeight: '700' },
  scroll: { flex: 1, padding: 16 },
  groupLabel: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  groupLabelText: { fontSize: 12, fontWeight: '700', color: '#888', letterSpacing: 0.8 },
  tripCard: { backgroundColor: '#fff', borderRadius: 20, marginBottom: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#F0F0F0', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  tripCardActive: { borderColor: '#A5D6A7', borderWidth: 1.5 },
  tripHero: { height: 120, position: 'relative', overflow: 'hidden' },
  heroSky: { ...StyleSheet.absoluteFillObject, backgroundColor: '#B3E5FC' },
  heroHill: { position: 'absolute', width: 140, height: 60, borderRadius: 40, bottom: 0 },
  heroEmoji: { position: 'absolute', bottom: 10, left: '50%', fontSize: 44, marginLeft: -22 },
  heroDecor: { position: 'absolute', fontSize: 18 },
  statusBadge: { position: 'absolute', top: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  activePill: { position: 'absolute', bottom: 10, left: 10, backgroundColor: '#4CAF50', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  activePillText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  tripInfo: { padding: 16 },
  tripName: { fontSize: 17, fontWeight: '800', color: '#1A1A1A', marginBottom: 2 },
  tripDates: { fontSize: 13, color: '#888', marginBottom: 12 },
  statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, paddingVertical: 10 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  statLabel: { fontSize: 10, color: '#888', marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: '#E0E0E0' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#888' },
  footerDecor: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
});
