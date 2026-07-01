import React, { useState, useRef } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { searchLocations } from '../../lib/locationService';
import { getDestinationHero } from '../../lib/destinationHero';
import ActivityCategoryPicker, { getActivityCategoryDef } from './ActivityCategoryPicker';

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

interface DestinationContext {
  name: string;
  country: string | null;
  isCurrent: boolean;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  tripId: string;
  selectedDate: string;
  dayNumber: number;
  onAdded: () => void;
  destinationContext?: DestinationContext | null;
}

export default function AddActivityModal({
  visible, onClose, tripId, selectedDate, dayNumber, onAdded, destinationContext,
}: Props) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('activity');
  const [time, setTime] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [location, setLocation] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
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
  const categoryDef = getActivityCategoryDef(category);
  const heroTheme = destinationContext
    ? getDestinationHero(destinationContext.name, destinationContext.country)
    : null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kvWrapper}>
          <View style={styles.sheet}>

            {/* Sticky Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Add Activity</Text>
              <TouchableOpacity
                onPress={handleAdd}
                disabled={!title.trim() || saving}
                style={[styles.saveBtn, (!title.trim() || saving) && styles.saveBtnDisabled]}
              >
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveText}>Save</Text>}
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              {/* Destination Hero */}
              {destinationContext && heroTheme && (
                <View style={[styles.heroCard, { backgroundColor: heroTheme.background, borderColor: heroTheme.border }]}>
                  <View style={[styles.heroBlobOne, { backgroundColor: heroTheme.blobOne }]} />
                  <View style={[styles.heroBlobTwo, { backgroundColor: heroTheme.blobTwo }]} />
                  <View style={[styles.heroHillBack, { backgroundColor: heroTheme.hillBack }]} />
                  <View style={[styles.heroHillFront, { backgroundColor: heroTheme.hillFront }]} />

                  <View style={styles.heroTextBlock}>
                    <Text style={styles.heroName} numberOfLines={1}>
                      {destinationContext.name}{destinationContext.country ? `, ${destinationContext.country}` : ''}
                    </Text>
                    {destinationContext.isCurrent && (
                      <View style={[styles.heroBadge, { backgroundColor: heroTheme.pillBg }]}>
                        <Text style={[styles.heroBadgeText, { color: heroTheme.text }]}>📍 Current destination</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Day Context Card */}
              <View style={styles.dayCard}>
                <View style={styles.dayCardIconWrap}>
                  <Text style={{ fontSize: 18 }}>📅</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dayCardTitle}>Day {dayNumber} · {displayDate}</Text>
                  <Text style={styles.dayCardSub}>Your adventure continues</Text>
                </View>
                <Text style={styles.mapIcon}>🗺️</Text>
              </View>

              {/* Activity name — primary input */}
              <View style={styles.primaryInputCard}>
                <View style={[styles.primaryIconWrap, { backgroundColor: categoryDef.bg }]}>
                  <Text style={{ fontSize: 22 }}>{categoryDef.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.primaryInputLabel}>What are you planning?</Text>
                  <TextInput
                    style={styles.primaryInputField}
                    placeholder="e.g. Sunrise at Wat Arun"
                    placeholderTextColor="#C0C0C0"
                    value={title}
                    onChangeText={setTitle}
                    autoFocus
                  />
                </View>
              </View>

              {/* Category selector */}
              <TouchableOpacity
                style={styles.selectorCard}
                onPress={() => setShowCategoryPicker(true)}
                activeOpacity={0.8}
              >
                <View style={[styles.selectorIconWrap, { backgroundColor: categoryDef.bg }]}>
                  <Text style={{ fontSize: 18 }}>{categoryDef.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectorTitle}>Category</Text>
                  <Text style={styles.selectorValue}>{categoryDef.label}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>

              {/* Time */}
              <TouchableOpacity style={styles.selectorCard} onPress={() => setShowTimePicker(true)} activeOpacity={0.8}>
                <View style={[styles.selectorIconWrap, { backgroundColor: '#E8F5E9' }]}>
                  <Text style={{ fontSize: 16 }}>🕐</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectorTitle}>Time</Text>
                  <Text style={[styles.selectorValue, !time && styles.selectorPlaceholder]}>{time || 'Pick a time'}</Text>
                </View>
                <Text style={{ fontSize: 18 }}>🕐</Text>
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

              {/* Location */}
              <View style={styles.selectorCard}>
                <View style={[styles.selectorIconWrap, { backgroundColor: '#E8F5E9' }]}>
                  <Text style={{ fontSize: 16 }}>📍</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectorTitle}>Location</Text>
                  <TextInput
                    style={styles.locationInput}
                    placeholder="e.g. Wat Arun, Bangkok"
                    placeholderTextColor="#C0C0C0"
                    value={location}
                    onChangeText={handleLocationChange}
                  />
                </View>
                <Text style={{ fontSize: 18 }}>🗺️</Text>
              </View>
              {locationSuggestions.length > 0 && (
                <View style={styles.suggestions}>
                  {locationSuggestions.map((s, i) => (
                    <TouchableOpacity key={i} style={styles.suggestionRow} onPress={() => { setLocation(s); setLocationSuggestions([]); }}>
                      <Text style={{ fontSize: 14 }}>📍</Text>
                      <Text style={styles.suggestionText} numberOfLines={2}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Notes */}
              <View style={[styles.selectorCard, styles.notesCard]}>
                <View style={[styles.selectorIconWrap, { backgroundColor: '#F3E5F5' }]}>
                  <Text style={{ fontSize: 16 }}>📝</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectorTitle}>Notes <Text style={styles.optional}>(optional)</Text></Text>
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
              </View>

              <View style={{ height: 24 }} />
            </ScrollView>

            {/* Sticky Add Button */}
            <View style={styles.stickyBottom}>
              <TouchableOpacity
                style={[styles.addBtn, (!title.trim() || saving) && styles.addBtnDisabled]}
                onPress={handleAdd}
                disabled={!title.trim() || saving}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.addBtnText}>＋ Add Activity</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>

      <ActivityCategoryPicker
        visible={showCategoryPicker}
        selected={category}
        onSelect={setCategory}
        onClose={() => setShowCategoryPicker(false)}
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

  // Hero
  heroCard: {
    height: 200, borderRadius: 24, borderWidth: 1, overflow: 'hidden',
    position: 'relative', marginTop: 8, marginBottom: 14, justifyContent: 'flex-end',
  },
  heroBlobOne: { position: 'absolute', width: 160, height: 160, borderRadius: 999, top: -56, left: -40, opacity: 0.78 },
  heroBlobTwo: { position: 'absolute', width: 190, height: 190, borderRadius: 999, right: -64, bottom: -80, opacity: 0.72 },
  heroHillBack: { position: 'absolute', left: -24, right: -40, bottom: -34, height: 84, borderTopLeftRadius: 120, borderTopRightRadius: 140, transform: [{ rotate: '-2deg' }] },
  heroHillFront: { position: 'absolute', left: 60, right: -16, bottom: -42, height: 88, borderTopLeftRadius: 120, borderTopRightRadius: 120, transform: [{ rotate: '3deg' }] },
  heroTextBlock: { padding: 16 },
  heroName: { fontSize: 19, fontWeight: '900', color: '#1A1A1A', marginBottom: 8 },
  heroBadge: { alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  heroBadgeText: { fontSize: 11, fontWeight: '800' },

  // Day context card
  dayCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff',
    borderRadius: 18, padding: 14, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  dayCardIconWrap: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' },
  dayCardTitle: { fontSize: 14, fontWeight: '800', color: '#1A1A1A' },
  dayCardSub: { fontSize: 11, color: '#8A817A', marginTop: 2, fontWeight: '600' },
  mapIcon: { fontSize: 18 },

  // Primary input — activity name
  primaryInputCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff',
    borderRadius: 20, padding: 14, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  primaryIconWrap: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  primaryInputLabel: { fontSize: 13, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  primaryInputField: { fontSize: 15, color: '#1A1A1A', padding: 0 },

  // Selector cards (category, time, location, notes)
  selectorCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff',
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  selectorIconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  selectorTitle: { fontSize: 13, fontWeight: '800', color: '#1A1A1A' },
  selectorValue: { fontSize: 13, color: '#8A817A', marginTop: 2, fontWeight: '600' },
  selectorPlaceholder: { color: '#C0C0C0', fontWeight: '500' },
  chevron: { fontSize: 20, color: '#C8BFB5', fontWeight: '300' },
  locationInput: { fontSize: 13, color: '#1A1A1A', marginTop: 2, padding: 0, fontWeight: '600' },

  optional: { fontWeight: '400', color: '#B0A89E' },

  notesCard: { alignItems: 'flex-start' },
  notesInput: { fontSize: 13, color: '#1A1A1A', marginTop: 4, padding: 0, minHeight: 50, textAlignVertical: 'top' },

  suggestions: { backgroundColor: '#fff', borderRadius: 14, marginTop: -4, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  suggestionText: { fontSize: 13, color: '#1A1A1A', flex: 1 },

  stickyBottom: { padding: 16, backgroundColor: '#FFF8F0' },
  addBtn: { backgroundColor: '#4CAF50', borderRadius: 18, paddingVertical: 17, alignItems: 'center', shadowColor: '#4CAF50', shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 },
  addBtnDisabled: { backgroundColor: '#C8E6C9', shadowOpacity: 0 },
  addBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
