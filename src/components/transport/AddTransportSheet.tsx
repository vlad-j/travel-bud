import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';

interface OptionDef {
  icon: string;
  iconBg: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}

interface ImportOptionDef {
  icon: string;
  title: string;
  subtitle: string;
}

const IMPORT_OPTIONS: ImportOptionDef[] = [
  { icon: '📇', title: 'Scan boarding pass', subtitle: 'Scan QR or barcode' },
  { icon: '📄', title: 'Import PDF', subtitle: 'Import ticket from PDF' },
  { icon: '🖼️', title: 'Import screenshot', subtitle: 'Upload ticket screenshot' },
  { icon: '📧', title: 'Import from email', subtitle: 'Forward email to Travel Buddy' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectFlight: () => void;
  onSelectTransfer: () => void;
  onSelectOther: () => void;
}

export default function AddTransportSheet({ visible, onClose, onSelectFlight, onSelectTransfer, onSelectOther }: Props) {
  const options: OptionDef[] = [
    { icon: '✈️', iconBg: '#E3F2FD', title: 'Add Flight', subtitle: 'Add a flight to your trip', onPress: onSelectFlight },
    { icon: '🚕', iconBg: '#FFE0B2', title: 'Add Transfer', subtitle: 'Taxi, train, bus and more', onPress: onSelectTransfer },
    { icon: '🚌', iconBg: '#E1F5FE', title: 'Add Other Transport', subtitle: 'Ferry, rental car, scooter...', onPress: onSelectOther },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.title}>Add Transport</Text>

          {options.map((opt) => (
            <TouchableOpacity
              key={opt.title}
              style={styles.row}
              onPress={() => { onClose(); opt.onPress(); }}
              activeOpacity={0.8}
            >
              <View style={[styles.iconWrap, { backgroundColor: opt.iconBg }]}>
                <Text style={{ fontSize: 20 }}>{opt.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{opt.title}</Text>
                <Text style={styles.rowSubtitle}>{opt.subtitle}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}

          <View style={styles.importSection}>
            <Text style={styles.importHeader}>IMPORT (COMING SOON)</Text>
            {IMPORT_OPTIONS.map((opt) => (
              <View key={opt.title} style={styles.importRow}>
                <View style={styles.importIconWrap}>
                  <Text style={{ fontSize: 16 }}>{opt.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.importTitle}>{opt.title}</Text>
                  <Text style={styles.importSubtitle}>{opt.subtitle}</Text>
                </View>
                <View style={styles.soonBadge}>
                  <Text style={styles.soonBadgeText}>Soon</Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFF8F0', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 30 },
  handle: { width: 36, height: 4, backgroundColor: '#E5DFD7', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '900', color: '#1A1A1A', marginBottom: 16 },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff',
    borderRadius: 18, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  iconWrap: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  rowSubtitle: { fontSize: 12, color: '#8A817A', marginTop: 2, fontWeight: '600' },
  chevron: { fontSize: 20, color: '#C8BFB5', fontWeight: '300' },

  importSection: { backgroundColor: '#F3F0FF', borderRadius: 18, padding: 14, marginTop: 8, marginBottom: 16 },
  importHeader: { fontSize: 11, fontWeight: '800', color: '#7E57C2', letterSpacing: 0.6, marginBottom: 10 },
  importRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, opacity: 0.65 },
  importIconWrap: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  importTitle: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
  importSubtitle: { fontSize: 11, color: '#8A817A', marginTop: 1, fontWeight: '600' },
  soonBadge: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  soonBadgeText: { fontSize: 10, fontWeight: '800', color: '#7E57C2' },

  cancelBtn: { alignItems: 'center', paddingVertical: 14, backgroundColor: '#F0EBE5', borderRadius: 16 },
  cancelText: { fontSize: 15, fontWeight: '700', color: '#5C5148' },
});
