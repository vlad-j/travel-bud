import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { currentTripIdRef } from '../context/TripContext';
import StatusBadge from '../components/StatusBadge';
import { MenuSheet } from '../components/BottomSheet';
import BottomSheet, { SheetButton } from '../components/BottomSheet';
import { Dot, Sparkle } from '../components/TravelDecorations';
import { createActivityFromTransport, deleteActivitiesBySource } from '../lib/itineraryAutoCreate';
import SectionBlock from '../components/SectionBlock';

const TRANSPORT_TYPES = ['Train', 'Ferry', 'Bus', 'Taxi', 'Rental Car'];

const TYPE_ICONS: Record<string, string> = {
  Flight: '✈️', Train: '🚂', Ferry: '⛴️',
  Bus: '🚌', Taxi: '🚗', 'Rental Car': '🚙',
};

const TABS = ['Flights', 'Transfers', 'Other'];

function F({ label, placeholder, value, onChangeText, optional, multiline }: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  optional?: boolean;
  multiline?: boolean;
}) {
  return (
    <View style={fStyles.fieldWrap}>
      <Text style={fStyles.label}>
        {label}{optional ? <Text style={fStyles.optional}> (optional)</Text> : null}
      </Text>
      <TextInput
        style={[fStyles.input, multiline && fStyles.multiline]}
        placeholder={placeholder}
        placeholderTextColor="#C0C0C0"
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );
}

function FlightForm({ onSave, onClose }: { onSave: (data: any) => Promise<void>; onClose: () => void }) {
  const [airline, setAirline] = useState('');
  const [flightNum, setFlightNum] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [terminal, setTerminal] = useState('');
  const [gate, setGate] = useState('');
  const [seat, setSeat] = useState('');
  const [bookingRef, setBookingRef] = useState('');
  const [saving, setSaving] = useState(false);

  const canSave = airline.trim() && flightNum.trim() && from.trim() && to.trim();

  return (
    <>
      <F label="Airline" placeholder="e.g. Garuda Indonesia" value={airline} onChangeText={setAirline} />
      <F label="Flight number" placeholder="e.g. GA408" value={flightNum} onChangeText={setFlightNum} />
      <F label="From" placeholder="e.g. Yogyakarta" value={from} onChangeText={setFrom} />
      <F label="To" placeholder="e.g. Bali" value={to} onChangeText={setTo} />
      <View style={fStyles.row}>
        <View style={fStyles.half}><F label="Departure" placeholder="2025-05-16 18:20" value={departureTime} onChangeText={setDepartureTime} optional /></View>
        <View style={fStyles.half}><F label="Arrival" placeholder="2025-05-16 19:45" value={arrivalTime} onChangeText={setArrivalTime} optional /></View>
      </View>
      <View style={fStyles.row}>
        <View style={fStyles.half}><F label="Terminal" placeholder="T1" value={terminal} onChangeText={setTerminal} optional /></View>
        <View style={fStyles.half}><F label="Gate" placeholder="G3" value={gate} onChangeText={setGate} optional /></View>
      </View>
      <View style={fStyles.row}>
        <View style={fStyles.half}><F label="Seat" placeholder="14A" value={seat} onChangeText={setSeat} optional /></View>
        <View style={fStyles.half}><F label="Booking ref" placeholder="ABCDEF" value={bookingRef} onChangeText={setBookingRef} optional /></View>
      </View>
      <SheetButton
        label={saving ? 'Saving...' : 'Save Flight'}
        disabled={!canSave || saving}
        onPress={async () => {
          setSaving(true);
          await onSave({
            type: 'Flight', airline, flight_number: flightNum,
            departure_location: from, arrival_location: to,
            departure_time: departureTime || null, arrival_time: arrivalTime || null,
            terminal, gate, seat, booking_reference: bookingRef, status: 'UPCOMING',
          });
          setSaving(false);
          onClose();
        }}
      />
    </>
  );
}

function OtherTransportForm({ type, onSave, onClose }: { type: string; onSave: (data: any) => Promise<void>; onClose: () => void }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [bookingRef, setBookingRef] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const canSave = from.trim() && to.trim();

  return (
    <>
      <F label="From" placeholder="e.g. Ubud" value={from} onChangeText={setFrom} />
      <F label="To" placeholder="e.g. Seminyak" value={to} onChangeText={setTo} />
      <View style={fStyles.row}>
        <View style={fStyles.half}><F label="Departure" placeholder="10:00" value={departureTime} onChangeText={setDepartureTime} optional /></View>
        <View style={fStyles.half}><F label="Arrival" placeholder="11:30" value={arrivalTime} onChangeText={setArrivalTime} optional /></View>
      </View>
      <F label="Booking ref" placeholder="Optional" value={bookingRef} onChangeText={setBookingRef} optional />
      <F label="Notes" placeholder="Optional notes" value={notes} onChangeText={setNotes} optional multiline />
      <SheetButton
        label={saving ? 'Saving...' : `Save ${type}`}
        disabled={!canSave || saving}
        onPress={async () => {
          setSaving(true);
          await onSave({
            type, airline: null, flight_number: null,
            departure_location: from, arrival_location: to,
            departure_time: departureTime || null, arrival_time: arrivalTime || null,
            terminal: null, gate: null, seat: null,
            booking_reference: bookingRef || null, status: 'UPCOMING',
          });
          setSaving(false);
          onClose();
        }}
      />
    </>
  );
}

function formatTime(ts: string | null): string {
  if (!ts) return '—';
  try { return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); }
  catch { return ts; }
}

function formatDate(ts: string | null): string {
  if (!ts) return '';
  try { return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); }
  catch { return ''; }
}

export default function TransportScreen() {
  const [activeTab, setActiveTab] = useState('Flights');
  const [menuVisible, setMenuVisible] = useState(false);
  const [addFlightVisible, setAddFlightVisible] = useState(false);
  const [addTransferVisible, setAddTransferVisible] = useState(false);
  const [addOtherVisible, setAddOtherVisible] = useState(false);
  const [transportType, setTransportType] = useState('Train');
  const [transports, setTransports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useFocusEffect(useCallback(() => { loadData(); }, []));

  async function loadData() {
    const tripId = currentTripIdRef.current;
    if (!tripId) { setLoading(false); return; }
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

    const { data: saved, error } = await supabase
      .from('transport')
      .insert({ ...data, trip_id: tripId })
      .select()
      .single();

    if (error) { Alert.alert('Error', error.message); return; }

    // Auto-create itinerary activity
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && saved) {
        await createActivityFromTransport(saved.id, tripId, data, user.id);
      }
    } catch (e) {
      console.warn('Could not auto-create itinerary activity:', e);
    }

    Alert.alert('✅ Saved', 'Transport added to your itinerary.');
    await loadData();
  }

  async function handleDelete(id: string) {
    Alert.alert('Delete', 'Remove this transport?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          // Delete linked itinerary activities first
          await deleteActivitiesBySource(id, 'transport');
          await supabase.from('transport').delete().eq('id', id);
          await loadData();
        },
      },
    ]);
  }

  const flights = transports.filter(t => t.type === 'Flight');
  const transfers = transports.filter(t => ['Taxi', 'Rental Car'].includes(t.type));
  const others = transports.filter(t => !['Flight', 'Taxi', 'Rental Car'].includes(t.type));
  const nextUp = transports.find(t => t.status === 'UPCOMING') ?? transports[0];
  const visibleList = activeTab === 'Flights' ? flights : activeTab === 'Transfers' ? transfers : others;

  const MENU_ITEMS = [
    { label: 'Add flight', icon: '✈️', onPress: () => setAddFlightVisible(true) },
    { label: 'Add transfer', icon: '🚗', onPress: () => setAddTransferVisible(true) },
    { label: 'Add other transport', icon: '🚌', onPress: () => setAddOtherVisible(true) },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Transport</Text>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Text style={{ fontSize: 22 }}>⋯</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

          {nextUp && (
            <SectionBlock title="NEXT UP" headerColor="#AED581" textColor="#33691E" icon={TYPE_ICONS[nextUp.type] ?? '🚌'}>
              <View style={styles.featuredCard}>
                <View style={styles.featuredTop}>
                  <View style={styles.airlineRow}>
                    <View style={styles.airlineIcon}>
                      <Text style={{ fontSize: 22 }}>{TYPE_ICONS[nextUp.type] ?? '🚌'}</Text>
                    </View>
                    <View>
                      <Text style={styles.airlineName}>{nextUp.airline ?? nextUp.type}</Text>
                      {nextUp.flight_number ? <Text style={styles.flightNum}>{nextUp.flight_number}</Text> : null}
                    </View>
                  </View>
                  <StatusBadge status={nextUp.status ?? 'UPCOMING'} />
                </View>

                <View style={styles.routeRow}>
                  <View style={styles.routeEnd}>
                    <Text style={styles.airportCode}>{nextUp.departure_location}</Text>
                  </View>
                  <View style={styles.routeMiddle}>
                    <Text style={styles.routeArrow}>→</Text>
                  </View>
                  <View style={[styles.routeEnd, styles.routeEndRight]}>
                    <Text style={styles.airportCode}>{nextUp.arrival_location}</Text>
                  </View>
                </View>

                <View style={styles.timesRow}>
                  <View style={styles.timeBlock}>
                    <Text style={styles.timeValue}>{formatTime(nextUp.departure_time)}</Text>
                    <Text style={styles.timeDate}>{formatDate(nextUp.departure_time)}</Text>
                    {nextUp.terminal ? <Text style={styles.timeSub}>{nextUp.terminal}</Text> : null}
                  </View>
                  <View style={styles.planeIconCenter}>
                    <Text style={{ fontSize: 28 }}>{TYPE_ICONS[nextUp.type] ?? '🚌'}</Text>
                  </View>
                  <View style={[styles.timeBlock, styles.timeBlockRight]}>
                    <Text style={styles.timeValue}>{formatTime(nextUp.arrival_time)}</Text>
                    <Text style={styles.timeDate}>{formatDate(nextUp.arrival_time)}</Text>
                    {nextUp.gate ? <Text style={styles.timeSub}>{nextUp.gate}</Text> : null}
                  </View>
                </View>

                {(nextUp.seat || nextUp.booking_reference) ? (
                  <View style={styles.detailsRow}>
                    {nextUp.seat ? (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Seat</Text>
                        <Text style={styles.detailValue}>{nextUp.seat}</Text>
                      </View>
                    ) : null}
                    {nextUp.seat && nextUp.booking_reference ? <View style={styles.detailDivider} /> : null}
                    {nextUp.booking_reference ? (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Booking ref.</Text>
                        <Text style={styles.detailValue}>{nextUp.booking_reference}</Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </SectionBlock>
          )}

          <SectionBlock
            title={activeTab.toUpperCase()}
            headerColor="#90CAF9"
            textColor="#0D47A1"
            icon={activeTab === 'Flights' ? '🛫' : activeTab === 'Transfers' ? '🚗' : '🚌'}
          >
            {visibleList.length === 0 ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>
                  {activeTab === 'Flights' ? '✈️' : activeTab === 'Transfers' ? '🚗' : '🚌'}
                </Text>
                <Text style={{ fontSize: 14, color: '#888' }}>No {activeTab.toLowerCase()} yet</Text>
              </View>
            ) : (
              visibleList.map((t, index) => (
                <View key={t.id}>
                  <TouchableOpacity
                    style={styles.flightRow}
                    onLongPress={() => handleDelete(t.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.flightIcon}>
                      <Text style={{ fontSize: 18 }}>{TYPE_ICONS[t.type] ?? '🚌'}</Text>
                    </View>
                    <View style={styles.flightInfo}>
                      <Text style={styles.flightAirline}>{t.airline ?? t.type}</Text>
                      <Text style={styles.flightNumber}>{t.departure_location} → {t.arrival_location}</Text>
                      {t.departure_time ? <Text style={styles.flightTime}>{formatDate(t.departure_time)} · {formatTime(t.departure_time)}</Text> : null}
                    </View>
                    <StatusBadge status={t.status ?? 'UPCOMING'} small />
                  </TouchableOpacity>
                  {index < visibleList.length - 1 ? <View style={styles.divider} /> : null}
                </View>
              ))
            )}
          </SectionBlock>

          <Text style={styles.hint}>💡 Long press on an item to delete it</Text>

          <View style={styles.footerDecor}>
            <Dot color="#BBB" size={5} style={{ position: 'relative' }} />
            <Dot color="#BBB" size={4} style={{ position: 'relative', marginLeft: 8 }} />
            <Sparkle color="#FF9800" size={10} style={{ position: 'relative', marginLeft: 6 }} />
          </View>
          <View style={{ height: 24 }} />
        </ScrollView>
      )}

      <MenuSheet visible={menuVisible} onClose={() => setMenuVisible(false)} items={MENU_ITEMS} />

      <BottomSheet visible={addFlightVisible} onClose={() => setAddFlightVisible(false)} title="Add Flight">
        <FlightForm onSave={handleSave} onClose={() => setAddFlightVisible(false)} />
      </BottomSheet>

      <BottomSheet visible={addTransferVisible} onClose={() => setAddTransferVisible(false)} title="Add Transfer">
        <OtherTransportForm type="Taxi" onSave={handleSave} onClose={() => setAddTransferVisible(false)} />
      </BottomSheet>

      <BottomSheet visible={addOtherVisible} onClose={() => setAddOtherVisible(false)} title="Add Transport">
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 8 }}>Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, flexDirection: 'row', marginBottom: 8 }}>
          {TRANSPORT_TYPES.map((t) => (
            <TouchableOpacity
              key={t}
              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: transportType === t ? '#4CAF50' : '#EBEBEB', backgroundColor: transportType === t ? '#E8F5E9' : '#F5F5F5' }}
              onPress={() => setTransportType(t)}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: transportType === t ? '#4CAF50' : '#666' }}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <OtherTransportForm type={transportType} onSave={handleSave} onClose={() => setAddOtherVisible(false)} />
      </BottomSheet>
    </SafeAreaView>
  );
}

const fStyles = StyleSheet.create({
  fieldWrap: { marginBottom: 10 },
  label: { fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 5, letterSpacing: 0.3 },
  optional: { fontWeight: '400', color: '#BBB' },
  input: { backgroundColor: '#FAFAFA', borderRadius: 12, borderWidth: 0.5, borderColor: '#E0E0E0', paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1A1A1A' },
  multiline: { height: 70, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#E8E8E8' },
  scroll: { flex: 1, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  backBtn: { padding: 4 },
  backIcon: { fontSize: 28, color: '#1A1A1A', fontWeight: '300' },
  title: { fontSize: 24, fontWeight: '800', color: '#1A1A1A' },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', gap: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  tab: { paddingHorizontal: 20, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F0F0F0' },
  tabActive: { backgroundColor: '#4CAF50' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#666' },
  tabTextActive: { color: '#fff' },
  featuredCard: { padding: 8 },
  featuredTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  airlineRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  airlineIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' },
  airlineName: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  flightNum: { fontSize: 12, color: '#888' },
  routeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  routeEnd: { flex: 2 },
  routeEndRight: { alignItems: 'flex-end' },
  routeMiddle: { flex: 1, alignItems: 'center' },
  routeArrow: { fontSize: 22, color: '#1A1A1A' },
  airportCode: { fontSize: 24, fontWeight: '900', color: '#1A1A1A' },
  timesRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#F0F0F0', borderBottomWidth: 1, borderBottomColor: '#F0F0F0', marginBottom: 14 },
  timeBlock: { flex: 2 },
  timeBlockRight: { alignItems: 'flex-end' },
  timeValue: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  timeDate: { fontSize: 12, color: '#888', marginTop: 2 },
  timeSub: { fontSize: 12, color: '#666', marginTop: 4 },
  planeIconCenter: { flex: 1, alignItems: 'center' },
  detailsRow: { flexDirection: 'row', alignItems: 'center' },
  detailItem: { flex: 1 },
  detailDivider: { width: 1, height: 36, backgroundColor: '#E0E0E0', marginHorizontal: 16 },
  detailLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  detailValue: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  flightRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  flightIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  flightInfo: { flex: 1 },
  flightAirline: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  flightNumber: { fontSize: 12, color: '#888', marginTop: 2 },
  flightTime: { fontSize: 11, color: '#BBB', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F5F5F5' },
  hint: { textAlign: 'center', fontSize: 12, color: '#BBB', marginBottom: 8 },
  footerDecor: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
});
