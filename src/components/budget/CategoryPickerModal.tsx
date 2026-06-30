import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Modal } from 'react-native';

// ─── Category registry — extensible, grouped, searchable ─────────────────────
export interface CategoryDef {
  key: string;
  label: string;
  emoji: string;
  color: string;
  bg: string;
}

export const EXPENSE_CATEGORY_GROUPS: { title: string; items: CategoryDef[] }[] = [
  {
    title: 'Expenses',
    items: [
      { key: 'food', label: 'Food', emoji: '🍜', color: '#FF9800', bg: '#FFF3E0' },
      { key: 'coffee', label: 'Coffee', emoji: '☕', color: '#795548', bg: '#EFEBE9' },
      { key: 'drinks', label: 'Drinks', emoji: '🍷', color: '#9C27B0', bg: '#F3E5F5' },
      { key: 'groceries', label: 'Groceries', emoji: '🛒', color: '#2196F3', bg: '#E3F2FD' },
      { key: 'transport', label: 'Transport', emoji: '🚗', color: '#F44336', bg: '#FFEBEE' },
      { key: 'flight', label: 'Flights', emoji: '✈️', color: '#00BCD4', bg: '#E0F7FA' },
      { key: 'accommodation', label: 'Accommodation', emoji: '🏨', color: '#3F51B5', bg: '#E8EAF6' },
      { key: 'activity', label: 'Activities', emoji: '🏃', color: '#4CAF50', bg: '#E8F5E9' },
      { key: 'attraction', label: 'Attractions', emoji: '🗽', color: '#009688', bg: '#E0F2F1' },
      { key: 'shopping', label: 'Shopping', emoji: '🛍️', color: '#E91E63', bg: '#FCE4EC' },
      { key: 'exchange_fees', label: 'Exchange Fees', emoji: '💱', color: '#673AB7', bg: '#EDE7F6' },
      { key: 'atm_fees', label: 'ATM Fees', emoji: '🏧', color: '#607D8B', bg: '#ECEFF1' },
      { key: 'laundry', label: 'Laundry', emoji: '🧺', color: '#03A9F4', bg: '#E1F5FE' },
      { key: 'other', label: 'Other', emoji: '⚪', color: '#9E9E9E', bg: '#F5F5F5' },
    ],
  },
  {
    title: 'Income',
    items: [
      { key: 'other_income', label: 'Other Income', emoji: '💴', color: '#FF9800', bg: '#FFF3E0' },
      { key: 'salary', label: 'Salary', emoji: '🏦', color: '#4CAF50', bg: '#E8F5E9' },
      { key: 'gifts', label: 'Gifts', emoji: '🎁', color: '#9C27B0', bg: '#F3E5F5' },
    ],
  },
];

export function getCategoryDef(key: string): CategoryDef {
  for (const group of EXPENSE_CATEGORY_GROUPS) {
    const found = group.items.find(c => c.key === key);
    if (found) return found;
  }
  return EXPENSE_CATEGORY_GROUPS[0].items.find(c => c.key === 'other')!;
}

interface Props {
  visible: boolean;
  selected: string;
  onSelect: (key: string) => void;
  onClose: () => void;
}

export default function CategoryPickerModal({ visible, selected, onSelect, onClose }: Props) {
  const [search, setSearch] = useState('');

  const filteredGroups = EXPENSE_CATEGORY_GROUPS.map(group => ({
    ...group,
    items: group.items.filter(c => c.label.toLowerCase().includes(search.toLowerCase())),
  })).filter(group => group.items.length > 0);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Pick a Category</Text>
            <View style={{ width: 24 }} />
          </View>

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
            {filteredGroups.map(group => (
              <View key={group.title} style={{ marginBottom: 8 }}>
                <Text style={styles.groupTitle}>{group.title}</Text>
                {group.items.map(cat => {
                  const isSelected = cat.key === selected;
                  return (
                    <TouchableOpacity
                      key={cat.key}
                      style={[styles.row, isSelected && { borderColor: cat.color, borderWidth: 1.5 }]}
                      onPress={() => { onSelect(cat.key); onClose(); }}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.iconWrap, { backgroundColor: cat.bg }]}>
                        <Text style={{ fontSize: 18 }}>{cat.emoji}</Text>
                      </View>
                      <Text style={styles.rowLabel}>{cat.label}</Text>
                      {isSelected ? (
                        <Text style={[styles.check, { color: cat.color }]}>✓</Text>
                      ) : (
                        <Text style={styles.chevron}>›</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFF8F0', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '90%' },
  handle: { width: 36, height: 4, backgroundColor: '#E5DFD7', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  closeIcon: { fontSize: 18, color: '#1A1A1A' },
  title: { fontSize: 17, fontWeight: '800', color: '#1A1A1A' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, backgroundColor: '#F0EBE5', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 16 },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: 15, color: '#1A1A1A' },
  groupTitle: { fontSize: 13, fontWeight: '800', color: '#1A1A1A', marginHorizontal: 16, marginBottom: 8, marginTop: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff',
    marginHorizontal: 16, marginBottom: 8, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  iconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  chevron: { fontSize: 20, color: '#C8BFB5', fontWeight: '300' },
  check: { fontSize: 16, fontWeight: '900' },
});
