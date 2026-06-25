import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import BottomSheet, { SheetButton, MenuSheet } from '../components/BottomSheet';
import { Sparkle, Cloud, Dot, TravelStamp } from '../components/TravelDecorations';
import { supabase } from '../lib/supabase';
import { searchLocations } from '../lib/locationService';

const FILTER_TABS = ['All', 'Notes', 'Photos', 'Places'];

export default function JournalScreen() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [entries, setEntries] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newText, setNewText] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [newLinkedActivity, setNewLinkedActivity] = useState('');
  const [selectedTrip, setSelectedTrip] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load all user trips
    const { data: memberships } = await supabase
      .from('trip_members')
      .select('trip_id')
      .eq('user_id', user.id);

    if (!memberships || memberships.length === 0) { setLoading(false); return; }
    const tripIds = memberships.map((m: any) => m.trip_id);

    const { data: tripsData } = await supabase
      .from('trips')
      .select('id, name, status')
      .in('id', tripIds)
      .order('start_date', { ascending: false });

    setTrips(tripsData ?? []);

    const activeTrip = tripsData?.find((t: any) => t.status === 'active');
    if (activeTrip) {
      setSelectedTrip(activeTrip.id);

      // Load activities for active trip
      const { data: actsData } = await supabase
        .from('activities')
        .select('id, title, date')
        .eq('trip_id', activeTrip.id)
        .order('date', { ascending: false })
        .limit(20);
      setActivities(actsData ?? []);
    }

    // Load all journal entries
    const { data: entriesData } = await supabase
      .from('journal_entries')
      .select(`*, trips(name)`)
      .in('trip_id', tripIds)
      .order('date', { ascending: false });

    setEntries(entriesData ?? []);
    setLoading(false);
  }

  async function handleLocationChange(text: string) {
    setNewLocation(text);
    if (text.length >= 3) {
      const results = await searchLocations(text);
      setLocationSuggestions(results);
    } else {
      setLocationSuggestions([]);
    }
  }

  async function handlePickPhotos() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setPhotos((prev) => [...prev, ...uris].slice(0, 5));
    }
  }

  async function handleSave() {
    if (!newTitle.trim()) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const tripId = selectedTrip || trips[0]?.id;
    if (!tripId) { setSaving(false); return; }

    const linkedActivity = activities.find((a) => a.id === newLinkedActivity);

    const { data, error } = await supabase
      .from('journal_entries')
      .insert({
        trip_id: tripId,
        activity_id: newLinkedActivity || null,
        title: newTitle.trim(),
        content: newText,
        date: new Date().toISOString(),
        created_by: user.id,
      })
      .select(`*, trips(name)`)
      .single();

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setEntries((prev) => [{ ...data, location: newLocation, photos }, ...prev]);
      setNewTitle(''); setNewText(''); setNewLocation('');
      setNewLinkedActivity(''); setPhotos([]);
      setShowAddModal(false);
    }
    setSaving(false);
  }

  // Group entries by date
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const filtered = entries.filter((e) => {
    if (activeFilter === 'Photos') return e.photos?.length > 0;
    if (activeFilter === 'Notes') return e.content?.length > 0;
    return true;
  }).filter((e) =>
    searchText
      ? e.title?.toLowerCase().includes(searchText.toLowerCase()) ||
        e.content?.toLowerCase().includes(searchText.toLowerCase())
      : true
  );

  const todayEntries = filtered.filter((e) => e.date?.startsWith(today));
  const yesterdayEntries = filtered.filter((e) => e.date?.startsWith(yesterday));
  const olderEntries = filtered.filter((e) => !e.date?.startsWith(today) && !e.date?.startsWith(yesterday));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Sparkle color="#FF9800" size={14} style={{ position: 'relative', marginRight: 6 }} />
          <Text style={styles.title}>Journal</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setSearchOpen((v) => !v)}>
            <Text style={{ fontSize: 20 }}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowAddModal(true)}>
            <Text style={{ fontSize: 22, color: '#4CAF50', fontWeight: '700' }}>＋</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setMenuVisible(true)}>
            <Text style={{ fontSize: 20 }}>⋯</Text>
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabScrollContent}
      >
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, activeFilter === tab && styles.filterTabActive]}
            onPress={() => setActiveFilter(tab)}
          >
            <Text style={[styles.filterTabText, activeFilter === tab && styles.filterTabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {filtered.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 60 }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>📖</Text>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#1A1A1A' }}>No entries yet</Text>
              <Text style={{ color: '#888', marginTop: 4 }}>Tap + to write your first memory</Text>
            </View>
          ) : (
            <>
              {todayEntries.length > 0 && (
                <DayGroup label="TODAY" entries={todayEntries} accent="#FF9800" headerColor="#FFF8E1" textColor="#E65100" />
              )}
              {yesterdayEntries.length > 0 && (
                <DayGroup label="YESTERDAY" entries={yesterdayEntries} accent={undefined} headerColor="#E8F5E9" textColor="#2E7D32" />
              )}
              {olderEntries.length > 0 && (
                <DayGroup label="EARLIER" entries={olderEntries} accent={undefined} headerColor="#E3F2FD" textColor="#0D47A1" />
              )}
            </>
          )}

          <View style={styles.footerDecor}>
            <Dot color="#DDD" size={5} style={{ position: 'relative' }} />
            <Dot color="#DDD" size={4} style={{ position: 'relative', marginLeft: 8 }} />
            <Sparkle color="#FF9800" size={10} style={{ position: 'relative', marginLeft: 6 }} />
          </View>
          <View style={{ height: 24 }} />
        </ScrollView>
      )}

      <MenuSheet
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        items={[
          { label: 'Sort by date', icon: '📅', onPress: () => {} },
          { label: 'Export journal', icon: '📤', onPress: () => {} },
        ]}
      />

      <BottomSheet visible={showAddModal} onClose={() => setShowAddModal(false)} title="New Journal Entry">
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Trip selector if multiple trips */}
          {trips.length > 1 && (
            <>
              <Text style={styles.fieldLabel}>Trip</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, flexDirection: 'row', marginBottom: 8 }}>
                {trips.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.actChip, selectedTrip === t.id && styles.actChipActive]}
                    onPress={() => setSelectedTrip(t.id)}
                  >
                    <Text style={[styles.actChipText, selectedTrip === t.id && styles.actChipTextActive]}>
                      {t.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          <Text style={styles.fieldLabel}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Sunrise at Borobudur"
            placeholderTextColor="#C0C0C0"
            value={newTitle}
            onChangeText={setNewTitle}
          />

          <Text style={styles.fieldLabel}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Write about your experience…"
            placeholderTextColor="#C0C0C0"
            value={newText}
            onChangeText={setNewText}
            multiline
            numberOfLines={4}
          />

          <Text style={styles.fieldLabel}>Location <Text style={styles.optionalLabel}>(optional)</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Yogyakarta"
            placeholderTextColor="#C0C0C0"
            value={newLocation}
            onChangeText={handleLocationChange}
          />
          {locationSuggestions.length > 0 && (
            <View style={styles.suggestions}>
              {locationSuggestions.map((s, i) => (
                <TouchableOpacity key={i} style={styles.suggestionRow} onPress={() => { setNewLocation(s); setLocationSuggestions([]); }}>
                  <Text style={{ fontSize: 14 }}>📍</Text>
                  <Text style={styles.suggestionText} numberOfLines={1}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {activities.length > 0 && (
            <>
              <Text style={styles.fieldLabel}>
                Link to activity <Text style={styles.optionalLabel}>(optional)</Text>
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activityChips}>
                {activities.map((act) => (
                  <TouchableOpacity
                    key={act.id}
                    style={[styles.actChip, newLinkedActivity === act.id && styles.actChipActive]}
                    onPress={() => setNewLinkedActivity(newLinkedActivity === act.id ? '' : act.id)}
                  >
                    <Text style={[styles.actChipText, newLinkedActivity === act.id && styles.actChipTextActive]}>
                      {act.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          <Text style={styles.fieldLabel}>
            Photos <Text style={styles.optionalLabel}>(optional)</Text>
          </Text>
          {photos.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {photos.map((uri, i) => (
                <View key={i} style={{ marginRight: 8, position: 'relative' }}>
                  <Image source={{ uri }} style={{ width: 80, height: 80, borderRadius: 12 }} />
                  <TouchableOpacity
                    style={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#F44336', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}
                    onPress={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
          <TouchableOpacity style={styles.photoUploadBtn} onPress={handlePickPhotos}>
            <Text style={{ fontSize: 22 }}>📸</Text>
            <Text style={styles.photoUploadText}>
              {photos.length > 0 ? `${photos.length} photo(s) selected · Add more` : 'Add photos'}
            </Text>
          </TouchableOpacity>

          <SheetButton label={saving ? 'Saving...' : 'Save Entry'} onPress={handleSave} disabled={!newTitle.trim() || saving} />
          <View style={{ height: 16 }} />
        </ScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
}

function DayGroup({ label, entries, accent, headerColor, textColor }: {
  label: string; entries: any[]; accent?: string; headerColor: string; textColor: string;
}) {
  return (
    <View style={[styles.sectionBlock, { borderColor: headerColor }]}>
      <View style={[styles.sectionHeader, { backgroundColor: headerColor }]}>
        <View style={styles.sectionTitleWrap}>
          <Sparkle color={textColor} size={12} style={{ position: 'relative', marginRight: 6 }} />
          <Text style={[styles.sectionTitle, { color: textColor }]}>{label}</Text>
        </View>
        {accent ? (
          <TravelStamp label="MEMORIES" color={accent} style={{ position: 'relative', transform: [] }} />
        ) : (
          <Cloud size={16} color={textColor} style={{ position: 'relative' }} />
        )}
      </View>
      <View style={styles.sectionCard}>
        {entries.map((entry) => (
          <JournalCard key={entry.id} entry={entry} />
        ))}
      </View>
    </View>
  );
}

function JournalCard({ entry }: { entry: any }) {
  const time = entry.date
    ? new Date(entry.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8}>
      <View style={styles.thumbWrap}>
        {entry.photos?.[0] ? (
          <Image source={{ uri: entry.photos[0] }} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Text style={{ fontSize: 32 }}>📝</Text>
          </View>
        )}
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardLocation} numberOfLines={1}>{entry.title}</Text>
          <Text style={styles.cardTime}>{time}</Text>
        </View>
        {entry.trips?.name && (
          <View style={styles.linkedChip}>
            <Text style={{ fontSize: 10 }}>✈️</Text>
            <Text style={styles.linkedChipText} numberOfLines={1}>{entry.trips.name}</Text>
          </View>
        )}
        {entry.content ? (
          <Text style={styles.cardNote} numberOfLines={2}>{entry.content}</Text>
        ) : null}
        {entry.photos?.length > 0 ? (
          <Text style={styles.photosCount}>{entry.photos.length} photos</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#E8E8E8' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#1A1A1A' },
  headerIcons: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 4 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  searchInput: { flex: 1, fontSize: 15, color: '#1A1A1A', backgroundColor: '#F5F5F5', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  clearSearch: { fontSize: 16, color: '#888', marginLeft: 8, padding: 4 },
  tabScroll: { backgroundColor: '#fff', maxHeight: 52 },
  tabScrollContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 8, flexDirection: 'row' },
  filterTab: { paddingHorizontal: 18, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F0F0F0' },
  filterTabActive: { backgroundColor: '#4CAF50' },
  filterTabText: { fontSize: 14, fontWeight: '600', color: '#666' },
  filterTabTextActive: { color: '#fff' },
  scroll: { flex: 1, padding: 16 },
  sectionBlock: { marginBottom: 16, borderRadius: 20, overflow: 'hidden', borderWidth: 3 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 24 },
  sectionTitleWrap: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  sectionCard: { backgroundColor: '#fff', borderRadius: 16, margin: 4, marginTop: -16, paddingHorizontal: 10, paddingVertical: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: -2 }, elevation: 3 },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#F0F0F0', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2, overflow: 'hidden' },
  thumbWrap: { width: 88, height: 88 },
  thumb: { width: 88, height: 88 },
  thumbPlaceholder: { backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  cardContent: { flex: 1, padding: 12, justifyContent: 'space-between' },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  cardLocation: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', flex: 1 },
  cardTime: { fontSize: 11, color: '#888', flexShrink: 0 },
  linkedChip: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FFF8E1', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 3, marginBottom: 3 },
  linkedChipText: { fontSize: 10, fontWeight: '600', color: '#FF9800' },
  cardNote: { fontSize: 13, color: '#666', lineHeight: 18, marginTop: 2 },
  photosCount: { fontSize: 12, color: '#4CAF50', fontWeight: '600', marginTop: 4 },
  footerDecor: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#888', letterSpacing: 0.4, marginBottom: 6, marginTop: 12 },
  optionalLabel: { fontSize: 11, fontWeight: '400', color: '#BBB' },
  input: { backgroundColor: '#FAFAFA', borderRadius: 12, borderWidth: 0.5, borderColor: '#E0E0E0', paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1A1A1A' },
  textArea: { height: 80, textAlignVertical: 'top' },
  activityChips: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  actChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#EBEBEB' },
  actChipActive: { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' },
  actChipText: { fontSize: 12, fontWeight: '600', color: '#666' },
  actChipTextActive: { color: '#4CAF50' },
  photoUploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#E0E0E0', borderStyle: 'dashed', marginBottom: 4 },
  photoUploadText: { fontSize: 14, fontWeight: '600', color: '#666' },
  suggestions: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#F0F0F0', marginTop: 4, marginBottom: 4, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  suggestionText: { fontSize: 13, color: '#1A1A1A', flex: 1 },
});
