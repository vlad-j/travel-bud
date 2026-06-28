import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import StatusBadge from '../components/StatusBadge';
import { Sparkle, Cloud, Dot } from '../components/TravelDecorations';
import { supabase } from '../lib/supabase';

const DEST_COLORS = ['#E8F5E9', '#FFF3E0', '#E3F2FD', '#F3E5F5', '#FCE4EC', '#E8EAF6'];
const DEST_EMOJIS: Record<string, string> = {
  bali: '🌴', lombok: '🏖️', java: '🛕', yogyakarta: '🛕',
  jakarta: '🏙️', paris: '🗼', tokyo: '⛩️', barcelona: '🏛️',
};

function getDestEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(DEST_EMOJIS)) {
    if (lower.includes(key)) return emoji;
  }
  return '📍';
}

function SectionBlock({ title, headerColor, textColor, icon, children }: {
  title: string; headerColor: string; textColor: string; icon: string; children: React.ReactNode;
}) {
  return (
    <View style={[styles.sectionBlock, { backgroundColor: headerColor, borderColor: headerColor }]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleWrap}>
          <Text style={{ fontSize: 14, marginRight: 6 }}>{icon}</Text>
          <Text style={[styles.sectionTitle, { color: textColor }]}>{title}</Text>
        </View>
      </View>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

export default function TripOverviewScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [trip, setTrip] = useState<any>(null);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

const paramTripId = route.params?.tripId;
let tripData: any = null;

if (paramTripId) {
  const { data } = await supabase.from('trips').select('*').eq('id', paramTripId).single();
  tripData = data;
} else {
  const { data: memberships } = await supabase.from('trip_members').select('trip_id').eq('user_id', user.id);
  if (!memberships || memberships.length === 0) { setLoading(false); return; }
  const tripIds = memberships.map((m: any) => m.trip_id);
  const { data: tripsData } = await supabase.from('trips').select('*').in('id', tripIds).eq('status', 'active').order('created_at', { ascending: false });
  tripData = tripsData?.[0] ?? null;
}

if (!tripData) { setLoading(false); return; }
setTrip(tripData);

    const { data: destsData } = await supabase.from('destinations').select('*').eq('trip_id', tripData.id).order('order_index', { ascending: true });
    setDestinations(destsData ?? []);

    const { data: expData } = await supabase.from('expenses').select('amount').eq('trip_id', tripData.id);
    setExpenses(expData ?? []);

    const { data: actsData } = await supabase.from('activities').select('id').eq('trip_id', tripData.id);
    setActivities(actsData ?? []);

    setLoading(false);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      </SafeAreaView>
    );
  }

  if (!trip) {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Trip Overview</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>✈️</Text>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#1A1A1A' }}>No active trip</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalDays = Math.floor((new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const percentUsed = trip.budget > 0 ? Math.round((totalSpent / trip.budget) * 100) : 0;

  const startDateFormatted = new Date(trip.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const endDateFormatted = new Date(trip.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const STATS = [
    { label: 'Days', value: String(totalDays), icon: '📅' },
    { label: 'Destinations', value: String(destinations.length), icon: '📍' },
    { label: 'Activities', value: String(activities.length), icon: '🎯' },
    { label: 'Budget', value: `€${trip.budget?.toLocaleString() ?? 0}`, icon: '💶' },
    { label: 'Used', value: `${percentUsed}%`, icon: '💸' },
    { label: 'Spent', value: `€${totalSpent.toFixed(0)}`, icon: '🧾' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Trip Overview</Text>
          <TouchableOpacity onPress={() => navigation.navigate('TripSettings', { tripId: trip.id })}>
            <Text style={{ fontSize: 22 }}>⋯</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroScene}>
            <View style={styles.sky} />
            <View style={[styles.mountain, styles.mountainBack]} />
            <View style={[styles.mountain, styles.mountainFront]} />
            <View style={styles.templeContainer}>
              <Text style={styles.templeEmoji}>{trip.cover_destination ?? '🛕'}</Text>
            </View>
            <Text style={[styles.sceneDecor, { left: 20, bottom: 20 }]}>🌴</Text>
            <Text style={[styles.sceneDecor, { right: 20, bottom: 20 }]}>🌴</Text>
            <Text style={[styles.sceneDecor, { left: 60, top: 20 }]}>☁️</Text>
            <Text style={[styles.sceneDecor, { right: 80, top: 30 }]}>☁️</Text>
            <Text style={[styles.sceneDecor, { right: 24, top: 18 }]}>☀️</Text>
            <Sparkle color="#FFD700" size={12} style={{ position: 'absolute', left: 40, top: 40 }} />
          </View>
        </View>

        <View style={styles.tripInfo}>
          <View style={styles.tripHeader}>
            <Text style={styles.tripName}>{trip.name}</Text>
            <StatusBadge status="UPCOMING" />
          </View>
          <Text style={styles.tripDates}>{startDateFormatted} – {endDateFormatted}</Text>
        </View>

        <View style={styles.statsGrid}>
          {STATS.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {destinations.length > 0 && (
          <SectionBlock title="DESTINATIONS" headerColor="#AED581" textColor="#33691E" icon="📍">
            {destinations.map((dest, index) => (
              <TouchableOpacity key={dest.id} onPress={() => navigation.navigate('DestinationDetails')} activeOpacity={0.7}>
                <View style={[styles.destRow, { backgroundColor: DEST_COLORS[index % DEST_COLORS.length] }]}>
                  <View style={styles.destEmojiBg}>
                    <Text style={{ fontSize: 24 }}>{getDestEmoji(dest.name)}</Text>
                  </View>
                  <View style={styles.destInfo}>
                    <Text style={styles.destName}>{dest.name}</Text>
                    <View style={styles.destMetaRow}>
                      <Dot color="#999" size={4} style={{ position: 'relative' }} />
                      <Text style={styles.destMeta}>{dest.nights ?? 0} nights</Text>
                      {dest.country && (
                        <>
                          <Dot color="#999" size={4} style={{ position: 'relative', marginLeft: 8 }} />
                          <Text style={styles.destMeta}>{dest.country}</Text>
                        </>
                      )}
                    </View>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </View>
                {index < destinations.length - 1 && <View style={styles.divider} />}
              </TouchableOpacity>
            ))}
          </SectionBlock>
        )}

        <View style={styles.footerDecor}>
          <Dot color="#BBB" size={5} style={{ position: 'relative' }} />
          <Dot color="#BBB" size={4} style={{ position: 'relative', marginLeft: 8 }} />
          <Sparkle color="#FF9800" size={10} style={{ position: 'relative', marginLeft: 6 }} />
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#E8E8E8' },
  scroll: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  backBtn: { padding: 4 },
  backIcon: { fontSize: 28, color: '#1A1A1A', fontWeight: '300' },
  title: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  heroCard: { height: 220, overflow: 'hidden' },
  heroScene: { flex: 1, position: 'relative', overflow: 'hidden' },
  sky: { ...StyleSheet.absoluteFillObject, backgroundColor: '#87CEEB' },
  mountain: { position: 'absolute', bottom: 0, borderLeftWidth: 80, borderRightWidth: 80, borderBottomWidth: 130, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  mountainBack: { left: 60, borderBottomColor: '#66BB6A', borderBottomWidth: 150, borderLeftWidth: 100, borderRightWidth: 100 },
  mountainFront: { right: 60, borderBottomColor: '#4CAF50', borderBottomWidth: 120, borderLeftWidth: 90, borderRightWidth: 90 },
  templeContainer: { position: 'absolute', bottom: 24, left: 0, right: 0, alignItems: 'center' },
  templeEmoji: { fontSize: 72 },
  sceneDecor: { position: 'absolute', fontSize: 28 },
  tripInfo: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  tripHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  tripName: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', flex: 1, marginRight: 12 },
  tripDates: { fontSize: 13, color: '#666' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8, justifyContent: 'space-between' },
  statCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', width: '31%', borderWidth: 1, borderColor: '#F0F0F0', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  sectionBlock: { marginHorizontal: 16, marginTop: 14, borderRadius: 20, overflow: 'hidden', borderWidth: 3 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 24 },
  sectionTitleWrap: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  sectionCard: { backgroundColor: '#fff', borderRadius: 16, margin: 4, marginTop: -16, paddingHorizontal: 10, paddingVertical: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: -2 }, elevation: 3 },
  destRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 8, borderRadius: 12, marginVertical: 2 },
  destEmojiBg: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  destInfo: { flex: 1 },
  destName: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  destMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  destMeta: { fontSize: 12, color: '#666' },
  chevron: { fontSize: 22, color: '#CCC', fontWeight: '300' },
  divider: { height: 1, backgroundColor: '#F5F5F5', marginLeft: 60 },
  footerDecor: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
});
