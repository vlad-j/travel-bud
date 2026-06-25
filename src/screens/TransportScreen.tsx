import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppStore } from '../store/useAppStore';
import StatusBadge from '../components/StatusBadge';
import { MenuSheet } from '../components/BottomSheet';
import BottomSheet, { SheetButton } from '../components/BottomSheet';
import { Flight } from '../data/sampleData';
import { Dot, Sparkle } from '../components/TravelDecorations';

const TRANSPORT_TYPES = ['Flight', 'Train', 'Ferry', 'Bus', 'Taxi', 'Rental Car'];

function FlightForm({ onSave, onClose }: { onSave: (f: Omit<Flight, 'id'>) => void; onClose: () => void }) {
  const [airline, setAirline] = useState('');
  const [flightNum, setFlightNum] = useState('');
  const [from, setFrom] = useState('');
  const [fromCity, setFromCity] = useState('');
  const [to, setTo] = useState('');
  const [toCity, setToCity] = useState('');
  const [departure, setDeparture] = useState('');
  const [arrival, setArrival] = useState('');
  const [terminal, setTerminal] = useState('');
  const [gate, setGate] = useState('');
  const [seat, setSeat] = useState('');
  const [bookingRef, setBookingRef] = useState('');
  const [departureDate, setDepartureDate] = useState('');

  const canSave = airline.trim() && flightNum.trim() && from.trim() && to.trim();

  return (
    <>
      <F label="Airline" placeholder="e.g. Garuda Indonesia" value={airline} onChangeText={setAirline} />
      <F label="Flight number" placeholder="e.g. GA408" value={flightNum} onChangeText={setFlightNum} />
      <View style={fStyles.row}>
        <View style={fStyles.half}><F label="From (code)" placeholder="YOG" value={from} onChangeText={setFrom} /></View>
        <View style={fStyles.half}><F label="From (city)" placeholder="Yogyakarta" value={fromCity} onChangeText={setFromCity} /></View>
      </View>
      <View style={fStyles.row}>
        <View style={fStyles.half}><F label="To (code)" placeholder="DPS" value={to} onChangeText={setTo} /></View>
        <View style={fStyles.half}><F label="To (city)" placeholder="Bali" value={toCity} onChangeText={setToCity} /></View>
      </View>
      <View style={fStyles.row}>
        <View style={fStyles.half}><F label="Departure time" placeholder="18:20" value={departure} onChangeText={setDeparture} /></View>
        <View style={fStyles.half}><F label="Arrival time" placeholder="19:45" value={arrival} onChangeText={setArrival} /></View>
      </View>
      <F label="Departure date" placeholder="e.g. Today / May 16" value={departureDate} onChangeText={setDepartureDate} optional />
      <View style={fStyles.row}>
        <View style={fStyles.half}><F label="Terminal" placeholder="Terminal 1" value={terminal} onChangeText={setTerminal} optional /></View>
        <View style={fStyles.half}><F label="Gate" placeholder="Gate 3" value={gate} onChangeText={setGate} optional /></View>
      </View>
      <View style={fStyles.row}>
        <View style={fStyles.half}><F label="Seat" placeholder="14A" value={seat} onChangeText={setSeat} optional /></View>
        <View style={fStyles.half}><F label="Booking ref" placeholder="ABCDEF" value={bookingRef} onChangeText={setBookingRef} optional /></View>
      </View>
      <SheetButton
        label="Save Flight"
        disabled={!canSave}
        onPress={() => {
          onSave({
            airline, flightNumber: flightNum, from, fromCity, to, toCity,
            departure, arrival, terminal, gate, seat, bookingRef,
            departureDate: departureDate || 'Upcoming', status: 'UPCOMING',
          });
          onClose();
        }}
      />
    </>
  );
}

function OtherTransportForm({ type, onSave, onClose }: { type: string; onSave: (f: Omit<Flight, 'id'>) => void; onClose: () => void }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [departure, setDeparture] = useState('');
  const [arrival, setArrival] = useState('');
  const [bookingRef, setBookingRef] = useState('');
  const [notes, setNotes] = useState('');
  const canSave = from.trim() && to.trim();

  return (
    <>
      <F label="From" placeholder="e.g. Ubud" value={from} onChangeText={setFrom} />
      <F label="To" placeholder="e.g. Seminyak" value={to} onChangeText={setTo} />
      <View style={fStyles.row}>
        <View style={fStyles.half}><F label="Departure time" placeholder="10:00" value={departure} onChangeText={setDeparture} /></View>
        <View style={fStyles.half}><F label="Arrival time" placeholder="11:30" value={arrival} onChangeText={setArrival} /></View>
      </View>
      <F label="Booking ref" placeholder="Optional" value={bookingRef} onChangeText={setBookingRef} optional />
      <F label="Notes" placeholder="Optional notes" value={notes} onChangeText={setNotes} optional multiline />
      <SheetButton
        label={`Save ${type}`}
        disabled={!canSave}
        onPress={() => {
          onSave({
            airline: type, flightNumber: `${type.toUpperCase()[0]}-${Date.now().toString().slice(-4)}`,
            from, fromCity: from, to, toCity: to,
            departure, arrival, terminal: '', gate: '', seat: '', bookingRef,
            departureDate: 'Upcoming', status: 'UPCOMING',
          });
          onClose();
        }}
      />
    </>
  );
}

function F({ label, placeholder, value, onChangeText, optional, multiline }: {
  label: string; placeholder: string; value: string;
  onChangeText: (t: string) => void; optional?: boolean; multiline?: boolean;
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

const fStyles = StyleSheet.create({
  fieldWrap: { marginBottom: 10 },
  label: { fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 5, letterSpacing: 0.3 },
  optional: { fontWeight: '400', color: '#BBB' },
  input: {
    backgroundColor: '#FAFAFA', borderRadius: 12, borderWidth: 0.5, borderColor: '#E0E0E0',
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1A1A1A',
  },
  multiline: { height: 70, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
});

const TABS = ['Flights', 'Transfers', 'Other'];

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

export default function TransportScreen() {
  const [activeTab, setActiveTab] = useState('Flights');
  const [menuVisible, setMenuVisible] = useState(false);
  const [addFlightVisible, setAddFlightVisible] = useState(false);
  const [addTransferVisible, setAddTransferVisible] = useState(false);
  const [addOtherVisible, setAddOtherVisible] = useState(false);
  const [transportType, setTransportType] = useState('Train');
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { flights, addFlight } = useAppStore();

  const nextFlight = flights.find((f) => f.status === 'UPCOMING') ?? flights[0];
  const CONNECTION_HINT = 'Next: Check-in Villa Padi Ubud';

  const MENU_ITEMS = [
    { label: 'Add flight', icon: '✈️', onPress: () => setAddFlightVisible(true) },
    { label: 'Add transfer', icon: '🚗', onPress: () => { setTransportType('Taxi'); setAddTransferVisible(true); } },
    { label: 'Add other transport', icon: '🚌', onPress: () => { setTransportType('Bus'); setAddOtherVisible(true); } },
    { label: 'Sort by date', icon: '📅', onPress: () => {} },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
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

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Next up */}
        <SectionBlock title="NEXT UP" headerColor="#AED581" textColor="#33691E" icon="✈️">
          {nextFlight && (
            <View style={styles.featuredCard}>
              <View style={styles.featuredTop}>
                <View style={styles.airlineRow}>
                  <View style={styles.airlineIcon}><Text style={{ fontSize: 22 }}>✈️</Text></View>
                  <View>
                    <Text style={styles.airlineName}>{nextFlight.airline}</Text>
                    <Text style={styles.flightNum}>{nextFlight.flightNumber}</Text>
                  </View>
                </View>
                <StatusBadge status={nextFlight.status} />
              </View>

              <View style={styles.routeRow}>
                <View style={styles.routeEnd}>
                  <Text style={styles.airportCode}>{nextFlight.from}</Text>
                  <Text style={styles.airportCity}>{nextFlight.fromCity}</Text>
                </View>
                <View style={styles.routeMiddle}><Text style={styles.routeArrow}>→</Text></View>
                <View style={[styles.routeEnd, styles.routeEndRight]}>
                  <Text style={styles.airportCode}>{nextFlight.to}</Text>
                  <Text style={styles.airportCity}>{nextFlight.toCity}</Text>
                </View>
              </View>

              <View style={styles.timesRow}>
                <View style={styles.timeBlock}>
                  <Text style={styles.timeValue}>{nextFlight.departure}</Text>
                  <Text style={styles.timeDate}>{nextFlight.departureDate}</Text>
                  <Text style={styles.timeSub}>{nextFlight.terminal}</Text>
                </View>
                <View style={styles.planeIconCenter}><Text style={{ fontSize: 28 }}>✈</Text></View>
                <View style={[styles.timeBlock, styles.timeBlockRight]}>
                  <Text style={styles.timeValue}>{nextFlight.arrival}</Text>
                  <Text style={styles.timeDate}>{nextFlight.departureDate}</Text>
                  <Text style={styles.timeSub}>{nextFlight.gate}</Text>
                </View>
              </View>

              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Seat</Text>
                  <Text style={styles.detailValue}>{nextFlight.seat}</Text>
                </View>
                <View style={styles.detailDivider} />
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Booking ref.</Text>
                  <Text style={styles.detailValue}>{nextFlight.bookingRef}</Text>
                </View>
              </View>

              <View style={styles.connectionHint}>
                <Dot color="#4CAF50" size={7} style={{ position: 'relative' }} />
                <Text style={styles.connectionText}>{CONNECTION_HINT}</Text>
              </View>
            </View>
          )}
        </SectionBlock>

        {/* All flights */}
        <SectionBlock title="ALL FLIGHTS" headerColor="#90CAF9" textColor="#0D47A1" icon="🛫">
          {flights.map((flight, index) => (
            <View key={flight.id}>
              <TouchableOpacity style={styles.flightRow}>
                <View style={styles.flightIcon}>
                  <Text style={{ fontSize: 18 }}>{flight.airline === 'Turkish Airlines' ? '🇹🇷' : '✈️'}</Text>
                </View>
                <View style={styles.flightInfo}>
                  <Text style={styles.flightAirline}>{flight.airline}</Text>
                  <Text style={styles.flightNumber}>{flight.flightNumber}</Text>
                </View>
                <StatusBadge status={flight.status} small />
              </TouchableOpacity>
              {index < flights.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </SectionBlock>

        <View style={styles.footerDecor}>
          <Dot color="#BBB" size={5} style={{ position: 'relative' }} />
          <Dot color="#BBB" size={4} style={{ position: 'relative', marginLeft: 8 }} />
          <Sparkle color="#FF9800" size={10} style={{ position: 'relative', marginLeft: 6 }} />
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>

      <MenuSheet visible={menuVisible} onClose={() => setMenuVisible(false)} items={MENU_ITEMS} />
      <BottomSheet visible={addFlightVisible} onClose={() => setAddFlightVisible(false)} title="Add Flight">
        <FlightForm onSave={addFlight} onClose={() => setAddFlightVisible(false)} />
      </BottomSheet>
      <BottomSheet visible={addTransferVisible} onClose={() => setAddTransferVisible(false)} title="Add Transfer">
        <OtherTransportForm type="Taxi" onSave={addFlight} onClose={() => setAddTransferVisible(false)} />
      </BottomSheet>
      <BottomSheet visible={addOtherVisible} onClose={() => setAddOtherVisible(false)} title="Add Transport">
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 8 }}>Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, flexDirection: 'row', marginBottom: 8 }}>
          {TRANSPORT_TYPES.filter((t) => t !== 'Flight').map((t) => (
            <TouchableOpacity
              key={t}
              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: transportType === t ? '#4CAF50' : '#EBEBEB', backgroundColor: transportType === t ? '#E8F5E9' : '#F5F5F5' }}
              onPress={() => setTransportType(t)}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: transportType === t ? '#4CAF50' : '#666' }}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <OtherTransportForm type={transportType} onSave={addFlight} onClose={() => setAddOtherVisible(false)} />
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#E8E8E8' },
  scroll: { flex: 1, padding: 16 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  backBtn: { padding: 4 },
  backIcon: { fontSize: 28, color: '#1A1A1A', fontWeight: '300' },
  title: { fontSize: 24, fontWeight: '800', color: '#1A1A1A' },
  tabRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#fff', gap: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  tab: { paddingHorizontal: 20, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F0F0F0' },
  tabActive: { backgroundColor: '#4CAF50' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#666' },
  tabTextActive: { color: '#fff' },

  sectionBlock: { marginBottom: 16, borderRadius: 20, overflow: 'hidden', borderWidth: 3 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 24 },
  sectionTitleWrap: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  sectionCard: { backgroundColor: '#fff', borderRadius: 16, margin: 4, marginTop: -16, paddingHorizontal: 10, paddingVertical: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: -2 }, elevation: 3 },

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
  airportCode: { fontSize: 32, fontWeight: '900', color: '#1A1A1A' },
  airportCity: { fontSize: 12, color: '#888', marginTop: 2 },
  timesRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0', marginBottom: 14,
  },
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
  connectionHint: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12,
    paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  connectionText: { fontSize: 13, color: '#4CAF50', fontWeight: '600' },

  flightRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  flightIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  flightInfo: { flex: 1 },
  flightAirline: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  flightNumber: { fontSize: 12, color: '#888', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F5F5F5' },
  footerDecor: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
});
