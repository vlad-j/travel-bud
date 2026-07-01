import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Modal } from 'react-native';
import { PACKING_CATEGORIES } from '../../lib/packingCategories';

interface Props {
  visible: boolean;
  selected: string;
  onSelect: (key: string) => void;
  onClose: () => void;
}

export default function PackingCategoryPicker({ visible, selected, onSelect, onClose }: Props) {
  const [search, setSearch] = useState('');

  const filtered = PACKING_CATEGORIES.filter((c) =>
    c.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <TouchableOpacity onPress={onClose} style={styles.backBtn}>
              <Text style={styles.backIcon}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Pick a Category</Text>
            <View style={{ width: 32 }} />
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
            {filtered.map((cat) => {
              const isSelected = cat.key === selected;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.row, isSelected && styles.rowSelected]}
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
  handle: { width: 36, height: 4, backgroundColor: '#E5DFD7', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, marginBottom: 8 },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 26, color: '#1A1A1A', fontWeight: '300' },
  title: { fontSize: 17, fontWeight: '900', color: '#1A1A1A', textAlign: 'center' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, backgroundColor: '#F0EBE5', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 12 },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: 15, color: '#1A1A1A' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff',
    marginHorizontal: 16, marginBottom: 8, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1.5, borderColor: 'transparent',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  rowSelected: { borderColor: '#4CAF50', backgroundColor: '#F1F8E9' },
  iconWrap: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  rowSubtitle: { fontSize: 11, color: '#8A817A', marginTop: 2, fontWeight: '600' },
  chevron: { fontSize: 20, color: '#C8BFB5', fontWeight: '300' },
  checkCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#4CAF50', alignItems: 'center', justifyContent: 'center' },
  checkMark: { fontSize: 12, color: '#fff', fontWeight: '900' },
});
