import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Modal } from 'react-native';

// ─── Category registry — extensible, searchable ───────────────────────────────
export interface ActivityCategoryDef {
  key: string;
  label: string;
  subtitle: string;
  emoji: string;
  color: string;
  bg: string;
}

export const ACTIVITY_CATEGORIES: ActivityCategoryDef[] = [
  { key: 'activity',      label: 'Activity',      subtitle: 'Things to see and do',        emoji: '🎯', color: '#F44336', bg: '#FFEBEE' },
  { key: 'food',          label: 'Food & Drink',   subtitle: 'Restaurants, cafes, street food', emoji: '🍜', color: '#FF9800', bg: '#FFF3E0' },
  { key: 'transport',     label: 'Transport',      subtitle: 'Flights, trains, buses, taxis',  emoji: '🚗', color: '#2196F3', bg: '#E3F2FD' },
  { key: 'flight',        label: 'Flight',         subtitle: 'My flights and details',       emoji: '✈️', color: '#00BCD4', bg: '#E0F7FA' },
  { key: 'accommodation', label: 'Accommodation',  subtitle: 'Hotels, stays, check-ins',     emoji: '🏨', color: '#3F51B5', bg: '#E8EAF6' },
  { key: 'attraction',    label: 'Attraction',     subtitle: 'Landmarks, museums, sights',   emoji: '📸', color: '#1A1A1A', bg: '#F5F5F5' },
  { key: 'shopping',      label: 'Shopping',       subtitle: 'Markets, malls, local finds',  emoji: '🛍️', color: '#E91E63', bg: '#FCE4EC' },
  { key: 'nightlife',     label: 'Nightlife',      subtitle: 'Bars, clubs, live music',      emoji: '🍸', color: '#9C27B0', bg: '#F3E5F5' },
  { key: 'wellness',      label: 'Wellness',       subtitle: 'Spas, massages, yoga',         emoji: '🧘', color: '#E91E63', bg: '#FCE4EC' },
  { key: 'nature',        label: 'Nature',         subtitle: 'Parks, hikes, scenery',        emoji: '🌿', color: '#4CAF50', bg: '#E8F5E9' },
  { key: 'museum',        label: 'Museum',         subtitle: 'Art, history, culture',        emoji: '🏛️', color: '#795548', bg: '#EFEBE9' },
  { key: 'beach',         label: 'Beach',          subtitle: 'Sand, sun, swimming',          emoji: '🏖️', color: '#03A9F4', bg: '#E1F5FE' },
  { key: 'hiking',        label: 'Hiking',         subtitle: 'Trails and trekking',          emoji: '🥾', color: '#795548', bg: '#EFEBE9' },
  { key: 'photography',   label: 'Photography',    subtitle: 'Scenic and photo spots',       emoji: '📷', color: '#607D8B', bg: '#ECEFF1' },
  { key: 'other',         label: 'Other',          subtitle: 'Notes and misc',               emoji: '⚪', color: '#9E9E9E', bg: '#F5F5F5' },
];

export function getActivityCategoryDef(key: string): ActivityCategoryDef {
  return ACTIVITY_CATEGORIES.find(c => c.key === key) ?? ACTIVITY_CATEGORIES.find(c => c.key === 'other')!;
}

interface Props {
  visible: boolean;
  selected: string;
  onSelect: (key: string) => void;
  onClose: () => void;
}

export default function ActivityCategoryPicker({ visible, selected, onSelect, onClose }: Props) {
  const [search, setSearch] = useState('');

  const filtered = ACTIVITY_CATEGORIES.filter(c =>
    c.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Text style={styles.title}>Pick a Category</Text>

          <View style={styles.searchWrap}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search categories"
              placeholderTextColor="#B0A89E"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            <Text style={styles.groupTitle}>Activity Categories</Text>
            {filtered.map(cat => {
              const isSelected = cat.key === selected;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.row, isSelected && { borderColor: '#4CAF50', borderWidth: 1.5, backgroundColor: '#F1F8E9' }]}
                  onPress={() => { onSelect(cat.key); onClose(); }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.iconWrap, { backgroundColor: cat.bg }]}>
                    <Text style={{ fontSize: 18 }}>{cat.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowLabel}>{cat.label}</Text>
                    <Text style={styles.rowSubtitle}>{cat.subtitle}</Text>
                  </View>
                  {isSelected ? (
                    <View style={styles.checkCircle}><Text style={styles.checkMark}>✓</Text></View>
                  ) : (
                    <Text style={styles.chevron}>›</Text>
                  )}
                </TouchableOpacity>
              );
            })}
            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFF8F0', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '88%' },
  handle: { width: 36, height: 4, backgroundColor: '#E5DFD7', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 12 },
  title: { fontSize: 19, fontWeight: '900', color: '#1A1A1A', textAlign: 'center', marginBottom: 16 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, backgroundColor: '#F0EBE5', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 16 },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: 15, color: '#1A1A1A' },
  groupTitle: { fontSize: 13, fontWeight: '800', color: '#1A1A1A', marginHorizontal: 16, marginBottom: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff',
    marginHorizontal: 16, marginBottom: 8, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1.5, borderColor: 'transparent',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  iconWrap: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  rowSubtitle: { fontSize: 11, color: '#8A817A', marginTop: 2, fontWeight: '600' },
  chevron: { fontSize: 20, color: '#C8BFB5', fontWeight: '300' },
  checkCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#4CAF50', alignItems: 'center', justifyContent: 'center' },
  checkMark: { fontSize: 12, color: '#fff', fontWeight: '900' },
});
