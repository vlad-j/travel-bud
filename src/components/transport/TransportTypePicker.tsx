import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Modal } from 'react-native';
import { getTransportTypeMeta } from './TransportCard';

export const TRANSFER_TYPES: { key: string; subtitle: string }[] = [
  { key: 'Taxi', subtitle: 'Metered or app-based cab' },
  { key: 'Grab', subtitle: 'Ride-hailing app' },
  { key: 'Bolt', subtitle: 'Ride-hailing app' },
  { key: 'Train', subtitle: 'Rail travel' },
  { key: 'Bus', subtitle: 'Coach or city bus' },
  { key: 'Metro', subtitle: 'Subway or underground' },
  { key: 'Boat', subtitle: 'Local boat crossing' },
  { key: 'Ferry', subtitle: 'Longer boat journey' },
  { key: 'Rental Car', subtitle: 'Self-drive rental' },
  { key: 'Scooter', subtitle: 'Rental scooter' },
  { key: 'Motorbike', subtitle: 'Rental motorbike' },
  { key: 'Bicycle', subtitle: 'Rental or personal bike' },
  { key: 'Walk', subtitle: 'On foot' },
  { key: 'Other', subtitle: 'Something else' },
];

interface Props {
  visible: boolean;
  selected: string;
  onSelect: (key: string) => void;
  onClose: () => void;
}

export default function TransportTypePicker({ visible, selected, onSelect, onClose }: Props) {
  const [search, setSearch] = useState('');

  const filtered = TRANSFER_TYPES.filter((t) => t.key.toLowerCase().includes(search.toLowerCase()));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <TouchableOpacity onPress={onClose} style={styles.backBtn}>
              <Text style={styles.backIcon}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Pick a Type</Text>
            <View style={{ width: 32 }} />
          </View>

          <View style={styles.searchWrap}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search types"
              placeholderTextColor="#B0A89E"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            {filtered.map((t) => {
              const meta = getTransportTypeMeta(t.key);
              const isSelected = t.key === selected;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.row, isSelected && styles.rowSelected]}
                  onPress={() => { onSelect(t.key); onClose(); }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
                    <Text style={{ fontSize: 18 }}>{meta.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowLabel}>{t.key}</Text>
                    <Text style={styles.rowSubtitle}>{t.subtitle}</Text>
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
