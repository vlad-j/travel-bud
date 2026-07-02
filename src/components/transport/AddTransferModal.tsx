import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Modal, Switch,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getDestinationHero } from '../../lib/destinationHero';
import { getTransportTypeMeta } from './TransportCard';
import TransportTypePicker from './TransportTypePicker';

function toLocalIsoString(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

function formatDateTimeDisplay(d: Date | null): string {
  if (!d) return 'Select date & time';
  const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${date}, ${time}`;
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
  title: string;
  initialType: string;
  tripName?: string;
  tripCurrency?: string;
  destinationContext?: DestinationContext | null;
  editItem?: any | null;
  onSave: (data: any) => Promise<void>;
}

type PickerTarget = { field: 'departure' | 'arrival'; step: 'date' | 'time' } | null;

export default function AddTransferModal({
  visible, onClose, title, initialType, tripName, tripCurrency, destinationContext, editItem, onSave,
}: Props) {
  const [type, setType] = useState(initialType);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [fromText, setFromText] = useState('');
  const [toText, setToText] = useState('');
  const [departureDate, setDepartureDate] = useState<Date | null>(null);
  const [arrivalDate, setArrivalDate] = useState<Date | null>(null);
  const [activePicker, setActivePicker] = useState<PickerTarget>(null);
  const [provider, setProvider] = useState('');
  const [bookingRef, setBookingRef] = useState('');
  const [notes, setNotes] = useState('');
  const [priceAmount, setPriceAmount] = useState('');
  const [priceCurrency, setPriceCurrency] = useState('');
  const [addToBudget, setAddToBudget] = useState(false);
  const [saving, setSaving] = useState(false);

  const canSave = fromText.trim() && toText.trim();
  const meta = getTransportTypeMeta(type);

  function parseStoredDate(ts: string | null): Date | null {
    if (!ts) return null;
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
  }

  React.useEffect(() => {
    if (!visible) return;
    if (editItem) {
      setType(editItem.type ?? initialType);
      setFromText(editItem.departure_location ?? '');
      setToText(editItem.arrival_location ?? '');
      setDepartureDate(parseStoredDate(editItem.departure_time));
      setArrivalDate(parseStoredDate(editItem.arrival_time));
      setProvider(editItem.airline ?? '');
      setBookingRef(editItem.booking_reference ?? '');
      setNotes(editItem.notes ?? '');
      setPriceAmount(editItem.price != null ? String(editItem.price) : '');
      setPriceCurrency(editItem.price_currency ?? '');
      setAddToBudget(false);
    } else {
      setType(initialType);
      resetForm();
    }
  }, [visible, editItem, initialType]);

  function resetForm() {
    setFromText(''); setToText(''); setDepartureDate(null); setArrivalDate(null);
    setProvider(''); setBookingRef(''); setNotes(''); setPriceAmount(''); setPriceCurrency('');
    setAddToBudget(false);
  }

  function swapRoute() {
    setFromText(toText);
    setToText(fromText);
  }

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    await onSave({
      type,
      airline: provider.trim() || null,
      flight_number: null,
      departure_location: fromText.trim(),
      arrival_location: toText.trim(),
      departure_time: departureDate ? toLocalIsoString(departureDate) : null,
      arrival_time: arrivalDate ? toLocalIsoString(arrivalDate) : null,
      terminal: null, gate: null, seat: null,
      booking_reference: bookingRef.trim() || null,
      notes: notes.trim() || null,
      price: priceAmount ? parseFloat(priceAmount) : null,
      price_currency: priceAmount ? (priceCurrency.trim() || tripCurrency || null) : null,
      status: 'UPCOMING',
      _addToBudget: addToBudget,
      _costAmount: priceAmount,
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
    if (!selected || !target) { setActivePicker(null); return; }

    const setter = target.field === 'departure' ? setDepartureDate : setArrivalDate;

    if (target.step === 'date') {
      setter((prev) => withDatePart(prev, selected));
      // Chain straight into the time step so the whole thing feels like one field.
      setActivePicker({ field: target.field, step: 'time' });
    } else {
      setter((prev) => withTimePart(prev, selected));
      setActivePicker(null);
    }
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
              <Text style={styles.headerTitle}>{title}</Text>
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
                  </View>
                </View>
              )}

              {/* Type */}
              <Text style={styles.sectionLabel}>Type</Text>
              <TouchableOpacity style={styles.typeCard} onPress={() => setShowTypePicker(true)} activeOpacity={0.8}>
                <View style={[styles.typeIconWrap, { backgroundColor: meta.bg }]}>
                  <Text style={{ fontSize: 18 }}>{meta.icon}</Text>
                </View>
                <Text style={styles.typeText}>{type}</Text>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>

              {/* Route */}
              <View style={styles.routeSectionHeader}>
                <Text style={styles.sectionLabel}>Route</Text>
                <TouchableOpacity style={styles.swapBtn} onPress={swapRoute}>
                  <Text style={{ fontSize: 15 }}>⇅</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.selectorCard}>
                <Text style={styles.selectorLabel}>FROM</Text>
                <TextInput
                  style={styles.selectorInput}
                  placeholder="e.g. Suvarnabhumi Airport (BKK)"
                  placeholderTextColor="#C0C0C0"
                  value={fromText}
                  onChangeText={setFromText}
                />
              </View>
              <View style={styles.selectorCard}>
                <Text style={styles.selectorLabel}>TO</Text>
                <TextInput
                  style={styles.selectorInput}
                  placeholder="e.g. Hotel in Bangkok"
                  placeholderTextColor="#C0C0C0"
                  value={toText}
                  onChangeText={setToText}
                />
              </View>

              {/* Schedule */}
              <Text style={styles.sectionLabel}>Schedule <Text style={styles.optional}>(optional)</Text></Text>
              <TouchableOpacity style={styles.selectorCard} onPress={() => setActivePicker({ field: 'departure', step: 'date' })} activeOpacity={0.8}>
                <View style={styles.scheduleRow}>
                  <Text style={styles.selectorLabel}>DEPARTURE</Text>
                  <Text>📅</Text>
                </View>
                <Text style={styles.selectorValue}>{formatDateTimeDisplay(departureDate)}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.selectorCard} onPress={() => setActivePicker({ field: 'arrival', step: 'date' })} activeOpacity={0.8}>
                <View style={styles.scheduleRow}>
                  <Text style={styles.selectorLabel}>ARRIVAL</Text>
                  <Text>📅</Text>
                </View>
                <Text style={styles.selectorValue}>{formatDateTimeDisplay(arrivalDate)}</Text>
              </TouchableOpacity>
              {activePicker && (
                <DateTimePicker
                  value={pickerValue}
                  mode={activePicker.step}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  is24Hour
                  onChange={onPickerChange}
                />
              )}

              {/* Provider */}
              <Text style={styles.sectionLabel}>Provider <Text style={styles.optional}>(optional)</Text></Text>
              <View style={styles.selectorCard}>
                <TextInput
                  style={styles.plainInput}
                  placeholder="e.g. Grab"
                  placeholderTextColor="#C0C0C0"
                  value={provider}
                  onChangeText={setProvider}
                />
              </View>

              {/* Price */}
              <Text style={styles.sectionLabel}>Price <Text style={styles.optional}>(optional)</Text></Text>
              <View style={styles.priceRow}>
                <View style={[styles.selectorCard, { flex: 2 }]}>
                  <TextInput
                    style={styles.plainInput}
                    placeholder="0.00"
                    placeholderTextColor="#C0C0C0"
                    value={priceAmount}
                    onChangeText={setPriceAmount}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={[styles.selectorCard, { flex: 1 }]}>
                  <TextInput
                    style={styles.plainInput}
                    placeholder={tripCurrency ?? 'THB'}
                    placeholderTextColor="#C0C0C0"
                    value={priceCurrency}
                    onChangeText={setPriceCurrency}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              {/* Booking ref */}
              <Text style={styles.sectionLabel}>Booking ref <Text style={styles.optional}>(optional)</Text></Text>
              <View style={styles.selectorCard}>
                <TextInput
                  style={styles.plainInput}
                  placeholder="e.g. A1B2C3"
                  placeholderTextColor="#C0C0C0"
                  value={bookingRef}
                  onChangeText={setBookingRef}
                  autoCapitalize="characters"
                />
              </View>

              {/* Notes */}
              <Text style={styles.sectionLabel}>Notes <Text style={styles.optional}>(optional)</Text></Text>
              <View style={styles.notesCard}>
                <TextInput
                  style={styles.notesInput}
                  placeholder="e.g. Driver will wait at Gate 4."
                  placeholderTextColor="#C0C0C0"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                />
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

              {/* Import (coming soon) */}
              <View style={styles.importRow}>
                <Text style={{ fontSize: 16 }}>🪄</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.importTitle}>Import</Text>
                  <Text style={styles.importSubtitle}>Fill details automatically</Text>
                </View>
                <View style={styles.soonBadge}><Text style={styles.soonBadgeText}>Soon</Text></View>
              </View>

              <View style={{ height: 24 }} />
            </ScrollView>

            <View style={styles.stickyBottom}>
              <TouchableOpacity
                style={[styles.addBtn, (!canSave || saving) && styles.addBtnDisabled]}
                onPress={handleSave}
                disabled={!canSave || saving}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.addBtnText}>{editItem ? 'Save Changes' : `Save ${title.replace('Add ', '')}`}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>

      <TransportTypePicker
        visible={showTypePicker}
        selected={type}
        onSelect={setType}
        onClose={() => setShowTypePicker(false)}
      />
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
    height: 80, borderRadius: 24, borderWidth: 1, overflow: 'hidden',
    position: 'relative', marginTop: 8, marginBottom: 16, justifyContent: 'flex-end',
  },
  heroBlobOne: { position: 'absolute', width: 110, height: 110, borderRadius: 999, top: -40, left: -28, opacity: 0.78 },
  heroBlobTwo: { position: 'absolute', width: 120, height: 120, borderRadius: 999, right: -40, bottom: -50, opacity: 0.72 },
  heroTextBlock: { padding: 14 },
  heroName: { fontSize: 15, fontWeight: '900', color: '#1A1A1A' },

  sectionLabel: { fontSize: 12, fontWeight: '800', color: '#8A817A', letterSpacing: 0.4, marginBottom: 8, marginTop: 4, textTransform: 'uppercase' },
  optional: { fontWeight: '400', color: '#B0A89E', textTransform: 'none' },

  typeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  typeIconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  typeText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  chevron: { fontSize: 20, color: '#C8BFB5', fontWeight: '300' },

  routeSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  swapBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },

  selectorCard: {
    backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  selectorLabel: { fontSize: 10, fontWeight: '800', color: '#B0A89E', letterSpacing: 0.4 },
  selectorInput: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', padding: 0, marginTop: 4 },
  selectorValue: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginTop: 4 },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  plainInput: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', padding: 0 },
  priceRow: { flexDirection: 'row', gap: 10 },

  notesCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  notesInput: { fontSize: 13, color: '#1A1A1A', padding: 0, minHeight: 50, textAlignVertical: 'top' },

  budgetCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 16,
    padding: 14, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  budgetTitle: { fontSize: 13, fontWeight: '800', color: '#1A1A1A' },
  budgetSubtitle: { fontSize: 11, color: '#8A817A', marginTop: 2, fontWeight: '600' },

  importRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F3F0FF', borderRadius: 14, padding: 12, marginBottom: 16, opacity: 0.75 },
  importTitle: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
  importSubtitle: { fontSize: 11, color: '#8A817A', marginTop: 1, fontWeight: '600' },
  soonBadge: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  soonBadgeText: { fontSize: 10, fontWeight: '800', color: '#7E57C2' },

  stickyBottom: { padding: 16, backgroundColor: '#FFF8F0' },
  addBtn: { backgroundColor: '#4CAF50', borderRadius: 18, paddingVertical: 17, alignItems: 'center', shadowColor: '#4CAF50', shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 },
  addBtnDisabled: { backgroundColor: '#C8E6C9', shadowOpacity: 0 },
  addBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
