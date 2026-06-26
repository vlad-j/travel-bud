import React, { useState, useEffect, useRef } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import CartoonIcon from '../components/CartoonIcon';
import StatusBadge from '../components/StatusBadge';
import { Sparkle, Cloud, Dot, DottedLine } from '../components/TravelDecorations';
import { STATUS_BG } from '../data/colors';
import { supabase } from '../lib/supabase';
import { useCurrentTrip, currentTripIdRef } from '../context/TripContext';
import { searchLocations } from '../lib/locationService';

const CATEGORY_OPTIONS = [
  { label: 'activity', emoji: '🎯' },
  { label: 'food', emoji: '🍜' },
  { label: 'transport', emoji: '🚗' },
  { label: 'flight', emoji: '✈️' },
  { label: 'accommodation', emoji: '🏨' },
];

const CATEGORY_ICONS: Record<string, { icon: string; bg: string }> = {
  food: { icon: '🍜', bg: '#FFF3E0' },
  transport: { icon: '🚗', bg: '#E3F2FD' },
  accommodation: { icon: '🏡', bg: '#FCE4EC' },
  activity: { icon: '🎯', bg: '#E8F5E9' },
  flight: { icon: '✈️', bg: '#EDE7F6' },
  default: { icon: '📍', bg: '#F5F5F5' },
};

function getActivityStatus(time: string, status: string): 'DONE' | 'NOW' | 'UPCOMING' {
  if (status === 'completed') return 'DONE';
  if (status === 'in_progress') return 'NOW';
  const now = new Date();
  const [h, m] = time.split(':').map(Number);
  const activityMinutes = h * 60 + m;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  if (activityMinutes < nowMinutes - 30) return 'DONE';
  if (Math.abs(activityMinutes - nowMinutes) <= 30) return 'NOW';
  return 'UPCOMING';
}

function AddActivityModal({
  visible,
  onClose,
  tripId,
  selectedDate,
  onAdded,
}: {
  visible: boolean;
  onClose: () => void;
  tripId: string;
  selectedDate: string;
  onAdded: () => void;
}) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('activity');
  const [time, setTime] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [location, setLocation] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const locationTimeout = useRef<any>(null);

async function handleLocationChange(text: string) {
  setLocation(text);
  if (locationTimeout.current) clearTimeout(locationTimeout.current);
  if (text.length >= 3) {
locationTimeout.current = setTimeout(async () => {
  const results = await searchLocations(text);
  setLocationSuggestions(results);
}, 1000);
  } else {
    setLocationSuggestions([]);
  }
}

  async function handleAdd() {
    if (!title.trim()) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('activities').insert({
      trip_id: tripId,
      title: title.trim(),
      category,
      date: selectedDate,
      time: time || null,
      location: location || null,
      notes: notes || null,
      status: 'upcoming',
      created_by: user.id,
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setTitle('');
      setCategory('activity');
      setTime('');
      setLocation('');
      setLocationSuggestions([]);
      setNotes('');
      onAdded();
      onClose();
    }
    setSaving(false);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kvWrapper}
        >
          <Pressable style={styles.bottomSheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Add Activity</Text>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Sunrise at Mount Batur"
                placeholderTextColor="#C0C0C0"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.fieldLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
                {CATEGORY_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.label}
                    style={[styles.catChip, category === opt.label && styles.catChipActive]}
                    onPress={() => setCategory(opt.label)}
                  >
                    <Text style={{ fontSize: 16 }}>{opt.emoji}</Text>
                    <Text style={[styles.catChipText, category === opt.label && styles.catChipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.fieldLabel}>Time</Text>
              <TouchableOpacity
                style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={{ fontSize: 15, color: time ? '#1A1A1A' : '#C0C0C0' }}>
                  {time || 'Pick time'}
                </Text>
                <Text style={{ fontSize: 18 }}>🕐</Text>
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={(() => {
                    const d = new Date();
                    if (time) { const [h, m] = time.split(':'); d.setHours(+h, +m); }
                    return d;
                  })()}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  is24Hour={true}
                  onChange={(_, date) => {
                    setShowTimePicker(Platform.OS === 'ios');
                    if (date) {
                      const h = date.getHours().toString().padStart(2, '0');
                      const m = date.getMinutes().toString().padStart(2, '0');
                      setTime(`${h}:${m}`);
                    }
                  }}
                />
              )}

              <Text style={styles.fieldLabel}>Location</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Ubud, Bali"
                placeholderTextColor="#C0C0C0"
                value={location}
                onChangeText={handleLocationChange}
              />
              {locationSuggestions.length > 0 && (
                <View style={styles.suggestions}>
                  {locationSuggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionRow}
                      onPress={() => {
                        setLocation(suggestion);
                        setLocationSuggestions([]);
                      }}
                    >
                      <Text style={{ fontSize: 14 }}>📍</Text>
                      <Text style={styles.suggestionText} numberOfLines={2}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={styles.fieldLabel}>
                Notes <Text style={styles.optional}>(optional)</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add any extra details..."
                placeholderTextColor="#C0C0C0"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity
                style={[styles.addActivityBtn, (!title.trim() || saving) && styles.addActivityBtnDisabled]}
                onPress={handleAdd}
                disabled={!title.trim() || saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.addActivityBtnText}>Add Activity</Text>
                )}
              </TouchableOpacity>
              <View style={{ height: 16 }} />
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

export default function ItineraryScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { currentTripId } = useCurrentTrip();
  const [trip, setTrip] = useState<any>(null);
  const [days, setDays] = useState<number[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

useFocusEffect(
    React.useCallback(() => {
      loadData(currentTripIdRef.current ?? route.params?.tripId);
    }, [])
  );

  useEffect(() => {
    if (selectedDate) loadActivities();
  }, [selectedDate]);

  async function loadData(tripId?: string) { loadTrip(tripId); }

async function loadTrip(tripId?: string) {

  
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: memberships } = await supabase
      .from('trip_members')
      .select('trip_id')
      .eq('user_id', user.id);

    if (!memberships || memberships.length === 0) { setLoading(false); return; }

    const tripIds = memberships.map((m: any) => m.trip_id);

    let tripData: any = null;

    if (tripId) {
      const { data } = await supabase.from('trips').select('*').eq('id', tripId).single();
      tripData = data;
    } else {
      const { data: tripsData } = await supabase.from('trips').select('*').in('id', tripIds).eq('status', 'active').order('created_at', { ascending: false });
      tripData = tripsData?.[0] ?? null;
    }
    if (!tripData) { setLoading(false); return; }

    setTrip(tripData);

    const start = new Date(tripData.start_date);
    const end = new Date(tripData.end_date);
    const totalDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const daysArr = Array.from({ length: totalDays }, (_, i) => i + 1);
    setDays(daysArr);

    const today = new Date();
    const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const currentDay = Math.max(1, Math.min(diff + 1, totalDays));
    setSelectedDay(currentDay);

    const date = new Date(start);
    date.setDate(date.getDate() + currentDay - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
    setLoading(false);
  }

  async function loadActivities() {
    if (!trip || !selectedDate) return;
    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('trip_id', trip.id)
      .eq('date', selectedDate)
      .order('time', { ascending: true });
    setActivities(data ?? []);
  }

  function selectDay(day: number) {
    setSelectedDay(day);
    if (!trip) return;
    const start = new Date(trip.start_date);
    const date = new Date(start);
    date.setDate(date.getDate() + day - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  }

  async function toggleActivityStatus(activity: any) {
    const newStatus = activity.status === 'completed' ? 'upcoming' : 'completed';
    await supabase.from('activities').update({ status: newStatus }).eq('id', activity.id);
    loadActivities();
  }

  const currentLocation = trip?.destinations?.[0]?.name ?? '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Itinerary</Text>
        <TouchableOpacity style={styles.calIcon}>
          <Text style={{ fontSize: 22 }}>📅</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : !trip ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>✈️</Text>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#1A1A1A' }}>No active trip</Text>
          <Text style={{ color: '#888', marginTop: 4 }}>Create a trip to start planning</Text>
        </View>
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.dayScroll}
            contentContainerStyle={styles.dayScrollContent}
          >
            {days.map((day) => (
              <TouchableOpacity
                key={day}
                style={[styles.dayChip, selectedDay === day && styles.dayChipActive]}
                onPress={() => selectDay(day)}
              >
                <Text style={[styles.dayChipText, selectedDay === day && styles.dayChipTextActive]}>
                  Day {day}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.locationRow}>
            <Text style={styles.locationText}>{currentLocation || 'No destination'}</Text>
            <Text style={{ fontSize: 18, marginLeft: 4 }}>▾</Text>
          </TouchableOpacity>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleWrap}>
                  <Cloud size={16} color="#0D47A1" style={{ position: 'relative', marginRight: 6 }} />
                  <Text style={[styles.sectionTitle, { color: '#0D47A1' }]}>
                    DAY {selectedDay} · {selectedDate}
                  </Text>
                </View>
                <Sparkle color="#0D47A1" size={12} style={{ position: 'relative' }} />
              </View>
              <View style={styles.sectionCard}>
                {activities.length === 0 ? (
                  <Text style={{ padding: 20, color: '#888', textAlign: 'center' }}>
                    No activities for this day
                  </Text>
                ) : (
                  activities.map((activity, index) => {
                    const iconData = CATEGORY_ICONS[activity.category] ?? CATEGORY_ICONS.default;
                    const displayStatus = getActivityStatus(activity.time?.slice(0, 5) ?? '00:00', activity.status);
                    const statusBg = STATUS_BG[displayStatus] ?? '#fff';

                    return (
                      <View key={activity.id}>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => toggleActivityStatus(activity)}
                        >
                          <View style={[styles.activityRow, { backgroundColor: statusBg }]}>
                            <View style={styles.timeCol}>
                              <Text style={styles.time}>{activity.time?.slice(0, 5) ?? '--:--'}</Text>
                              {index < activities.length - 1 && (
                                <View style={styles.connector} />
                              )}
                            </View>
                            <CartoonIcon emoji={iconData.icon} bg={iconData.bg} size={48} />
                            <View style={styles.content}>
                              <Text style={styles.activityTitle}>{activity.title}</Text>
                              {activity.location ? (
                                <Text style={styles.subtitle}>{activity.location}</Text>
                              ) : null}
                              <View style={styles.categoryTag}>
                                <Dot color="#999" size={4} style={{ position: 'relative' }} />
                                <Text style={styles.categoryText}>{activity.category}</Text>
                              </View>
                            </View>
                            {displayStatus === 'DONE' ? (
                              <View style={styles.checkCircle}>
                                <Text style={styles.checkMark}>✓</Text>
                              </View>
                            ) : (
                              <StatusBadge status={displayStatus} small />
                            )}
                          </View>
                        </TouchableOpacity>
                        {index < activities.length - 1 && (
                          <View style={styles.divider}>
                            <DottedLine color="#E0E0E0" style={{ marginLeft: 24 }} />
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </View>
            </View>

            <View style={styles.decorRow}>
              <Cloud size={18} style={{ position: 'relative' }} />
              <Sparkle color="#FF9800" size={10} style={{ position: 'relative', marginLeft: 8 }} />
              <Dot color="#DDD" size={5} style={{ position: 'relative', marginLeft: 6 }} />
            </View>

            <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
              <Text style={styles.addIcon}>＋</Text>
              <Text style={styles.addText}>Add activity</Text>
            </TouchableOpacity>

            <View style={{ height: 24 }} />
          </ScrollView>

          <AddActivityModal
            visible={showAddModal}
            onClose={() => setShowAddModal(false)}
            tripId={trip?.id}
            selectedDate={selectedDate}
            onAdded={loadActivities}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#E8E8E8' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  title: { fontSize: 24, fontWeight: '800', color: '#1A1A1A' },
  calIcon: { padding: 4 },
  dayScroll: { backgroundColor: '#fff', maxHeight: 56 },
  dayScrollContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  dayChip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F5F5F5' },
  dayChipActive: { backgroundColor: '#4CAF50' },
  dayChipText: { fontSize: 14, fontWeight: '600', color: '#666' },
  dayChipTextActive: { color: '#fff' },
  locationRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  locationText: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  scroll: { flex: 1, padding: 16 },
  sectionBlock: { marginBottom: 16, borderRadius: 20, overflow: 'hidden', borderWidth: 3, borderColor: '#90CAF9' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 24, backgroundColor: '#90CAF9' },
  sectionTitleWrap: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  sectionCard: { backgroundColor: '#fff', borderRadius: 16, margin: 4, marginTop: -16, paddingHorizontal: 10, paddingVertical: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: -2 }, elevation: 3 },
  activityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 14, marginVertical: 2 },
  timeCol: { width: 48, alignItems: 'center', paddingTop: 4 },
  time: { fontSize: 13, fontWeight: '700', color: '#444' },
  connector: { width: 2, flex: 1, minHeight: 28, backgroundColor: '#E0E0E0', marginTop: 6 },
  content: { flex: 1, paddingTop: 4 },
  activityTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  subtitle: { fontSize: 12, color: '#888', marginTop: 2 },
  categoryTag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, alignSelf: 'flex-start' },
  categoryText: { fontSize: 10, color: '#999', fontWeight: '600' },
  checkCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#4CAF50', alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  checkMark: { fontSize: 14, color: '#fff', fontWeight: '800' },
  divider: { paddingVertical: 4 },
  decorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, marginTop: 12, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#E0E0E0', borderStyle: 'dashed' },
  addIcon: { fontSize: 20, color: '#4CAF50', fontWeight: '700' },
  addText: { fontSize: 15, fontWeight: '600', color: '#4CAF50' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  kvWrapper: { justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 34 : 20, maxHeight: '90%' },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 18 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#888', letterSpacing: 0.5, marginBottom: 6, marginTop: 12 },
  optional: { fontSize: 11, fontWeight: '400', color: '#BBB' },
  input: { backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1A1A1A', borderWidth: 1, borderColor: '#EBEBEB' },
  textArea: { height: 80, textAlignVertical: 'top' },
  catRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#EBEBEB' },
  catChipActive: { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' },
  catChipText: { fontSize: 13, fontWeight: '600', color: '#666' },
  catChipTextActive: { color: '#4CAF50' },
  addActivityBtn: { marginTop: 20, backgroundColor: '#4CAF50', borderRadius: 14, paddingVertical: 16, alignItems: 'center', shadowColor: '#4CAF50', shadowOpacity: 0.25, shadowRadius: 8, elevation: 3 },
  addActivityBtnDisabled: { backgroundColor: '#C8E6C9', shadowOpacity: 0, elevation: 0 },
  addActivityBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  suggestions: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#F0F0F0', marginTop: 4, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  suggestionText: { fontSize: 13, color: '#1A1A1A', flex: 1 },
});
