import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, Modal, Pressable, KeyboardAvoidingView,
  Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Sparkle, Dot } from '../components/TravelDecorations';
import { supabase } from '../lib/supabase';
import { searchLocations } from '../lib/locationService';
import { currentTripIdRef } from '../context/TripContext';
import { useStatusBarHeight } from '../../hooks/useStatusBarHeight';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';

// ─── Constants ────────────────────────────────────────────────────────────────
const MOODS = [
  { value: 'amazing', emoji: '😍', label: 'Amazing', desc: 'An unforgettable day!' },
  { value: 'good', emoji: '😊', label: 'Good', desc: 'A lovely day overall.' },
  { value: 'normal', emoji: '😐', label: 'Normal', desc: 'Just a regular day.' },
  { value: 'bad', emoji: '😞', label: 'Bad', desc: 'Not the best day...' },
];

const FILTER_TABS = ['All', 'Entries', 'Places', 'AI Stories'];

function localDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getTodayStr(): string {
  const now = new Date();
  return localDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
}

function getYesterdayStr(): string {
  const now = new Date();
  return localDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
}

function formatDateLabel(dateStr: string): string {
  const today = getTodayStr();
  const yesterday = getYesterdayStr();
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  } catch { return dateStr; }
}

function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

async function uploadPhoto(uri: string, userId: string): Promise<string | null> {
  try {
    const ext = uri.split('.').pop() ?? 'jpg';
    const fileName = `${userId}/${Date.now()}.${ext}`;
    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const { error } = await supabase.storage
      .from('journal-photos')
      .upload(fileName, uint8Array, { contentType: `image/${ext}`, upsert: false });
    if (error) { console.log('Upload error:', error); return null; }
    const { data: urlData } = supabase.storage.from('journal-photos').getPublicUrl(fileName);
    return urlData.publicUrl;
  } catch (e) { console.log('Upload exception:', e); return null; }
}

// ─── Mood Timeline ────────────────────────────────────────────────────────────
function MoodTimeline({ entries }: { entries: any[] }) {
  const moodEntries = entries.filter(e => e.mood && e.date).slice(0, 14).reverse();
  if (moodEntries.length === 0) return null;

  return (
    <View style={mt.wrap}>
      <Text style={mt.title}>🎭 MOOD TIMELINE</Text>
      <View style={mt.card}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={mt.scroll}>
          {moodEntries.map(entry => {
            const moodData = MOODS.find(m => m.value === entry.mood);
            const dateStr = entry.date?.split('T')[0] ?? '';
            const parts = dateStr.split('-');
            const d = parts[2] ?? '';
            const monthNum = parseInt(parts[1] ?? '1') - 1;
            const isToday = dateStr === getTodayStr();
            const monthLabel = new Date(2000, monthNum, 1).toLocaleDateString('en-GB', { month: 'short' });
            return (
              <View key={entry.id} style={mt.item}>
                <View style={[mt.emojiWrap, isToday && mt.emojiWrapToday]}>
                  <Text style={{ fontSize: 22 }}>{moodData?.emoji ?? '😐'}</Text>
                </View>
                <Text style={[mt.itemDay, isToday && { color: '#4CAF50', fontWeight: '800' }]}>{parseInt(d)}</Text>
                <Text style={mt.itemMonth}>{monthLabel}</Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const mt = StyleSheet.create({
  wrap: { marginHorizontal: 16, marginBottom: 8 },
  title: { fontSize: 11, fontWeight: '700', color: '#888', letterSpacing: 0.8, marginBottom: 10 },
  card: { backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  scroll: { gap: 8, paddingHorizontal: 8 },
  item: { alignItems: 'center', gap: 4, width: 44 },
  emojiWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  emojiWrapToday: { backgroundColor: '#E8F5E9', borderWidth: 2, borderColor: '#4CAF50' },
  itemDay: { fontSize: 12, color: '#555', fontWeight: '700' },
  itemMonth: { fontSize: 9, color: '#BBB', fontWeight: '600' },
});

// ─── Journal Card ─────────────────────────────────────────────────────────────
function JournalCard({ entry, onEdit, onDelete }: { entry: any; onEdit: () => void; onDelete: () => void }) {
  const time = entry.date ? formatTime(entry.date) : '';
  const moodData = MOODS.find(m => m.value === entry.mood);
  const coverPhoto = Array.isArray(entry.photos) ? entry.photos[0] : null;
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <TouchableOpacity style={jc.card} activeOpacity={0.88} onLongPress={() => setMenuVisible(true)}>
      {coverPhoto ? (
        <Image source={{ uri: coverPhoto }} style={jc.coverPhoto} resizeMode="cover" />
      ) : null}

      <View style={jc.cardBody}>
        <View style={jc.topRow}>
          <View style={jc.titleWrap}>
            {moodData ? <Text style={{ fontSize: 18, marginRight: 6 }}>{moodData.emoji}</Text> : null}
            <Text style={jc.cardTitle} numberOfLines={1}>{entry.title}</Text>
          </View>
          <Text style={jc.cardTime}>{time}</Text>
        </View>

        {entry.location ? (
          <Text style={jc.cardLocation}>📍 {entry.location}</Text>
        ) : null}

        {entry.highlight ? (
          <View style={jc.highlightWrap}>
            <Text style={jc.highlightIcon}>✨</Text>
            <Text style={jc.highlightText} numberOfLines={2}>{entry.highlight}</Text>
          </View>
        ) : null}

        {entry.content ? (
          <Text style={jc.contentPreview} numberOfLines={2}>{entry.content}</Text>
        ) : null}

        <View style={jc.footer}>
          {entry.favorite_meal ? (
            <View style={jc.footerTag}>
              <Text style={{ fontSize: 11 }}>🍜</Text>
              <Text style={jc.footerTagText} numberOfLines={1}>{entry.favorite_meal}</Text>
            </View>
          ) : null}
          {entry.trips?.name ? (
            <View style={jc.tripTag}>
              <Text style={{ fontSize: 10 }}>✈️</Text>
              <Text style={jc.tripTagText} numberOfLines={1}>{entry.trips.name}</Text>
            </View>
          ) : null}
          {Array.isArray(entry.photos) && entry.photos.length > 0 ? (
            <View style={jc.photoTag}>
              <Text style={{ fontSize: 10 }}>📷</Text>
              <Text style={jc.photoTagText}>{entry.photos.length}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <Modal visible={menuVisible} transparent animationType="fade">
        <Pressable style={jc.menuOverlay} onPress={() => setMenuVisible(false)}>
          <View style={jc.menuSheet}>
            <TouchableOpacity style={jc.menuItem} onPress={() => { setMenuVisible(false); onEdit(); }}>
              <Text style={{ fontSize: 18 }}>✏️</Text>
              <Text style={jc.menuItemText}>Edit entry</Text>
            </TouchableOpacity>
            <View style={jc.menuDivider} />
            <TouchableOpacity style={jc.menuItem} onPress={() => { setMenuVisible(false); onDelete(); }}>
              <Text style={{ fontSize: 18 }}>🗑️</Text>
              <Text style={[jc.menuItemText, { color: '#F44336' }]}>Delete entry</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </TouchableOpacity>
  );
}

const jc = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 10, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  coverPhoto: { width: '100%', height: 140 },
  cardBody: { padding: 14 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 },
  titleWrap: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#1A1A1A', flex: 1 },
  cardTime: { fontSize: 11, color: '#BBB', flexShrink: 0 },
  cardLocation: { fontSize: 12, color: '#888', marginBottom: 8 },
  highlightWrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: '#FFFBEB', borderRadius: 10, padding: 10, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#F59E0B' },
  highlightIcon: { fontSize: 14, marginTop: 1 },
  highlightText: { fontSize: 13, color: '#78350F', fontWeight: '500', flex: 1, lineHeight: 18 },
  contentPreview: { fontSize: 13, color: '#666', lineHeight: 19, marginBottom: 8 },
  footer: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  footerTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF8E1', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  footerTagText: { fontSize: 11, color: '#E65100', fontWeight: '600', maxWidth: 100 },
  tripTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8F5E9', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  tripTagText: { fontSize: 11, color: '#2E7D32', fontWeight: '600', maxWidth: 100 },
  photoTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E3F2FD', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  photoTagText: { fontSize: 11, color: '#1565C0', fontWeight: '600' },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  menuSheet: { backgroundColor: '#fff', borderRadius: 16, width: 240, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  menuItemText: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  menuDivider: { height: 1, backgroundColor: '#F0F0F0' },
});

// ─── Entry Modal ──────────────────────────────────────────────────────────────
function EntryModal({ visible, onClose, trips, activities, todayExpenses, editEntry, onSaved }: {
  visible: boolean;
  onClose: () => void;
  trips: any[];
  activities: any[];
  todayExpenses: any[];
  editEntry: any | null;
  onSaved: () => void;
}) {
  const isEdit = !!editEntry;
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [highlight, setHighlight] = useState('');
  const [favoriteMeal, setFavoriteMeal] = useState('');
  const [location, setLocation] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [linkedActivities, setLinkedActivities] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  

  const currentTrip = trips.find(t => t.id === currentTripIdRef.current) ?? trips[0];

  React.useEffect(() => {
    if (visible) {
      if (editEntry) {
        setTitle(editEntry.title ?? '');
        setContent(editEntry.content ?? '');
        setMood(editEntry.mood ?? '');
        setHighlight(editEntry.highlight ?? '');
        setFavoriteMeal(editEntry.favorite_meal ?? '');
        setLocation(editEntry.location ?? '');
        setPhotos(Array.isArray(editEntry.photos) ? editEntry.photos : []);
        setLinkedActivities(editEntry.activity_id ? [editEntry.activity_id] : []);
      } else {
        setTitle(''); setContent(''); setMood(''); setHighlight('');
        setFavoriteMeal(''); setLocation(''); setPhotos([]); setLinkedActivities([]);
      }
      setLocationSuggestions([]);
    }
  }, [visible, editEntry]);

  async function handlePickPhotos() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow access to your photo library.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const uris = result.assets.map(a => a.uri);
      setPhotos(prev => [...prev, ...uris].slice(0, 6));
    }
  }

  async function handleLocationChange(text: string) {
    setLocation(text);
    if (text.length >= 3) {
      const results = await searchLocations(text);
      setLocationSuggestions(results);
    } else {
      setLocationSuggestions([]);
    }
  }

  function toggleActivity(actId: string) {
    setLinkedActivities(prev =>
      prev.includes(actId) ? prev.filter(id => id !== actId) : [...prev, actId]
    );
  }

  async function handleGenerateSummary() {
    setGenerating(true);
    try {
      const moodLabel = MOODS.find(m => m.value === mood)?.label ?? '';
      const todayActs = activities.filter(a => a.date === getTodayStr());
      const context = [
        currentTrip ? `Trip: ${currentTrip.name}` : '',
        moodLabel ? `Mood: ${moodLabel}` : '',
        highlight ? `Best moment: ${highlight}` : '',
        favoriteMeal ? `Favorite meal: ${favoriteMeal}` : '',
        location ? `Location: ${location}` : '',
        todayActs.length > 0 ? `Activities: ${todayActs.map(a => a.title).join(', ')}` : '',
        todayExpenses.length > 0 ? `Spent: ${todayExpenses.map(e => `${e.title} (€${e.amount})`).join(', ')}` : '',
      ].filter(Boolean).join('\n');

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Write a warm, personal travel diary entry based on:\n\n${context}\n\nWrite 2-3 paragraphs in first person, past tense. Make it vivid and emotional. Under 200 words.`,
          }],
        }),
      });
      const data = await response.json();
      const text = data.content?.[0]?.text ?? '';
      if (text) setContent(text);
      else Alert.alert('Error', 'Could not generate summary.');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not generate summary.');
    }
    setGenerating(false);
  }

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const tripId = currentTripIdRef.current ?? trips[0]?.id;
    if (!tripId) { setSaving(false); return; }

    setUploadingPhotos(true);
    const uploadedUrls: string[] = [];
    for (const uri of photos) {
      if (uri.startsWith('http')) {
        uploadedUrls.push(uri);
      } else {
        const url = await uploadPhoto(uri, user.id);
        if (url) uploadedUrls.push(url);
      }
    }
    setUploadingPhotos(false);

    const payload = {
      trip_id: tripId,
      activity_id: linkedActivities[0] || null,
      title: title.trim(),
      content,
      mood,
      highlight,
      favorite_meal: favoriteMeal,
      location,
      photos: uploadedUrls,
    };

    let error: any = null;
    if (isEdit) {
      const res = await supabase.from('journal_entries').update(payload).eq('id', editEntry.id);
      error = res.error;
    } else {
      const res = await supabase.from('journal_entries').insert({ ...payload, date: new Date().toISOString(), created_by: user.id });
      error = res.error;
    }

    if (error) { Alert.alert('Error', error.message); }
    else { onSaved(); onClose(); }
    setSaving(false);
  }

  const todayActs = activities.filter(a => a.date === getTodayStr());
  const totalTodaySpent = todayExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={em.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={em.kvWrapper}>
          <View style={em.sheet}>
            <View style={em.header}>
              <TouchableOpacity onPress={onClose}><Text style={em.cancel}>Cancel</Text></TouchableOpacity>
              <Text style={em.headerTitle}>{isEdit ? 'Edit Entry' : 'New Journal Entry'}</Text>
              <View style={{ width: 60 }} />
            </View>

            {currentTrip && (
              <View style={em.contextBar}>
                <Text style={em.contextTrip}>{currentTrip.name}</Text>
                <Text style={em.contextDate}>{formatDateLabel(getTodayStr())}</Text>
              </View>
            )}

            <ScrollView style={em.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              <Text style={em.fieldLabel}>📷 Photos</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={em.photoScroll}>
                <TouchableOpacity style={em.addPhotoBtn} onPress={handlePickPhotos}>
                  <Text style={{ fontSize: 24 }}>📷</Text>
                  <Text style={em.addPhotoText}>Add</Text>
                </TouchableOpacity>
                {photos.map((uri, i) => (
                  <View key={i} style={em.photoWrap}>
                    <Image source={{ uri }} style={em.photo} resizeMode="cover" />
                    <TouchableOpacity style={em.photoRemove} onPress={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}>
                      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>✕</Text>
                    </TouchableOpacity>
                    {i === 0 && <View style={em.coverBadge}><Text style={em.coverBadgeText}>Cover</Text></View>}
                  </View>
                ))}
              </ScrollView>

              <Text style={em.fieldLabel}>How was your day?</Text>
              <View style={em.moodRow}>
                {MOODS.map(m => (
                  <TouchableOpacity
                    key={m.value}
                    style={[em.moodBtn, mood === m.value && em.moodBtnActive]}
                    onPress={() => setMood(mood === m.value ? '' : m.value)}
                  >
                    <Text style={{ fontSize: 28 }}>{m.emoji}</Text>
                    <Text style={[em.moodLabel, mood === m.value && { color: '#4CAF50', fontWeight: '800' }]}>{m.label}</Text>
                    {mood === m.value && <Text style={em.moodDesc}>{m.desc}</Text>}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={em.fieldLabel}>Title</Text>
              <TextInput style={em.input} placeholder="e.g. Sunrise at Wat Arun" placeholderTextColor="#C0C0C0" value={title} onChangeText={setTitle} />

              <Text style={em.fieldLabel}>✨ Best moment <Text style={em.optional}>(optional)</Text></Text>
              <TextInput style={em.input} placeholder="What was the highlight of your day?" placeholderTextColor="#C0C0C0" value={highlight} onChangeText={setHighlight} />

              <Text style={em.fieldLabel}>🍜 Favorite meal <Text style={em.optional}>(optional)</Text></Text>
              <TextInput style={em.input} placeholder="e.g. Pad Thai at street market" placeholderTextColor="#C0C0C0" value={favoriteMeal} onChangeText={setFavoriteMeal} />

              <Text style={em.fieldLabel}>📍 Location <Text style={em.optional}>(optional)</Text></Text>
              <TextInput style={em.input} placeholder="e.g. Bangkok" placeholderTextColor="#C0C0C0" value={location} onChangeText={handleLocationChange} />
              {locationSuggestions.length > 0 && (
                <View style={em.suggestions}>
                  {locationSuggestions.map((s, i) => (
                    <TouchableOpacity key={i} style={em.suggestionRow} onPress={() => { setLocation(s); setLocationSuggestions([]); }}>
                      <Text style={{ fontSize: 14 }}>📍</Text>
                      <Text style={em.suggestionText} numberOfLines={1}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {todayActs.length > 0 && (
                <>
                  <Text style={em.fieldLabel}>🗺 Today's activities</Text>
                  <View style={em.checklistWrap}>
                    {todayActs.map(act => {
                      const checked = linkedActivities.includes(act.id);
                      return (
                        <TouchableOpacity key={act.id} style={em.checklistItem} onPress={() => toggleActivity(act.id)}>
                          <View style={[em.checkbox, checked && em.checkboxChecked]}>
                            {checked && <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>✓</Text>}
                          </View>
                          <Text style={[em.checklistText, checked && { color: '#4CAF50', fontWeight: '600' }]}>{act.title}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              {todayExpenses.length > 0 && (
                <>
                  <Text style={em.fieldLabel}>💰 Today's spending</Text>
                  <View style={em.spendingCard}>
                    <View style={em.spendingTop}>
                      <Text style={em.spendingTotal}>€{totalTodaySpent.toFixed(0)}</Text>
                      <Text style={em.spendingCount}>{todayExpenses.length} expenses</Text>
                    </View>
                    {todayExpenses.slice(0, 3).map(e => (
                      <View key={e.id} style={em.spendingRow}>
                        <Text style={em.spendingTitle}>{e.title}</Text>
                        <Text style={em.spendingAmount}>€{Number(e.amount).toFixed(0)}</Text>
                      </View>
                    ))}
                    {todayExpenses.length > 3 && (
                      <Text style={em.spendingMore}>+{todayExpenses.length - 3} more</Text>
                    )}
                  </View>
                </>
              )}

              <Text style={em.fieldLabel}>Notes</Text>
              <TextInput
                style={[em.input, em.textArea]}
                placeholder="Write about your day..."
                placeholderTextColor="#C0C0C0"
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={5}
              />

              <TouchableOpacity
                style={[em.generateBtn, generating && { opacity: 0.6 }]}
                onPress={handleGenerateSummary}
                disabled={generating}
              >
                {generating ? <ActivityIndicator color="#7C3AED" size="small" /> : <Text style={{ fontSize: 16 }}>✨</Text>}
                <Text style={em.generateText}>{generating ? 'Generating...' : 'Generate AI Summary'}</Text>
              </TouchableOpacity>

              <View style={{ height: 120 }} />
            </ScrollView>

            <View style={em.stickyBottom}>
              <TouchableOpacity
                style={[em.saveBtn2, (!title.trim() || saving || uploadingPhotos) && em.saveBtnDisabled2]}
                onPress={handleSave}
                disabled={!title.trim() || saving || uploadingPhotos}
              >
                {saving || uploadingPhotos
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={em.saveText2}>📖 {isEdit ? 'Save Changes' : 'Save Journal Entry'}</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const em = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  kvWrapper: { flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '95%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  cancel: { fontSize: 15, color: '#888', fontWeight: '500', width: 60 },
  contextBar: { backgroundColor: '#1A1A2E', paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  contextTrip: { fontSize: 13, fontWeight: '700', color: '#fff' },
  contextDate: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#888', letterSpacing: 0.5, marginBottom: 8, marginTop: 18 },
  optional: { fontWeight: '400', color: '#BBB' },
  input: { backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#1A1A1A', borderWidth: 1, borderColor: '#EBEBEB' },
  textArea: { height: 120, textAlignVertical: 'top' },
  photoScroll: { gap: 10, paddingVertical: 4, paddingRight: 8 },
  addPhotoBtn: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#F5F5F5', borderWidth: 1.5, borderColor: '#E0E0E0', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 },
  addPhotoText: { fontSize: 11, color: '#888', fontWeight: '600' },
  photoWrap: { position: 'relative' },
  photo: { width: 80, height: 80, borderRadius: 12 },
  photoRemove: { position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: '#F44336', alignItems: 'center', justifyContent: 'center' },
  coverBadge: { position: 'absolute', bottom: 4, left: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  coverBadgeText: { fontSize: 9, color: '#fff', fontWeight: '700' },
  moodRow: { flexDirection: 'row', gap: 8 },
  moodBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 14, backgroundColor: '#F5F5F5', borderWidth: 1.5, borderColor: '#EBEBEB', gap: 4, minHeight: 80 },
  moodBtnActive: { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' },
  moodLabel: { fontSize: 10, fontWeight: '600', color: '#888', textAlign: 'center' },
  moodDesc: { fontSize: 9, color: '#4CAF50', textAlign: 'center', paddingHorizontal: 2 },
  suggestions: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#F0F0F0', marginTop: 4, elevation: 3 },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  suggestionText: { fontSize: 13, color: '#1A1A1A', flex: 1 },
  checklistWrap: { backgroundColor: '#F9F9F9', borderRadius: 12, borderWidth: 1, borderColor: '#EBEBEB', overflow: 'hidden' },
  checklistItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: '#D0D0D0', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  checklistText: { fontSize: 14, color: '#555', flex: 1 },
  spendingCard: { backgroundColor: '#F0FDF4', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#BBF7D0' },
  spendingTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  spendingTotal: { fontSize: 22, fontWeight: '900', color: '#15803D' },
  spendingCount: { fontSize: 12, color: '#888' },
  spendingRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  spendingTitle: { fontSize: 13, color: '#555', flex: 1 },
  spendingAmount: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
  spendingMore: { fontSize: 11, color: '#888', marginTop: 4 },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, marginTop: 10, borderRadius: 12, backgroundColor: '#F3E8FF', borderWidth: 1.5, borderColor: '#C4B5FD' },
  generateText: { fontSize: 14, fontWeight: '700', color: '#7C3AED' },
  stickyBottom: { padding: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0', backgroundColor: '#fff' },
  saveBtn2: { backgroundColor: '#4CAF50', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  saveBtnDisabled2: { backgroundColor: '#C8E6C9' },
  saveText2: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function JournalScreen() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editEntry, setEditEntry] = useState<any | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [todayExpenses, setTodayExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const currentTrip = trips.find(t => t.id === currentTripIdRef.current) ?? trips[0];
  const statusBarHeight = useStatusBarHeight();

  useFocusEffect(useCallback(() => { loadData(); }, []));
  useRealtimeSync({ tripId: currentTripIdRef.current, tables: ['journal_entries'], onChange: loadData });

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: memberships } = await supabase.from('trip_members').select('trip_id').eq('user_id', user.id);
    if (!memberships || memberships.length === 0) { setLoading(false); return; }
    const tripIds = memberships.map((m: any) => m.trip_id);

    const { data: tripsData } = await supabase.from('trips').select('id, name, status').in('id', tripIds).order('start_date', { ascending: false });
    setTrips(tripsData ?? []);

    const currentTripId = currentTripIdRef.current ?? tripsData?.find((t: any) => t.status === 'active')?.id;

    if (currentTripId) {
      const { data: actsData } = await supabase
        .from('activities').select('id, title, date').eq('trip_id', currentTripId)
        .order('date', { ascending: false }).limit(30);
      setActivities(actsData ?? []);

      const today = getTodayStr();
      const { data: expData } = await supabase
        .from('expenses').select('id, title, amount, category').eq('trip_id', currentTripId)
        .gte('date', `${today}T00:00:00`).lte('date', `${today}T23:59:59`);
      setTodayExpenses(expData ?? []);
    }

    const { data: entriesData } = await supabase
      .from('journal_entries').select('*, trips(name)').in('trip_id', tripIds).order('date', { ascending: false });
    setEntries(entriesData ?? []);
    setLoading(false);
  }

  async function handleDelete(entryId: string) {
    Alert.alert('Delete Entry', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await supabase.from('journal_entries').delete().eq('id', entryId);
          setEntries(prev => prev.filter(e => e.id !== entryId));
        },
      },
    ]);
  }

  function handleEdit(entry: any) { setEditEntry(entry); setShowModal(true); }
  function handleAdd() { setEditEntry(null); setShowModal(true); }

  const filtered = entries
    .filter(e => {
      if (activeFilter === 'Entries') return e.content?.length > 0;
      if (activeFilter === 'Places') return e.location?.length > 0;
      if (activeFilter === 'AI Stories') return e.content?.length > 100;
      return true;
    })
    .filter(e => searchText
      ? e.title?.toLowerCase().includes(searchText.toLowerCase()) ||
        e.content?.toLowerCase().includes(searchText.toLowerCase())
      : true
    );

  const grouped: Record<string, any[]> = {};
  for (const entry of filtered) {
    const dateKey = entry.date?.split('T')[0] ?? 'unknown';
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(entry);
  }
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <View style={[styles.header, { paddingTop: statusBarHeight }]}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Sparkle color="#FF9800" size={14} style={{ position: 'relative' }} />
            <Text style={styles.title}>Journal</Text>
          </View>
          {currentTrip && (
            <Text style={styles.headerSub}>{currentTrip.name} · {entries.length} entries</Text>
          )}
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setSearchOpen(v => !v)}>
            <Text style={{ fontSize: 20 }}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
            <Text style={styles.addBtnText}>＋ New</Text>
          </TouchableOpacity>
        </View>
      </View>

      {searchOpen && (
        <View style={styles.searchBar}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search journal…"
            placeholderTextColor="#C0C0C0"
            value={searchText}
            onChangeText={setSearchText}
            autoFocus
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContent}>
        {FILTER_TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, activeFilter === tab && styles.filterTabActive]}
            onPress={() => setActiveFilter(tab)}
          >
            <Text style={[styles.filterTabText, activeFilter === tab && styles.filterTabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {entries.length > 0 && <MoodTimeline entries={entries} />}

          {filtered.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 60 }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>📖</Text>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#1A1A1A' }}>No entries yet</Text>
              <Text style={{ color: '#888', marginTop: 4, marginBottom: 20 }}>Start writing your travel diary</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={handleAdd}>
                <Text style={styles.emptyBtnText}>✏️ Write first entry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            sortedDates.map(dateKey => (
              <View key={dateKey} style={styles.dayGroup}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayLabel}>{formatDateLabel(dateKey)}</Text>
                  <View style={styles.dayLine} />
                  <Text style={styles.dayCount}>{grouped[dateKey].length}</Text>
                </View>
                {grouped[dateKey].map(entry => (
                  <JournalCard
                    key={entry.id}
                    entry={entry}
                    onEdit={() => handleEdit(entry)}
                    onDelete={() => handleDelete(entry.id)}
                  />
                ))}
              </View>
            ))
          )}

          <View style={styles.footerDecor}>
            <Dot color="#DDD" size={5} style={{ position: 'relative' }} />
            <Dot color="#DDD" size={4} style={{ position: 'relative', marginLeft: 8 }} />
            <Sparkle color="#FF9800" size={10} style={{ position: 'relative', marginLeft: 6 }} />
          </View>
          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      <EntryModal
        visible={showModal}
        onClose={() => { setShowModal(false); setEditEntry(null); }}
        trips={trips}
        activities={activities}
        todayExpenses={todayExpenses}
        editEntry={editEntry}
        onSaved={loadData}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F0F0' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  title: { fontSize: 22, fontWeight: '900', color: '#1A1A1A' },
  headerSub: { fontSize: 12, color: '#FF9800', fontWeight: '600', marginTop: 1 },
  headerIcons: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  iconBtn: { padding: 4 },
  addBtn: { backgroundColor: '#FF9800', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  addBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  searchInput: { flex: 1, fontSize: 15, color: '#1A1A1A', backgroundColor: '#F5F5F5', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  clearSearch: { fontSize: 16, color: '#888', marginLeft: 8, padding: 4 },
  tabScroll: { backgroundColor: '#fff', maxHeight: 52 },
  tabContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 8, flexDirection: 'row' },
  filterTab: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F0F0F0' },
  filterTabActive: { backgroundColor: '#FF9800' },
  filterTabText: { fontSize: 13, fontWeight: '600', color: '#666' },
  filterTabTextActive: { color: '#fff' },
  scroll: { flex: 1, paddingTop: 12 },
  dayGroup: { marginHorizontal: 16, marginBottom: 16 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  dayLabel: { fontSize: 13, fontWeight: '800', color: '#1A1A1A' },
  dayLine: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  dayCount: { fontSize: 11, fontWeight: '700', color: '#888', backgroundColor: '#F0F0F0', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  emptyBtn: { backgroundColor: '#FF9800', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14 },
  emptyBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  footerDecor: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
});
