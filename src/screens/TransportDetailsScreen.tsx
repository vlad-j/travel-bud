import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { createActivityFromTransport, deleteActivitiesBySource, deleteDocumentsBySource } from '../lib/itineraryAutoCreate';
import { useStatusBarHeight } from '../../hooks/useStatusBarHeight';
import {
  getTransportTypeMeta, getBookingStatusMeta, formatClockTime, formatDuration,
} from '../components/transport/TransportCard';
import AddFlightModal from '../components/transport/AddFlightModal';
import AddTransferModal from '../components/transport/AddTransferModal';

function formatFullDate(ts: string | null): string {
  if (!ts) return '—';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function formatAddedDate(ts: string | null): string {
  if (!ts) return '';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' • ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export default function TransportDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const statusBarHeight = useStatusBarHeight();
  const [item, setItem] = useState<any>(null);
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const loadData = useCallback(async () => {
    const transportId = route.params?.transportId;
    if (!transportId) { setLoading(false); return; }

    const { data: transportData } = await supabase
      .from('transport')
      .select('*')
      .eq('id', transportId)
      .single();

    if (!transportData) { setLoading(false); return; }
    setItem(transportData);

    const { data: tripData } = await supabase
      .from('trips')
      .select('*, destinations(id, name, country)')
      .eq('id', transportData.trip_id)
      .single();
    setTrip(tripData ?? null);
    setLoading(false);
  }, [route.params?.transportId]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  async function handleUpdate(data: any) {
    if (!item) return;
    const { _addToBudget, _costAmount, ...transportData } = data;

    const { error } = await supabase.from('transport').update(transportData).eq('id', item.id);
    if (error) { Alert.alert('Error', error.message); return; }

    try {
      await supabase.from('activities')
        .update({
          title: transportData.airline
            ? `${transportData.airline}${transportData.flight_number ? ' ' + transportData.flight_number : ''}: ${transportData.departure_location} → ${transportData.arrival_location}`
            : `${transportData.type}: ${transportData.departure_location} → ${transportData.arrival_location}`,
          location: transportData.departure_location,
        })
        .eq('source_id', item.id)
        .eq('source_type', 'transport');

      if (_addToBudget && _costAmount && parseFloat(_costAmount) > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const label = transportData.airline
            ? `${transportData.airline}${transportData.flight_number ? ' ' + transportData.flight_number : ''}`
            : `${transportData.type}: ${transportData.departure_location} → ${transportData.arrival_location}`;
          await supabase.from('expenses').insert({
            trip_id: item.trip_id,
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
      console.warn('Could not sync linked activity:', e);
    }

    setEditing(false);
    await loadData();
  }

  async function handleDuplicate() {
    if (!item) return;
    const { id, created_at, ...rest } = item;

    const { data: saved, error } = await supabase
      .from('transport')
      .insert(rest)
      .select()
      .single();

    if (error) { Alert.alert('Error', error.message); return; }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && saved) {
        await createActivityFromTransport(saved.id, item.trip_id, rest, user.id);
      }
    } catch (e) {
      console.warn('Could not auto-create itinerary activity:', e);
    }

    Alert.alert('✅ Duplicated', 'A copy was added to your transport list.');
    navigation.goBack();
  }

  function confirmDelete() {
    Alert.alert('Delete transport', 'This will also remove it from your itinerary. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteActivitiesBySource(item.id, 'transport');
          await deleteDocumentsBySource(item.id, 'transport');
          await supabase.from('transport').delete().eq('id', item.id);
          navigation.goBack();
        },
      },
    ]);
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

  if (!item) {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <View style={[styles.headerOverlay, { paddingTop: statusBarHeight + 8 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.emptyWrap}>
          <Text style={{ fontSize: 44, marginBottom: 12 }}>🧭</Text>
          <Text style={styles.emptyTitle}>Not found</Text>
          <Text style={styles.emptySubtitle}>This transport item may have been deleted.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const meta = getTransportTypeMeta(item.type);
  const statusMeta = getBookingStatusMeta(item.status);
  const duration = formatDuration(item.departure_time, item.arrival_time);
  const isFlight = item.type === 'Flight';
  const heroDestination = trip?.destinations?.[0] ?? null;

  const detailRows = [
    { label: 'Terminal', value: item.terminal },
    { label: 'Gate', value: item.gate },
    { label: 'Seat', value: item.seat },
    { label: 'Booking reference', value: item.booking_reference },
  ].filter((r) => r.value);

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <View style={[styles.heroWrap, { backgroundColor: meta.bg, paddingTop: statusBarHeight }]}>
        <View style={styles.heroHeader}>
          <TouchableOpacity style={styles.backBtnLight} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.heroIcon}>{meta.icon}</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.providerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.providerName}>{item.airline || item.type}</Text>
              {item.flight_number ? <Text style={styles.flightNum}>{item.flight_number}</Text> : null}
            </View>
            <View style={[styles.statusPill, { backgroundColor: statusMeta.bg }]}>
              <Text style={[styles.statusText, { color: statusMeta.text }]}>{statusMeta.label}</Text>
            </View>
          </View>

          <View style={styles.routeCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.routeCity}>{item.departure_location}</Text>
            </View>
            <Text style={{ fontSize: 18 }}>{meta.icon}</Text>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={[styles.routeCity, { textAlign: 'right' }]}>{item.arrival_location}</Text>
            </View>
          </View>

          <View style={styles.scheduleRow}>
            <View style={styles.scheduleBlock}>
              <Text style={styles.scheduleLabel}>DEPARTURE</Text>
              <Text style={styles.scheduleDate}>{formatFullDate(item.departure_time)}</Text>
              <Text style={styles.scheduleTime}>{formatClockTime(item.departure_time)}</Text>
            </View>
            <View style={[styles.scheduleBlock, { alignItems: 'flex-end' }]}>
              <Text style={styles.scheduleLabel}>ARRIVAL</Text>
              <Text style={styles.scheduleDate}>{formatFullDate(item.arrival_time)}</Text>
              <Text style={styles.scheduleTime}>{formatClockTime(item.arrival_time)}</Text>
            </View>
          </View>
          {duration && <Text style={styles.durationLabel}>⏱ {duration} total</Text>}

          {(item.price != null) && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Price</Text>
              <Text style={styles.detailValue}>{item.price} {item.price_currency ?? ''}</Text>
            </View>
          )}

          {detailRows.map((r) => (
            <View key={r.label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{r.label}</Text>
              <Text style={styles.detailValue}>{r.value}</Text>
            </View>
          ))}

          {item.notes ? (
            <View style={styles.notesBlock}>
              <Text style={styles.notesLabel}>NOTES</Text>
              <Text style={styles.notesText}>{item.notes}</Text>
            </View>
          ) : null}

          {item.created_at ? (
            <Text style={styles.addedDate}>Added to trip {formatAddedDate(item.created_at)}</Text>
          ) : null}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.actionsBar}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setEditing(true)}>
          <Text style={{ fontSize: 18 }}>✏️</Text>
          <Text style={[styles.actionText, { color: '#4CAF50' }]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handleDuplicate}>
          <Text style={{ fontSize: 18 }}>📋</Text>
          <Text style={[styles.actionText, { color: '#7E57C2' }]}>Duplicate</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={confirmDelete}>
          <Text style={{ fontSize: 18 }}>🗑️</Text>
          <Text style={[styles.actionText, { color: '#F44336' }]}>Delete</Text>
        </TouchableOpacity>
      </View>

      {isFlight ? (
        <AddFlightModal
          visible={editing}
          onClose={() => setEditing(false)}
          tripName={trip?.name}
          tripCurrency={trip?.currency}
          destinationContext={heroDestination ? { name: heroDestination.name, country: heroDestination.country ?? null } : null}
          editItem={item}
          onSave={handleUpdate}
        />
      ) : (
        <AddTransferModal
          visible={editing}
          onClose={() => setEditing(false)}
          title={`Edit ${item.type}`}
          initialType={item.type}
          tripName={trip?.name}
          tripCurrency={trip?.currency}
          destinationContext={heroDestination ? { name: heroDestination.name, country: heroDestination.country ?? null } : null}
          editItem={item}
          onSave={handleUpdate}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF8F0' },
  scroll: { flex: 1 },

  headerOverlay: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 30, color: '#1A1A1A', fontWeight: '300' },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: '#8A817A', fontWeight: '600', textAlign: 'center' },

  heroWrap: { height: 190, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 24 },
  heroHeader: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 8 },
  backBtnLight: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' },
  heroIcon: { fontSize: 64 },

  card: {
    marginHorizontal: 16, marginTop: -24, backgroundColor: '#fff', borderRadius: 24, padding: 18,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  providerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  providerName: { fontSize: 17, fontWeight: '900', color: '#1A1A1A' },
  flightNum: { fontSize: 13, color: '#8A817A', fontWeight: '600', marginTop: 2 },
  statusPill: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  statusText: { fontSize: 11, fontWeight: '800' },

  routeCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F4EF', borderRadius: 16,
    padding: 14, marginBottom: 16,
  },
  routeCity: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },

  scheduleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  scheduleBlock: { flex: 1 },
  scheduleLabel: { fontSize: 10, fontWeight: '800', color: '#B0A89E', letterSpacing: 0.4, marginBottom: 4 },
  scheduleDate: { fontSize: 12, color: '#8A817A', fontWeight: '600' },
  scheduleTime: { fontSize: 18, fontWeight: '900', color: '#1A1A1A', marginTop: 2 },
  durationLabel: { fontSize: 12, color: '#4CAF50', fontWeight: '700', marginTop: 8, marginBottom: 6 },

  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F5F1EB' },
  detailLabel: { fontSize: 13, color: '#8A817A', fontWeight: '700' },
  detailValue: { fontSize: 13, color: '#1A1A1A', fontWeight: '800' },

  notesBlock: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F5F1EB' },
  notesLabel: { fontSize: 10, fontWeight: '800', color: '#B0A89E', letterSpacing: 0.4, marginBottom: 6 },
  notesText: { fontSize: 13, color: '#1A1A1A', lineHeight: 19, fontWeight: '500' },

  addedDate: { fontSize: 11, color: '#B0A89E', fontWeight: '600', marginTop: 16, textAlign: 'center' },

  actionsBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row',
    backgroundColor: '#fff', paddingVertical: 14, paddingHorizontal: 16, paddingBottom: 28,
    borderTopWidth: 1, borderTopColor: '#F0EBE5', gap: 8,
  },
  actionBtn: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 6 },
  actionText: { fontSize: 12, fontWeight: '800' },
});
