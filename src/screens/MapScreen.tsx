import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { Sparkle, Dot } from '../components/TravelDecorations';
import { supabase } from '../lib/supabase';
import { currentTripIdRef } from '../context/TripContext';
import { useStatusBarHeight } from '../../hooks/useStatusBarHeight';

const TABS = ['Destinations', 'Activities', 'Saved'];

const DESTINATION_EMOJIS: Record<string, string> = {
  'Thailand': '🇹🇭', 'Indonesia': '🇮🇩', 'Japan': '🇯🇵', 'France': '🇫🇷',
  'Italy': '🇮🇹', 'Spain': '🇪🇸', 'Greece': '🇬🇷', 'Portugal': '🇵🇹',
  'Germany': '🇩🇪', 'UK': '🇬🇧', 'Netherlands': '🇳🇱', 'Norway': '🇳🇴',
  'Romania': '🇷🇴', 'USA': '🇺🇸', 'Mexico': '🇲🇽', 'Brazil': '🇧🇷',
  'Vietnam': '🇻🇳', 'Cambodia': '🇰🇭', 'Malaysia': '🇲🇾', 'Singapore': '🇸🇬',
};

function getCountryEmoji(country: string): string {
  for (const [key, emoji] of Object.entries(DESTINATION_EMOJIS)) {
    if (country?.toLowerCase().includes(key.toLowerCase())) return emoji;
  }
  return '🌍';
}

export default function MapScreen() {
  const [activeTab, setActiveTab] = useState('Destinations');
  const [trip, setTrip] = useState<any>(null);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();
  const statusBarHeight = useStatusBarHeight();

  useFocusEffect(useCallback(() => { loadData(); }, []));

  async function loadData() {
    const tripId = currentTripIdRef.current;
    if (!tripId) { setLoading(false); return; }

    const { data: tripData } = await supabase.from('trips').select('*').eq('id', tripId).single();
    setTrip(tripData);

    const { data: dests } = await supabase
      .from('destinations')
      .select('*')
      .eq('trip_id', tripId)
      .order('order_index', { ascending: true });
    setDestinations(dests ?? []);

    const { data: acts } = await supabase
      .from('activities')
      .select('*')
      .eq('trip_id', tripId)
      .not('location', 'is', null)
      .order('date', { ascending: true })
      .limit(20);
    setActivities(acts ?? []);

    setLoading(false);
  }

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

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {activeTab === 'Destinations' && (
          <>
            {destinations.length === 0 ? (
              <View style={styles.emptySection}>
                <Text style={{ fontSize: 48, marginBottom: 12 }}>📍</Text>
                <Text style={styles.emptySectionTitle}>No destinations yet</Text>
                <Text style={styles.emptySectionSub}>Add destinations in Trip Settings to see them here</Text>
              </View>
            ) : (
              <>
                {/* Route visualization */}
                <View style={styles.routeCard}>
                  <Text style={styles.routeTitle}>🗺️ Trip Route</Text>
                  <View style={styles.routeStops}>
                    {destinations.map((dest, i) => (
                      <View key={dest.id} style={styles.routeStopWrap}>
                        <View style={styles.routeStop}>
                          <View style={styles.routeStopDot} />
                          {i < destinations.length - 1 && <View style={styles.routeStopLine} />}
                        </View>
                        <View style={styles.routeStopInfo}>
                          <Text style={styles.routeStopEmoji}>{getCountryEmoji(dest.country ?? dest.name)}</Text>
                          <View>
                            <Text style={styles.routeStopName}>{dest.name}</Text>
                            {dest.country ? <Text style={styles.routeStopCountry}>{dest.country}</Text> : null}
                            {dest.nights ? <Text style={styles.routeStopNights}>{dest.nights} nights</Text> : null}
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Destination cards */}
                {destinations.map(dest => (
                  <View key={dest.id} style={styles.destCard}>
                    <View style={styles.destEmoji}>
                      <Text style={{ fontSize: 36 }}>{getCountryEmoji(dest.country ?? dest.name)}</Text>
                    </View>
                    <View style={styles.destInfo}>
                      <Text style={styles.destName}>{dest.name}</Text>
                      {dest.country ? <Text style={styles.destCountry}>{dest.country}</Text> : null}
                      {dest.nights ? <Text style={styles.destNights}>🌙 {dest.nights} nights</Text> : null}
                    </View>
                  </View>
                ))}
              </>
            )}
          </>
        )}

        {activeTab === 'Activities' && (
          <>
            {activities.length === 0 ? (
              <View style={styles.emptySection}>
                <Text style={{ fontSize: 48, marginBottom: 12 }}>🎯</Text>
                <Text style={styles.emptySectionTitle}>No activities with locations</Text>
                <Text style={styles.emptySectionSub}>Add locations to your activities in the Itinerary to see them here</Text>
              </View>
            ) : (
              activities.map(act => (
                <View key={act.id} style={styles.actCard}>
                  <View style={styles.actIcon}>
                    <Text style={{ fontSize: 20 }}>🎯</Text>
                  </View>
                  <View style={styles.actInfo}>
                    <Text style={styles.actTitle}>{act.title}</Text>
                    <Text style={styles.actLocation}>📍 {act.location}</Text>
                    {act.date && (
                      <Text style={styles.actDate}>
                        {new Date(act.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </Text>
                    )}
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {activeTab === 'Saved' && (
          <View style={styles.emptySection}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🔖</Text>
            <Text style={styles.emptySectionTitle}>No saved places yet</Text>
            <Text style={styles.emptySectionSub}>Save places you want to visit during your trip</Text>
          </View>
        )}

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
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', gap: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  tab: { paddingHorizontal: 18, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F0F0F0' },
  tabActive: { backgroundColor: '#4CAF50' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#666' },
  tabTextActive: { color: '#fff' },
  scroll: { flex: 1, padding: 16 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 24 },
  emptyBtn: { backgroundColor: '#4CAF50', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14 },
  emptyBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  emptySection: { alignItems: 'center', paddingVertical: 60 },
  emptySectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  emptySectionSub: { fontSize: 13, color: '#888', textAlign: 'center', paddingHorizontal: 32 },
  routeCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  routeTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginBottom: 16 },
  routeStops: { gap: 0 },
  routeStopWrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  routeStop: { alignItems: 'center', width: 20, paddingTop: 4 },
  routeStopDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4CAF50', borderWidth: 2, borderColor: '#fff', shadowColor: '#4CAF50', shadowOpacity: 0.4, shadowRadius: 3, elevation: 2 },
  routeStopLine: { width: 2, height: 32, backgroundColor: '#E0E0E0', marginTop: 4 },
  routeStopInfo: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1 },
  routeStopEmoji: { fontSize: 24, marginTop: -2 },
  routeStopName: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  routeStopCountry: { fontSize: 12, color: '#888', marginTop: 1 },
  routeStopNights: { fontSize: 12, color: '#4CAF50', fontWeight: '600', marginTop: 2 },
  destCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  destEmoji: { width: 56, height: 56, borderRadius: 14, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  destInfo: { flex: 1 },
  destName: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  destCountry: { fontSize: 13, color: '#888', marginTop: 2 },
  destNights: { fontSize: 12, color: '#4CAF50', fontWeight: '600', marginTop: 4 },
  actCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  actIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' },
  actInfo: { flex: 1 },
  actTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  actLocation: { fontSize: 12, color: '#888', marginTop: 2 },
  actDate: { fontSize: 11, color: '#BBB', marginTop: 2 },
  footerDecor: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
});
