import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Modal, Switch,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getDestinationHero } from '../../lib/destinationHero';

function toLocalIsoString(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

function formatDateDisplay(d: Date | null): string {
  if (!d) return 'Select date';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTimeDisplay(d: Date | null): string {
  if (!d) return 'Select time';
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function withDatePart(existing: Date | null, picked: Date): Date {
  const base = existing ? new Date(existing) : new Date();
  base.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
  return base;
}

function withTimePart(existing: Date | null, picked: Date): Date {
  const base = existing ? new Date(existing) : new Date();
  base.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
  return base;
}

interface DestinationContext {
  name: string;
  country: string | null;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  tripName?: string;
  tripCurrency?: string;
  destinationContext?: DestinationContext | null;
  editItem?: any | null;
  onSave: (data: any) => Promise<void>;
}

type PickerTarget = { field: 'departure' | 'arrival'; mode: 'date' | 'time' } | null;

export default function AddFlightModal({ visible, onClose, tripName, tripCurrency, destinationContext, editItem, onSave }: Props) {
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [airline, setAirline] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [departureDate, setDepartureDate] = useState<Date | null>(null);
  const [arrivalDate, setArrivalDate] = useState<Date | null>(null);
  const [activePicker, setActivePicker] = useState<PickerTarget>(null);
  const [terminal, setTerminal] = useState('');
  const [gate, setGate] = useState('');
  const [seat, setSeat] = useState('');
  const [bookingRef, setBookingRef] = useState('');
  const [notes, setNotes] = useState('');
  const [addToBudget, setAddToBudget] = useState(false);
  const [costAmount, setCostAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const canSave = fromCity.trim() && toCity.trim() && airline.trim() && flightNumber.trim();

  function resetForm() {
    setFromCity(''); setToCity(''); setAirline(''); setFlightNumber('');
    setDepartureDate(null); setArrivalDate(null);
    setTerminal(''); setGate(''); setSeat(''); setBookingRef(''); setNotes('');
    setAddToBudget(false); setCostAmount('');
  }

  function parseStoredDate(ts: string | null): Date | null {
    if (!ts) return null;
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
  }

  React.useEffect(() => {
    if (!visible) return;
    if (editItem) {
      setFromCity(editItem.departure_location ?? '');
      setToCity(editItem.arrival_location ?? '');
      setAirline(editItem.airline ?? '');
      setFlightNumber(editItem.flight_number ?? '');
      setDepartureDate(parseStoredDate(editItem.departure_time));
      setArrivalDate(parseStoredDate(editItem.arrival_time));
      setTerminal(editItem.terminal ?? '');
      setGate(editItem.gate ?? '');
      setSeat(editItem.seat ?? '');
      setBookingRef(editItem.booking_reference ?? '');
      setNotes(editItem.notes ?? '');
      setAddToBudget(false);
      setCostAmount('');
    } else {
      resetForm();
    }
  }, [visible, editItem]);

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    await onSave({
      type: 'Flight',
      airline: airline.trim(),
      flight_number: flightNumber.trim(),
      departure_location: fromCity.trim(),
      arrival_location: toCity.trim(),
      departure_time: departureDate ? toLocalIsoString(departureDate) : null,
      arrival_time: arrivalDate ? toLocalIsoString(arrivalDate) : null,
      terminal: terminal.trim() || null,
      gate: gate.trim() || null,
      seat: seat.trim() || null,
      booking_reference: bookingRef.trim() || null,
      notes: notes.trim() || null,
      status: 'UPCOMING',
      _addToBudget: addToBudget,
      _costAmount: costAmount,
    });
    setSaving(false);
    resetForm();
    onClose();
  }

  const heroTheme = destinationContext
    ? getDestinationHero(destinationContext.name, destinationContext.country)
    : null;

  const pickerValue = activePicker
    ? (activePicker.field === 'departure' ? departureDate : arrivalDate) ?? new Date()
    : new Date();

  function onPickerChange(_: any, selected?: Date) {
    const target = activePicker;
    if (Platform.OS === 'android') setActivePicker(null);
    if (!selected || !target) return;

    if (target.field === 'departure') {
      setDepartureDate((prev) => target.mode === 'date' ? withDatePart(prev, selected) : withTimePart(prev, selected));
    } else {
      setArrivalDate((prev) => target.mode === 'date' ? withDatePart(prev, selected) : withTimePart(prev, selected));
    }
    if (Platform.OS === 'ios') setActivePicker(null);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kvWrapper}>
          <View style={styles.sheet}>

            <View style={styles.header}>
              <TouchableOpacity onPress={() => { resetForm(); onClose(); }} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{editItem ? 'Edit Flight' : 'Add Flight'}</Text>
              <TouchableOpacity
                onPress={handleSave}
                disabled={!canSave || saving}
                style={[styles.saveBtn, (!canSave || saving) && styles.saveBtnDisabled]}
              >
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveText}>Save</Text>}
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              {destinationContext && heroTheme && (
                <View style={[styles.heroCard, { backgroundColor: heroTheme.background, borderColor: heroTheme.border }]}>
                  <View style={[styles.heroBlobOne, { backgroundColor: heroTheme.blobOne }]} />
                  <View style={[styles.heroBlobTwo, { backgroundColor: heroTheme.blobTwo }]} />
                  <View style={styles.heroTextBlock}>
                    <Text style={styles.heroName} numberOfLines={1}>{tripName ?? destinationContext.name}</Text>
                    <View style={[styles.heroBadge, { backgroundColor: heroTheme.pillBg }]}>
                      <Text style={[styles.heroBadgeText, { color: heroTheme.text }]}>✈️ Flying to {destinationContext.name}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Route */}
              <Text style={styles.sectionLabel}>Route</Text>
              <View style={styles.routeCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeCardLabel}>FROM</Text>
                  <TextInput
                    style={styles.routeInput}
                    placeholder="Cluj (CLJ)"
                    placeholderTextColor="#C0C0C0"
                    value={fromCity}
                    onChangeText={setFromCity}
                  />
                </View>
                <View style={styles.routePlaneWrap}>
                  <Text style={{ fontSize: 18 }}>✈️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeCardLabel}>TO</Text>
                  <TextInput
                    style={styles.routeInput}
                    placeholder="Istanbul (IST)"
                    placeholderTextColor="#C0C0C0"
                    value={toCity}
                    onChangeText={setToCity}
                  />
                </View>
              </View>

              {/* Airline & Flight */}
              <Text style={styles.sectionLabel}>Airline & Flight</Text>
              <View style={styles.airlineCard}>
                <View style={styles.airlineIconWrap}>
                  <Text style={{ fontSize: 20 }}>🛫</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={styles.airlineInput}
                    placeholder="Airline name"
                    placeholderTextColor="#C0C0C0"
                    value={airline}
                    onChangeText={setAirline}
                  />
                  <TextInput
                    style={styles.flightNumInput}
                    placeholder="Flight number, e.g. TK1044"
                    placeholderTextColor="#C0C0C0"
                    value={flightNumber}
                    onChangeText={setFlightNumber}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              {/* Schedule */}
              <Text style={styles.sectionLabel}>Schedule <Text style={styles.optional}>(optional)</Text></Text>
              <View style={styles.scheduleRow}>
                <View style={styles.scheduleCard}>
                  <Text style={styles.scheduleLabel}>DEPARTURE</Text>
                  <TouchableOpacity style={styles.scheduleSubRow} onPress={() => setActivePicker({ field: 'departure', mode: 'date' })}>
                    <Text style={styles.scheduleValue} numberOfLines={1}>{formatDateDisplay(departureDate)}</Text>
                    <Text>📅</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.scheduleSubRow} onPress={() => setActivePicker({ field: 'departure', mode: 'time' })}>
                    <Text style={styles.scheduleValue}>{formatTimeDisplay(departureDate)}</Text>
                    <Text>🕐</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.scheduleCard}>
                  <Text style={styles.scheduleLabel}>ARRIVAL</Text>
                  <TouchableOpacity style={styles.scheduleSubRow} onPress={() => setActivePicker({ field: 'arrival', mode: 'date' })}>
                    <Text style={styles.scheduleValue} numberOfLines={1}>{formatDateDisplay(arrivalDate)}</Text>
                    <Text>📅</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.scheduleSubRow} onPress={() => setActivePicker({ field: 'arrival', mode: 'time' })}>
                    <Text style={styles.scheduleValue}>{formatTimeDisplay(arrivalDate)}</Text>
                    <Text>🕐</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {activePicker && (
                <DateTimePicker
                  value={pickerValue}
                  mode={activePicker.mode}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  is24Hour
                  onChange={onPickerChange}
                />
              )}

              {/* Airport details */}
              <Text style={styles.sectionLabel}>Airport Details <Text style={styles.optional}>(optional)</Text></Text>
              <View style={styles.gridRow}>
                <View style={styles.gridCard}>
                  <Text style={styles.gridLabel}>Terminal</Text>
                  <TextInput style={styles.gridInput} placeholder="T1" placeholderTextColor="#C0C0C0" value={terminal} onChangeText={setTerminal} />
                </View>
                <View style={styles.gridCard}>
                  <Text style={styles.gridLabel}>Gate</Text>
                  <TextInput style={styles.gridInput} placeholder="G3" placeholderTextColor="#C0C0C0" value={gate} onChangeText={setGate} />
                </View>
              </View>
              <View style={styles.gridRow}>
                <View style={styles.gridCard}>
                  <Text style={styles.gridLabel}>Seat</Text>
                  <TextInput style={styles.gridInput} placeholder="14A" placeholderTextColor="#C0C0C0" value={seat} onChangeText={setSeat} />
                </View>
                <View style={styles.gridCard}>
                  <Text style={styles.gridLabel}>Booking ref</Text>
                  <TextInput style={styles.gridInput} placeholder="ABCDEF" placeholderTextColor="#C0C0C0" value={bookingRef} onChangeText={setBookingRef} autoCapitalize="characters" />
                </View>
              </View>

              {/* Notes */}
              <Text style={styles.sectionLabel}>Notes <Text style={styles.optional}>(optional)</Text></Text>
              <View style={styles.notesCard}>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Add any extra details..."
                  placeholderTextColor="#C0C0C0"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Import (coming soon) */}
              <View style={styles.importRow}>
                <Text style={{ fontSize: 16 }}>📇</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.importTitle}>Import</Text>
                  <Text style={styles.importSubtitle}>Fill details automatically</Text>
                </View>
                <View style={styles.soonBadge}><Text style={styles.soonBadgeText}>Soon</Text></View>
              </View>

              {/* Budget toggle */}
              <View style={styles.budgetCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.budgetTitle}>Add to budget as expense</Text>
                  <Text style={styles.budgetSubtitle}>Create expense automatically</Text>
                </View>
                <Switch
                  value={addToBudget}
                  onValueChange={setAddToBudget}
                  trackColor={{ false: '#E0D5C7', true: '#A5D6A7' }}
                  thumbColor={addToBudget ? '#4CAF50' : '#fff'}
                />
              </View>
              {addToBudget && (
                <View style={styles.costCard}>
                  <Text style={styles.gridLabel}>Cost {tripCurrency ? `(${tripCurrency})` : ''}</Text>
                  <TextInput
                    style={styles.gridInput}
                    placeholder="0.00"
                    placeholderTextColor="#C0C0C0"
                    value={costAmount}
                    onChangeText={setCostAmount}
                    keyboardType="decimal-pad"
                  />
                </View>
              )}

              <View style={{ height: 24 }} />
            </ScrollView>

            <View style={styles.stickyBottom}>
              <TouchableOpacity
                style={[styles.addBtn, (!canSave || saving) && styles.addBtnDisabled]}
                onPress={handleSave}
                disabled={!canSave || saving}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.addBtnText}>{editItem ? 'Save Changes' : 'Save Flight'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  kvWrapper: { flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFF8F0', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '95%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A1A' },
  cancelBtn: { padding: 4 },
  cancelText: { fontSize: 15, color: '#4CAF50', fontWeight: '600' },
  saveBtn: { backgroundColor: '#4CAF50', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
  saveBtnDisabled: { backgroundColor: '#C8E6C9' },
  saveText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  scroll: { flex: 1, paddingHorizontal: 16 },

  heroCard: {
    height: 100, borderRadius: 24, borderWidth: 1, overflow: 'hidden',
    position: 'relative', marginTop: 8, marginBottom: 16, justifyContent: 'flex-end',
  },
  heroBlobOne: { position: 'absolute', width: 120, height: 120, borderRadius: 999, top: -44, left: -30, opacity: 0.78 },
  heroBlobTwo: { position: 'absolute', width: 140, height: 140, borderRadius: 999, right: -48, bottom: -60, opacity: 0.72 },
  heroTextBlock: { padding: 14 },
  heroName: { fontSize: 16, fontWeight: '900', color: '#1A1A1A', marginBottom: 6 },
  heroBadge: { alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  heroBadgeText: { fontSize: 11, fontWeight: '800' },

  sectionLabel: { fontSize: 12, fontWeight: '800', color: '#8A817A', letterSpacing: 0.4, marginBottom: 8, marginTop: 4, textTransform: 'uppercase' },
  optional: { fontWeight: '400', color: '#B0A89E', textTransform: 'none' },

  routeCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 18,
    padding: 14, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  routeCardLabel: { fontSize: 10, fontWeight: '800', color: '#B0A89E', letterSpacing: 0.4, marginBottom: 4 },
  routeInput: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', padding: 0 },
  routePlaneWrap: { paddingHorizontal: 10 },

  airlineCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 18,
    padding: 14, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  airlineIconWrap: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#FFEBEE', alignItems: 'center', justifyContent: 'center' },
  airlineInput: { fontSize: 15, fontWeight: '800', color: '#1A1A1A', padding: 0, marginBottom: 6 },
  flightNumInput: { fontSize: 13, fontWeight: '600', color: '#8A817A', padding: 0 },

  scheduleRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  scheduleCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 12, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  scheduleLabel: { fontSize: 10, fontWeight: '800', color: '#B0A89E', letterSpacing: 0.4, marginBottom: 8 },
  scheduleSubRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  scheduleValue: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', flexShrink: 1 },

  gridRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  gridCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 12, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  gridLabel: { fontSize: 11, fontWeight: '800', color: '#8A817A', marginBottom: 4 },
  gridInput: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', padding: 0 },

  notesCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  notesInput: { fontSize: 13, color: '#1A1A1A', padding: 0, minHeight: 50, textAlignVertical: 'top' },

  importRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F3F0FF', borderRadius: 14, padding: 12, marginBottom: 16, opacity: 0.75 },
  importTitle: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
  importSubtitle: { fontSize: 11, color: '#8A817A', marginTop: 1, fontWeight: '600' },
  soonBadge: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  soonBadgeText: { fontSize: 10, fontWeight: '800', color: '#7E57C2' },

  budgetCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 16,
    padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  budgetTitle: { fontSize: 13, fontWeight: '800', color: '#1A1A1A' },
  budgetSubtitle: { fontSize: 11, color: '#8A817A', marginTop: 2, fontWeight: '600' },
  costCard: { backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },

  stickyBottom: { padding: 16, backgroundColor: '#FFF8F0' },
  addBtn: { backgroundColor: '#4CAF50', borderRadius: 18, paddingVertical: 17, alignItems: 'center', shadowColor: '#4CAF50', shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 },
  addBtnDisabled: { backgroundColor: '#C8E6C9', shadowOpacity: 0 },
  addBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
