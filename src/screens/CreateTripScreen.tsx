import React, { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Sparkle, Dot, Cloud } from '../components/TravelDecorations';
import { supabase } from '../lib/supabase';
import { useStatusBarHeight } from '../../hooks/useStatusBarHeight';



const COVER_ILLUSTRATIONS = [
  { id: '1', emoji: '🛕', label: 'Temple', bg: '#FFF3E0' },
  { id: '2', emoji: '🌴', label: 'Tropical', bg: '#E8F5E9' },
  { id: '3', emoji: '🏖️', label: 'Beach', bg: '#E3F2FD' },
  { id: '4', emoji: '🏔️', label: 'Mountain', bg: '#F3E5F5' },
  { id: '5', emoji: '🏙️', label: 'City', bg: '#EDE7F6' },
  { id: '6', emoji: '🌸', label: 'Garden', bg: '#FCE4EC' },
];

const DESTINATIONS_SUGGESTIONS = [
  { name: 'Bali, Indonesia', emoji: '🌴' },
  { name: 'Barcelona, Spain', emoji: '🏛️' },
  { name: 'Bangkok, Thailand', emoji: '🛕' },
  { name: 'Bora Bora, French Polynesia', emoji: '🏝️' },
];

function formatDate(date: Date | null): string {
  if (!date) return '';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function toISO(date: Date | null): string {
  if (!date) return '';
  return date.toISOString().split('T')[0];
}

export default function CreateTripScreen() {
  const navigation = useNavigation<any>();
  const [tripName, setTripName] = useState('');
  const [destinationInput, setDestinationInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [budget, setBudget] = useState('');
  const [currency, setCurrency] = useState('EUR (€)');
  const [selectedCover, setSelectedCover] = useState('1');
  const [saving, setSaving] = useState(false);
  const statusBarHeight = useStatusBarHeight();

  const selectedCoverItem = COVER_ILLUSTRATIONS.find((c) => c.id === selectedCover);

  const addDestination = (name: string) => {
    if (!selectedDestinations.includes(name)) {
      setSelectedDestinations((prev) => [...prev, name]);
    }
    setDestinationInput('');
    setShowSuggestions(false);
  };

  const removeDestination = (name: string) => {
    setSelectedDestinations((prev) => prev.filter((d) => d !== name));
  };

  async function handleCreateTrip() {
    if (!tripName.trim()) {
      Alert.alert('Error', 'Please enter a trip name');
      return;
    }
    if (!startDate || !endDate) {
      Alert.alert('Error', 'Please select start and end dates');
      return;
    }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: trip, error } = await supabase
      .from('trips')
      .insert({
        name: tripName,
        start_date: toISO(startDate),
        end_date: toISO(endDate),
        budget: parseFloat(budget) || 0,
        currency: currency.split(' ')[0],
        status: 'active',
        cover_destination: selectedCoverItem?.emoji ?? '🌍',
        created_by: user.id,
        invite_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
      })
      .select()
      .single();

    if (error) {
      Alert.alert('Error', error.message);
      setSaving(false);
      return;
    }

    await supabase.from('trip_members').insert({
      trip_id: trip.id,
      user_id: user.id,
      role: 'owner',
    });

for (let i = 0; i < selectedDestinations.length; i++) {
  const { error } = await supabase.from('destinations').insert({
    trip_id: trip.id,
    name: selectedDestinations[i],
    country: selectedDestinations[i],
    order_index: i,
    nights: 1,
  });

  if (error) {
    console.error('Failed to add destination:', error.message);
    Alert.alert("Couldn't add destination", error.message);
  }
}

    setSaving(false);
    Alert.alert('🎉 Trip created!', `${tripName} is ready!`, [
      { text: "Let's go!", onPress: () => navigation.goBack() }
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <View style={[styles.header, { paddingTop: statusBarHeight + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>New Trip</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={[styles.coverPreview, { backgroundColor: selectedCoverItem?.bg ?? '#E8F5E9' }]}>
          <View style={styles.coverScene}>
            <Text style={[styles.coverDecor, { left: 20, top: 16 }]}>☁️</Text>
            <Text style={[styles.coverDecor, { right: 30, top: 22 }]}>☁️</Text>
            <Text style={[styles.coverDecor, { right: 16, top: 12 }]}>☀️</Text>
            <Text style={styles.coverMainEmoji}>{selectedCoverItem?.emoji}</Text>
            <Text style={[styles.coverDecor, { left: 14, bottom: 12 }]}>🌴</Text>
            <Text style={[styles.coverDecor, { right: 14, bottom: 12 }]}>🌴</Text>
            <Sparkle color="#FFD700" size={12} style={{ position: 'absolute', left: 40, top: 36 }} />
          </View>
          {tripName ? (
            <View style={styles.coverTitleBar}>
              <Text style={styles.coverTitle}>{tripName}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionLabel}>
            <Sparkle color="#FF9800" size={12} style={{ position: 'relative', marginRight: 4 }} />
            <Text style={styles.sectionLabelText}>TRIP DETAILS</Text>
          </View>
          <View style={styles.fieldCard}>
            <Text style={styles.fieldLabel}>Trip name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Java → Bali → Lombok"
              placeholderTextColor="#BBB"
              value={tripName}
              onChangeText={setTripName}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionLabel}>
            <Text style={{ fontSize: 14, marginRight: 4 }}>📍</Text>
            <Text style={styles.sectionLabelText}>DESTINATIONS</Text>
          </View>
          <View style={styles.fieldCard}>
            <Text style={styles.fieldLabel}>Add destinations</Text>
            <View style={styles.destInputRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Search city or country..."
                placeholderTextColor="#BBB"
                value={destinationInput}
                onChangeText={(t) => {
                  setDestinationInput(t);
                  setShowSuggestions(t.length > 0);
                }}
              />
              <TouchableOpacity
                style={styles.addDestBtn}
                onPress={() => destinationInput && addDestination(destinationInput)}
              >
                <Text style={styles.addDestBtnText}>＋</Text>
              </TouchableOpacity>
            </View>
            {showSuggestions && (
              <View style={styles.suggestions}>
                {DESTINATIONS_SUGGESTIONS.filter((d) =>
                  d.name.toLowerCase().includes(destinationInput.toLowerCase())
                ).map((dest) => (
                  <TouchableOpacity
                    key={dest.name}
                    style={styles.suggestionRow}
                    onPress={() => addDestination(dest.name)}
                  >
                    <Text style={{ fontSize: 18, marginRight: 8 }}>{dest.emoji}</Text>
                    <Text style={styles.suggestionText}>{dest.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {selectedDestinations.length > 0 && (
              <View style={styles.selectedDests}>
                {selectedDestinations.map((dest, index) => (
                  <View key={dest} style={styles.destChip}>
                    <Text style={styles.destChipNum}>{index + 1}</Text>
                    <Text style={styles.destChipText}>{dest}</Text>
                    <TouchableOpacity onPress={() => removeDestination(dest)}>
                      <Text style={styles.destChipRemove}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionLabel}>
            <Text style={{ fontSize: 14, marginRight: 4 }}>📅</Text>
            <Text style={styles.sectionLabelText}>DATES</Text>
          </View>
          <View style={styles.fieldCard}>
            <View style={styles.dateRow}>
              <View style={styles.dateHalf}>
                <Text style={styles.fieldLabel}>Start date</Text>
                <TouchableOpacity
                  style={[styles.dateInput, startDate ? styles.dateInputActive : null]}
                  onPress={() => setShowStartPicker(true)}
                >
                  <Text style={styles.dateInputIcon}>📅</Text>
                  <Text style={[styles.dateInputText, !startDate && { color: '#BBB' }]}>
                    {startDate ? formatDate(startDate) : 'Pick date'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.dateSeparator}>
                <Text style={styles.dateSeparatorText}>→</Text>
              </View>
              <View style={styles.dateHalf}>
                <Text style={styles.fieldLabel}>End date</Text>
                <TouchableOpacity
                  style={[styles.dateInput, endDate ? styles.dateInputActive : null]}
                  onPress={() => setShowEndPicker(true)}
                >
                  <Text style={styles.dateInputIcon}>🏁</Text>
                  <Text style={[styles.dateInputText, !endDate && { color: '#BBB' }]}>
                    {endDate ? formatDate(endDate) : 'Pick date'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionLabel}>
            <Text style={{ fontSize: 14, marginRight: 4 }}>💰</Text>
            <Text style={styles.sectionLabelText}>BUDGET</Text>
          </View>
          <View style={styles.fieldCard}>
            <View style={styles.budgetRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Total budget</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 2000"
                  placeholderTextColor="#BBB"
                  value={budget}
                  onChangeText={setBudget}
                  keyboardType="numeric"
                />
              </View>
              <TouchableOpacity style={styles.currencyBtn}>
                <Text style={styles.currencyBtnText}>{currency.split(' ')[1] ?? '€'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionLabel}>
            <Cloud size={14} style={{ position: 'relative', marginRight: 4 }} />
            <Text style={styles.sectionLabelText}>COVER ILLUSTRATION</Text>
          </View>
          <View style={styles.coverGrid}>
            {COVER_ILLUSTRATIONS.map((cover) => (
              <TouchableOpacity
                key={cover.id}
                style={[
                  styles.coverOption,
                  { backgroundColor: cover.bg },
                  selectedCover === cover.id && styles.coverOptionSelected,
                ]}
                onPress={() => setSelectedCover(cover.id)}
              >
                <Text style={{ fontSize: 32 }}>{cover.emoji}</Text>
                <Text style={styles.coverOptionLabel}>{cover.label}</Text>
                {selectedCover === cover.id && (
                  <View style={styles.coverCheckmark}>
                    <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.createBtn} onPress={handleCreateTrip} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={{ fontSize: 20 }}>🌍</Text>
              <Text style={styles.createBtnText}>Create Trip</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.footerDecor}>
          <Dot color="#DDD" size={5} style={{ position: 'relative' }} />
          <Dot color="#DDD" size={4} style={{ position: 'relative', marginLeft: 8 }} />
          <Sparkle color="#FF9800" size={10} style={{ position: 'relative', marginLeft: 6 }} />
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Android: picker apare nativ, fara Modal */}
      {showStartPicker && (
        <DateTimePicker
          value={startDate ?? new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date()}
          onChange={(_, date) => {
            setShowStartPicker(Platform.OS === 'ios');
            if (date) setStartDate(date);
          }}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endDate ?? (startDate ?? new Date())}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={startDate ?? new Date()}
          onChange={(_, date) => {
            setShowEndPicker(Platform.OS === 'ios');
            if (date) setEndDate(date);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  backBtn: { padding: 4 },
  backIcon: { fontSize: 28, color: '#1A1A1A', fontWeight: '300' },
  title: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  scroll: { flex: 1 },
  coverPreview: { height: 180, overflow: 'hidden', position: 'relative' },
  coverScene: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 20 },
  coverDecor: { position: 'absolute', fontSize: 24 },
  coverMainEmoji: { fontSize: 80 },
  coverTitleBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.85)', paddingHorizontal: 16, paddingVertical: 10 },
  coverTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  section: { paddingHorizontal: 16, marginBottom: 14, marginTop: 4 },
  sectionLabel: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 10 },
  sectionLabelText: { fontSize: 12, fontWeight: '700', color: '#888', letterSpacing: 0.8 },
  fieldCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F0F0F0', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 8 },
  input: { backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1A1A1A', marginBottom: 0, borderWidth: 1, borderColor: '#EBEBEB' },
  destInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
  addDestBtn: { width: 46, height: 46, borderRadius: 12, backgroundColor: '#4CAF50', alignItems: 'center', justifyContent: 'center' },
  addDestBtnText: { fontSize: 22, color: '#fff', lineHeight: 26 },
  suggestions: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#F0F0F0', marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  suggestionText: { fontSize: 14, color: '#1A1A1A' },
  selectedDests: { marginTop: 8, gap: 6 },
  destChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, gap: 8, borderWidth: 1, borderColor: '#A5D6A7' },
  destChipNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#4CAF50', color: '#fff', fontSize: 12, fontWeight: '800', textAlign: 'center', lineHeight: 22 },
  destChipText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  destChipRemove: { fontSize: 18, color: '#888', fontWeight: '300' },
  dateRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  dateHalf: { flex: 1 },
  dateSeparator: { paddingTop: 28, paddingHorizontal: 4 },
  dateSeparatorText: { fontSize: 16, color: '#888' },
  dateInput: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1, borderColor: '#EBEBEB' },
  dateInputActive: { borderColor: '#4CAF50', backgroundColor: '#F1F8E9' },
  dateInputIcon: { fontSize: 16 },
  dateInputText: { fontSize: 14, color: '#1A1A1A', fontWeight: '500' },
  budgetRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  currencyBtn: { width: 54, height: 46, borderRadius: 12, backgroundColor: '#4CAF50', alignItems: 'center', justifyContent: 'center' },
  currencyBtnText: { fontSize: 18, color: '#fff', fontWeight: '700' },
  coverGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  coverOption: { width: '30%', aspectRatio: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent', position: 'relative', paddingBottom: 4 },
  coverOptionSelected: { borderColor: '#4CAF50' },
  coverOptionLabel: { fontSize: 11, fontWeight: '600', color: '#555', marginTop: 4 },
  coverCheckmark: { position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: 10, backgroundColor: '#4CAF50', alignItems: 'center', justifyContent: 'center' },
  inviteCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F0F0F0' },
  inviteTop: { marginBottom: 12 },
  inviteLabel: { fontSize: 13, color: '#666' },
  inviteCodeBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12, borderWidth: 1.5, borderColor: '#E0E0E0', borderStyle: 'dashed' },
  inviteCode: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', letterSpacing: 1 },
  copyBtn: { backgroundColor: '#E8F5E9', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  copyBtnText: { fontSize: 13, fontWeight: '700', color: '#4CAF50' },
  inviteOr: { textAlign: 'center', fontSize: 12, color: '#BBB', marginBottom: 12 },
  shareLinkBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#4CAF50' },
  shareLinkText: { fontSize: 14, fontWeight: '700', color: '#4CAF50' },
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#4CAF50', borderRadius: 18, paddingVertical: 18, marginHorizontal: 16, marginBottom: 10, shadowColor: '#4CAF50', shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  createBtnText: { fontSize: 18, fontWeight: '800', color: '#fff' },
  footerDecor: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
});
