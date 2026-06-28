import React, { useState, useEffect, useRef, useCallback } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal,
  TextInput, KeyboardAvoidingView, Platform, Pressable, ActivityIndicator,
  Alert, FlatList,
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
import { useStatusBarHeight } from '../../hooks/useStatusBarHeight';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function localDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = parseLocalDate(dateStr);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function getTodayStr(): string {
  const now = new Date();
  return localDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORY_OPTIONS = [
  { label: 'activity', emoji: '🎯' },
  { label: 'food', emoji: '🍜' },
  { label: 'transport', emoji: '🚗' },
  { label: 'flight', emoji: '✈️' },
  { label: 'accommodation', emoji: '🏨' },
  { label: 'note', emoji: '📝' },
];

const CATEGORY_ICONS: Record<string, { icon: string; bg: string }> = {
  food: { icon: '🍜', bg: '#FFF3E0' },
  transport: { icon: '🚗', bg: '#E3F2FD' },
  accommodation: { icon: '🏡', bg: '#FCE4EC' },
  activity: { icon: '🎯', bg: '#E8F5E9' },
  flight: { icon: '✈️', bg: '#EDE7F6' },
  note: { icon: '📝', bg: '#FFF8E1' },
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

// ─── Trip Selector Modal ──────────────────────────────────────────────────────
function TripSelectorModal({ visible, trips, currentTripId, onSelect, onClose, onCreateNew }: {
  visible: boolean; trips: any[]; currentTripId: string | null;
  onSelect: (trip: any) => void; onClose: () => void; onCreateNew: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={ts.overlay} onPress={onClose}>
        <View style={ts.sheet}>
          <View style={ts.handle} />
          <Text style={ts.title}>Switch Trip</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {trips.map(trip => (
              <TouchableOpacity
                key={trip.id}
                style={[ts.tripRow, trip.id === currentTripId && ts.tripRowActive]}
                onPress={() => { onSelect(trip); onClose(); }}
              >
                <View style={ts.tripIcon}>
                  <Text style={{ fontSize: 24 }}>{trip.cover_destination ?? '✈️'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={ts.tripName}>{trip.name}</Text>
                  <Text style={ts.tripDates}>
                    {formatDisplayDate(trip.start_date).split(',')[0]} – {formatDisplayDate(trip.end_date)}
                  </Text>
                </View>
                {trip.id === currentTripId && (
                  <View style={ts.check}><Text style={{ color: '#fff', fontSize: 12 }}>✓</Text></View>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={ts.createRow} onPress={() => { onClose(); onCreateNew(); }}>
              <View style={ts.createIcon}><Text style={{ fontSize: 20, color: '#4CAF50' }}>＋</Text></View>
              <Text style={ts.createText}>Create new trip</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}

const ts = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, maxHeight: '80%' },
  handle: { width: 36, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 16 },
  tripRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, marginBottom: 8, backgroundColor: '#F5F5F5' },
  tripRowActive: { backgroundColor: '#E8F5E9', borderWidth: 1.5, borderColor: '#4CAF50' },
  tripIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  tripName: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  tripDates: { fontSize: 12, color: '#888', marginTop: 2 },
  check: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#4CAF50', alignItems: 'center', justifyContent: 'center' },
  createRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#E0E0E0', borderStyle: 'dashed', marginTop: 4 },
  createIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' },
  createText: { fontSize: 15, fontWeight: '600', color: '#4CAF50' },
});

// ─── Calendar Jump Modal ──────────────────────────────────────────────────────
function CalendarJumpModal({ visible, trip, selectedDate, totalDays, onSelect, onClose }: {
  visible: boolean; trip: any; selectedDate: string; totalDays: number;
  onSelect: (day: number, dateStr: string) => void; onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [calMonth, setCalMonth] = useState(() => {
    const d = parseLocalDate(selectedDate || getTodayStr());
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  if (!trip) return null;

  const [syear, smonth, sday] = trip.start_date.split('-').map(Number);
  const startLocal = new Date(syear, smonth - 1, sday);
  const [eyear, emonth, eday] = trip.end_date.split('-').map(Number);
  const endLocal = new Date(eyear, emonth - 1, eday);

  function getDayForDate(dateStr: string): number {
    const d = parseLocalDate(dateStr);
    return Math.round((d.getTime() - startLocal.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  function isInTrip(date: Date): boolean {
    return date >= startLocal && date <= endLocal;
  }

  // Build calendar grid
  const firstDay = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1);
  const lastDay = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7; // Monday first
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push(new Date(calMonth.getFullYear(), calMonth.getMonth(), d));
  }

  // Day list filtered by search
  const allDays = Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(syear, smonth - 1, sday + i);
    return { day: i + 1, dateStr: localDateStr(d), label: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) };
  });

  const filtered = search
    ? allDays.filter(d => d.label.toLowerCase().includes(search.toLowerCase()) || String(d.day).includes(search))
    : [];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={cj.overlay} onPress={onClose}>
        <View style={cj.sheet}>
          <View style={cj.handle} />
          <Text style={cj.title}>Jump to Day</Text>

          {/* Search */}
          <View style={cj.searchBar}>
            <Text style={{ fontSize: 16 }}>🔍</Text>
            <TextInput
              style={cj.searchInput}
              placeholder="Search day or date..."
              placeholderTextColor="#C0C0C0"
              value={search}
              onChangeText={setSearch}
            />
            {search ? <TouchableOpacity onPress={() => setSearch('')}><Text style={{ color: '#999' }}>✕</Text></TouchableOpacity> : null}
          </View>

          {search ? (
            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              {filtered.map(item => (
                <TouchableOpacity
                  key={item.day}
                  style={[cj.dayRow, item.dateStr === selectedDate && cj.dayRowActive]}
                  onPress={() => { onSelect(item.day, item.dateStr); onClose(); setSearch(''); }}
                >
                  <View style={cj.dayNum}>
                    <Text style={cj.dayNumText}>Day {item.day}</Text>
                  </View>
                  <Text style={cj.dayLabel}>{item.label}</Text>
                  {item.dateStr === selectedDate && <View style={cj.check}><Text style={{ color: '#fff', fontSize: 12 }}>✓</Text></View>}
                </TouchableOpacity>
              ))}
              {filtered.length === 0 && <Text style={{ textAlign: 'center', color: '#888', padding: 20 }}>No results</Text>}
            </ScrollView>
          ) : (
            <>
              {/* Calendar */}
              <View style={cj.calHeader}>
                <TouchableOpacity style={cj.navBtn} onPress={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))}>
                  <Text style={cj.navText}>‹</Text>
                </TouchableOpacity>
                <Text style={cj.calMonth}>{MONTHS[calMonth.getMonth()]} {calMonth.getFullYear()}</Text>
                <TouchableOpacity style={cj.navBtn} onPress={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))}>
                  <Text style={cj.navText}>›</Text>
                </TouchableOpacity>
              </View>

              <View style={cj.calGrid}>
                {WEEKDAYS.map(wd => <Text key={wd} style={cj.weekday}>{wd}</Text>)}
                {cells.map((cell, i) => {
                  if (!cell) return <View key={`empty-${i}`} style={cj.calCell} />;
                  const dateStr = localDateStr(cell);
                  const inTrip = isInTrip(cell);
                  const isSelected = dateStr === selectedDate;
                  const isToday = dateStr === getTodayStr();
                  return (
                    <TouchableOpacity
                      key={dateStr}
                      style={[cj.calCell, isSelected && cj.calCellSelected, isToday && !isSelected && cj.calCellToday, !inTrip && cj.calCellDisabled]}
                      onPress={() => {
                        if (!inTrip) return;
                        const day = getDayForDate(dateStr);
                        onSelect(day, dateStr);
                        onClose();
                      }}
                    >
                      <Text style={[cj.calDay, isSelected && cj.calDaySelected, !inTrip && cj.calDayDisabled, isToday && !isSelected && cj.calDayToday]}>
                        {cell.getDate()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity style={cj.todayBtn} onPress={() => {
                const today = getTodayStr();
                if (isInTrip(parseLocalDate(today))) {
                  const day = getDayForDate(today);
                  onSelect(day, today);
                  onClose();
                }
              }}>
                <Text style={cj.todayBtnText}>📍 Go to Today</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Pressable>
    </Modal>
  );
}

const cj = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  handle: { width: 36, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F5F5F5', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 14, color: '#1A1A1A' },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  dayRowActive: { backgroundColor: '#F1F8E9' },
  dayNum: { backgroundColor: '#E8F5E9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  dayNumText: { fontSize: 12, fontWeight: '700', color: '#2E7D32' },
  dayLabel: { flex: 1, fontSize: 14, color: '#1A1A1A' },
  check: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#4CAF50', alignItems: 'center', justifyContent: 'center' },
  calHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  navBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  navText: { fontSize: 20, color: '#1A1A1A' },
  calMonth: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 11, fontWeight: '700', color: '#999', paddingBottom: 8 },
  calCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  calCellSelected: { backgroundColor: '#4CAF50', borderRadius: 20 },
  calCellToday: { borderWidth: 1.5, borderColor: '#4CAF50', borderRadius: 20 },
  calCellDisabled: { opacity: 0.25 },
  calDay: { fontSize: 13, color: '#1A1A1A', fontWeight: '500' },
  calDaySelected: { color: '#fff', fontWeight: '700' },
  calDayDisabled: { color: '#BBB' },
  calDayToday: { color: '#4CAF50', fontWeight: '700' },
  todayBtn: { marginTop: 16, backgroundColor: '#E8F5E9', borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  todayBtnText: { fontSize: 14, fontWeight: '700', color: '#2E7D32' },
});

// ─── Add Activity Modal ───────────────────────────────────────────────────────
function AddActivityModal({ visible, onClose, tripId, selectedDate, dayNumber, onAdded }: {
  visible: boolean; onClose: () => void; tripId: string;
  selectedDate: string; dayNumber: number; onAdded: () => void;
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
    if (!user) { setSaving(false); return; }
    const { error } = await supabase.from('activities').insert({
      trip_id: tripId, title: title.trim(), category,
      date: selectedDate, time: time || null, location: location || null,
      notes: notes || null, status: 'upcoming', created_by: user.id,
    });
    if (error) { Alert.alert('Error', error.message); }
    else {
      setTitle(''); setCategory('activity'); setTime('');
      setLocation(''); setLocationSuggestions([]); setNotes('');
      onAdded(); onClose();
    }
    setSaving(false);
  }

  const displayDate = formatDisplayDate(selectedDate);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={am.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={am.kvWrapper}>
          <View style={am.sheet}>
            {/* Sticky Header */}
            <View style={am.header}>
              <TouchableOpacity onPress={onClose} style={am.cancelBtn}>
                <Text style={am.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={am.headerTitle}>Add Activity</Text>
              <TouchableOpacity
                onPress={handleAdd}
                disabled={!title.trim() || saving}
                style={[am.saveBtn, (!title.trim() || saving) && am.saveBtnDisabled]}
              >
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={am.saveText}>Save</Text>}
              </TouchableOpacity>
            </View>

            {/* Context */}
            <View style={am.contextBar}>
              <Text style={am.contextText}>📅 Day {dayNumber} · {displayDate}</Text>
            </View>

            <ScrollView style={am.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={am.fieldLabel}>Title</Text>
              <TextInput
                style={am.input}
                placeholder="e.g. Sunrise at Mount Batur"
                placeholderTextColor="#C0C0C0"
                value={title}
                onChangeText={setTitle}
                autoFocus
              />

              <Text style={am.fieldLabel}>Category</Text>
              <View style={am.catGrid}>
                {CATEGORY_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.label}
                    style={[am.catChip, category === opt.label && am.catChipActive]}
                    onPress={() => setCategory(opt.label)}
                  >
                    <Text style={{ fontSize: 18 }}>{opt.emoji}</Text>
                    <Text style={[am.catChipText, category === opt.label && am.catChipTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={am.fieldLabel}>Time</Text>
              <TouchableOpacity
                style={[am.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={{ fontSize: 15, color: time ? '#1A1A1A' : '#C0C0C0' }}>{time || 'Pick time'}</Text>
                <Text style={{ fontSize: 16 }}>🕐</Text>
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={(() => { const d = new Date(); if (time) { const [h, m] = time.split(':'); d.setHours(+h, +m); } return d; })()}
                  mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'} is24Hour={true}
                  onChange={(_, date) => {
                    setShowTimePicker(Platform.OS === 'ios');
                    if (date) {
                      setTime(`${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`);
                    }
                  }}
                />
              )}

              <Text style={am.fieldLabel}>Location</Text>
              <TextInput
                style={am.input}
                placeholder="e.g. Ubud, Bali"
                placeholderTextColor="#C0C0C0"
                value={location}
                onChangeText={handleLocationChange}
              />
              {locationSuggestions.length > 0 && (
                <View style={am.suggestions}>
                  {locationSuggestions.map((s, i) => (
                    <TouchableOpacity key={i} style={am.suggestionRow} onPress={() => { setLocation(s); setLocationSuggestions([]); }}>
                      <Text style={{ fontSize: 14 }}>📍</Text>
                      <Text style={am.suggestionText} numberOfLines={2}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={am.fieldLabel}>Notes <Text style={am.optional}>(optional)</Text></Text>
              <TextInput
                style={[am.input, am.textArea]}
                placeholder="Add any extra details..."
                placeholderTextColor="#C0C0C0"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
              <View style={{ height: 100 }} />
            </ScrollView>

            {/* Sticky Add Button */}
            <View style={am.stickyBottom}>
              <TouchableOpacity
                style={[am.addBtn, (!title.trim() || saving) && am.addBtnDisabled]}
                onPress={handleAdd}
                disabled={!title.trim() || saving}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={am.addBtnText}>＋ Add Activity</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const am = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  kvWrapper: { flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '93%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  cancelBtn: { padding: 4 },
  cancelText: { fontSize: 15, color: '#888', fontWeight: '500' },
  saveBtn: { backgroundColor: '#4CAF50', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
  saveBtnDisabled: { backgroundColor: '#C8E6C9' },
  saveText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  contextBar: { backgroundColor: '#F1F8E9', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E8F5E9' },
  contextText: { fontSize: 13, color: '#2E7D32', fontWeight: '600' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#888', letterSpacing: 0.5, marginBottom: 6, marginTop: 16 },
  optional: { fontWeight: '400', color: '#BBB' },
  input: { backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#1A1A1A', borderWidth: 1, borderColor: '#EBEBEB' },
  textArea: { height: 80, textAlignVertical: 'top' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#EBEBEB' },
  catChipActive: { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' },
  catChipText: { fontSize: 12, fontWeight: '600', color: '#666' },
  catChipTextActive: { color: '#4CAF50' },
  suggestions: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#F0F0F0', marginTop: 4, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  suggestionText: { fontSize: 13, color: '#1A1A1A', flex: 1 },
  stickyBottom: { padding: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0', backgroundColor: '#fff' },
  addBtn: { backgroundColor: '#4CAF50', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  addBtnDisabled: { backgroundColor: '#C8E6C9' },
  addBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ItineraryScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { currentTripId, setCurrentTripId } = useCurrentTrip();
  const [allTrips, setAllTrips] = useState<any[]>([]);
  const [trip, setTrip] = useState<any>(null);
  const [days, setDays] = useState<number[]>([]);
  const [totalDays, setTotalDays] = useState(0);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTripSelector, setShowTripSelector] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const statusBarHeight = useStatusBarHeight();

  useFocusEffect(useCallback(() => {
    loadData(currentTripIdRef.current ?? route.params?.tripId);
  }, []));

  useEffect(() => {
    if (selectedDate && trip) loadActivities();
  }, [selectedDate, trip]);

  async function loadData(tripId?: string) {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: memberships } = await supabase.from('trip_members').select('trip_id').eq('user_id', user.id);
    if (!memberships || memberships.length === 0) { setLoading(false); return; }

    const tripIds = memberships.map((m: any) => m.trip_id);
    const { data: tripsData } = await supabase.from('trips').select('*, destinations(id, name)').in('id', tripIds).order('start_date', { ascending: true });

    if (!tripsData || tripsData.length === 0) { setLoading(false); return; }
    setAllTrips(tripsData);

    const selectedTrip = tripId
      ? tripsData.find(t => t.id === tripId) ?? tripsData[0]
      : tripsData.find(t => t.status === 'active') ?? tripsData[0];

    loadTrip(selectedTrip);
  }

  function loadTrip(tripData: any) {
    setTrip(tripData);
    currentTripIdRef.current = tripData.id;
    setCurrentTripId(tripData.id);

    const [syear, smonth, sday] = tripData.start_date.split('-').map(Number);
    const [eyear, emonth, eday] = tripData.end_date.split('-').map(Number);
    const startLocal = new Date(syear, smonth - 1, sday);
    const endLocal = new Date(eyear, emonth - 1, eday);

    const total = Math.round((endLocal.getTime() - startLocal.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    setTotalDays(total);
    setDays(Array.from({ length: total }, (_, i) => i + 1));

    const now = new Date();
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diff = Math.round((todayLocal.getTime() - startLocal.getTime()) / (1000 * 60 * 60 * 24));
    const currentDay = Math.max(1, Math.min(diff + 1, total));
    setSelectedDay(currentDay);

    const selectedDateObj = new Date(syear, smonth - 1, sday + diff);
    setSelectedDate(localDateStr(selectedDateObj));
    setLoading(false);
  }

  async function loadActivities() {
    if (!trip || !selectedDate) return;
    const { data } = await supabase.from('activities').select('*').eq('trip_id', trip.id).eq('date', selectedDate).order('time', { ascending: true });
    setActivities(data ?? []);
  }

  function selectDay(day: number) {
    if (!trip) return;
    setSelectedDay(day);
    const [syear, smonth, sday] = trip.start_date.split('-').map(Number);
    const dateObj = new Date(syear, smonth - 1, sday + day - 1);
    setSelectedDate(localDateStr(dateObj));
  }

  async function toggleActivityStatus(activity: any) {
    const newStatus = activity.status === 'completed' ? 'upcoming' : 'completed';
    await supabase.from('activities').update({ status: newStatus }).eq('id', activity.id);
    loadActivities();
  }

  const doneCount = activities.filter(a => a.status === 'completed').length;
  const displayDate = formatDisplayDate(selectedDate);
  const tripName = trip?.name ?? 'Select trip';

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
        <View style={[styles.header, { paddingTop: statusBarHeight }]}>
          <Text style={styles.title}>Itinerary</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🗺️</Text>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 8 }}>No trip selected</Text>
          <Text style={{ fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 24 }}>Choose a trip to build your itinerary</Text>
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
      <View style={[styles.header, { paddingTop: statusBarHeight }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Itinerary</Text>
          <TouchableOpacity style={styles.tripSelector} onPress={() => setShowTripSelector(true)}>
            <Text style={styles.tripSelectorText} numberOfLines={1}>{tripName}</Text>
            <Text style={{ fontSize: 12, color: '#4CAF50' }}>▾</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.calBtn} onPress={() => setShowCalendar(true)}>
          <Text style={{ fontSize: 22 }}>📅</Text>
        </TouchableOpacity>
      </View>

      {/* Day Navigation */}
      <View style={styles.dayNav}>
        <TouchableOpacity
          style={[styles.dayNavBtn, selectedDay <= 1 && styles.dayNavBtnDisabled]}
          onPress={() => { if (selectedDay > 1) selectDay(selectedDay - 1); }}
        >
          <Text style={styles.dayNavArrow}>‹</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dayNavCenter} onPress={() => setShowCalendar(true)}>
          <Text style={styles.dayNavLabel}>Day {selectedDay} of {totalDays}</Text>
          <Text style={styles.dayNavDate}>{displayDate}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dayNavBtn, selectedDay >= totalDays && styles.dayNavBtnDisabled]}
          onPress={() => { if (selectedDay < totalDays) selectDay(selectedDay + 1); }}
        >
          <Text style={styles.dayNavArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Today shortcut */}
      {selectedDate !== getTodayStr() && (
        <TouchableOpacity style={styles.todayBanner} onPress={() => {
          const [syear, smonth, sday] = trip.start_date.split('-').map(Number);
          const startLocal = new Date(syear, smonth - 1, sday);
          const now = new Date();
          const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const diff = Math.round((todayLocal.getTime() - startLocal.getTime()) / (1000 * 60 * 60 * 24));
          if (diff >= 0 && diff < totalDays) selectDay(diff + 1);
        }}>
          <Text style={styles.todayBannerText}>📍 Jump to today</Text>
        </TouchableOpacity>
      )}

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Day Card */}
        <View style={styles.dayCard}>
          <View style={styles.dayCardHeader}>
            <View>
              <Text style={styles.dayCardTitle}>{displayDate}</Text>
              <Text style={styles.dayCardSub}>Day {selectedDay} of {totalDays}</Text>
            </View>
            <View style={styles.dayCardStats}>
              <Text style={styles.dayCardStatsText}>{activities.length} activities</Text>
              {doneCount > 0 && <Text style={styles.dayCardDone}>✓ {doneCount} done</Text>}
            </View>
          </View>
        </View>

        {/* Activities */}
        <View style={styles.activitiesWrap}>
          {activities.length === 0 ? (
            <View style={styles.emptyDay}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>🌤️</Text>
              <Text style={styles.emptyDayTitle}>No activities yet</Text>
              <Text style={styles.emptyDaySubtitle}>Add something to plan your day</Text>
              <TouchableOpacity style={styles.emptyDayBtn} onPress={() => setShowAddModal(true)}>
                <Text style={styles.emptyDayBtnText}>＋ Add activity</Text>
              </TouchableOpacity>
            </View>
          ) : (
            activities.map((activity, index) => {
              const iconData = CATEGORY_ICONS[activity.category] ?? CATEGORY_ICONS.default;
              const displayStatus = getActivityStatus(activity.time?.slice(0, 5) ?? '00:00', activity.status);
              const statusBg = STATUS_BG[displayStatus] ?? '#fff';
              return (
                <View key={activity.id}>
                  <TouchableOpacity activeOpacity={0.7} onPress={() => toggleActivityStatus(activity)}>
                    <View style={[styles.activityRow, { backgroundColor: statusBg }]}>
                      <View style={styles.timeCol}>
                        <Text style={styles.time}>{activity.time?.slice(0, 5) ?? '--:--'}</Text>
                        {index < activities.length - 1 && <View style={styles.connector} />}
                      </View>
                      <CartoonIcon emoji={iconData.icon} bg={iconData.bg} size={44} />
                      <View style={styles.content}>
                        <Text style={styles.activityTitle}>{activity.title}</Text>
                        {activity.location ? <Text style={styles.subtitle}>{activity.location}</Text> : null}
                        <View style={styles.categoryTag}>
                          <Text style={styles.categoryText}>{activity.category}</Text>
                        </View>
                      </View>
                      {displayStatus === 'DONE' ? (
                        <View style={styles.checkCircle}><Text style={styles.checkMark}>✓</Text></View>
                      ) : (
                        <StatusBadge status={displayStatus} small />
                      )}
                    </View>
                  </TouchableOpacity>
                  {index < activities.length - 1 && (
                    <View style={styles.divider}><DottedLine color="#E0E0E0" style={{ marginLeft: 24 }} /></View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {activities.length > 0 && (
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
            <Text style={styles.addIcon}>＋</Text>
            <Text style={styles.addText}>Add activity</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Modals */}
      <AddActivityModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        tripId={trip.id}
        selectedDate={selectedDate}
        dayNumber={selectedDay}
        onAdded={loadActivities}
      />

      <TripSelectorModal
        visible={showTripSelector}
        trips={allTrips}
        currentTripId={trip.id}
        onSelect={(t) => loadTrip(t)}
        onClose={() => setShowTripSelector(false)}
        onCreateNew={() => navigation.navigate('CreateTrip')}
      />

      <CalendarJumpModal
        visible={showCalendar}
        trip={trip}
        selectedDate={selectedDate}
        totalDays={totalDays}
        onSelect={(day, dateStr) => { setSelectedDay(day); setSelectedDate(dateStr); }}
        onClose={() => setShowCalendar(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F0F0' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  title: { fontSize: 22, fontWeight: '900', color: '#1A1A1A' },
  tripSelector: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  tripSelectorText: { fontSize: 13, fontWeight: '600', color: '#4CAF50' },
  calBtn: { padding: 8 },
  dayNav: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  dayNavBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  dayNavBtnDisabled: { opacity: 0.3 },
  dayNavArrow: { fontSize: 22, color: '#1A1A1A', fontWeight: '300' },
  dayNavCenter: { flex: 1, alignItems: 'center' },
  dayNavLabel: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  dayNavDate: { fontSize: 12, color: '#888', marginTop: 1 },
  todayBanner: { backgroundColor: '#E8F5E9', paddingVertical: 8, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#C8E6C9' },
  todayBannerText: { fontSize: 13, fontWeight: '600', color: '#2E7D32' },
  scroll: { flex: 1 },
  dayCard: { margin: 16, marginBottom: 8, backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  dayCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayCardTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  dayCardSub: { fontSize: 12, color: '#888', marginTop: 2 },
  dayCardStats: { alignItems: 'flex-end' },
  dayCardStatsText: { fontSize: 13, color: '#666', fontWeight: '600' },
  dayCardDone: { fontSize: 12, color: '#4CAF50', marginTop: 2 },
  activitiesWrap: { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  emptyDay: { padding: 32, alignItems: 'center' },
  emptyDayTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  emptyDaySubtitle: { fontSize: 13, color: '#888', marginBottom: 16 },
  emptyDayBtn: { backgroundColor: '#4CAF50', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  emptyDayBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  activityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
  timeCol: { width: 44, alignItems: 'center', paddingTop: 2 },
  time: { fontSize: 12, fontWeight: '700', color: '#444' },
  connector: { width: 2, flex: 1, minHeight: 24, backgroundColor: '#E8E8E8', marginTop: 6 },
  content: { flex: 1, paddingTop: 2 },
  activityTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  subtitle: { fontSize: 12, color: '#888', marginTop: 2 },
  categoryTag: { marginTop: 4 },
  categoryText: { fontSize: 10, color: '#999', fontWeight: '600' },
  checkCircle: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#4CAF50', alignItems: 'center', justifyContent: 'center' },
  checkMark: { fontSize: 13, color: '#fff', fontWeight: '800' },
  divider: { paddingVertical: 2, paddingHorizontal: 14 },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, marginHorizontal: 16, marginBottom: 8, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#E0E0E0', borderStyle: 'dashed' },
  addIcon: { fontSize: 18, color: '#4CAF50', fontWeight: '700' },
  addText: { fontSize: 14, fontWeight: '600', color: '#4CAF50' },
  emptyBtn: { backgroundColor: '#4CAF50', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14 },
  emptyBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
