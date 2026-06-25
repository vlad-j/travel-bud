import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Sparkle, Dot } from '../components/TravelDecorations';
import CartoonIcon from '../components/CartoonIcon';

const OFFLINE_ITEMS = [
  {
    id: '1',
    icon: '✈️',
    iconBg: '#E3F2FD',
    category: 'Flights',
    items: 2,
    size: '1.2 MB',
    downloaded: true,
    lastSync: '2 min ago',
  },
  {
    id: '2',
    icon: '🏨',
    iconBg: '#F3E5F5',
    category: 'Hotels',
    items: 3,
    size: '0.8 MB',
    downloaded: true,
    lastSync: '5 min ago',
  },
  {
    id: '3',
    icon: '📁',
    iconBg: '#E8F5E9',
    category: 'Documents',
    items: 5,
    size: '4.3 MB',
    downloaded: true,
    lastSync: '10 min ago',
  },
  {
    id: '4',
    icon: '🗺️',
    iconBg: '#FFF3E0',
    category: 'Maps',
    items: 4,
    size: '28.7 MB',
    downloaded: false,
    lastSync: 'Not downloaded',
  },
  {
    id: '5',
    icon: '🎒',
    iconBg: '#FCE4EC',
    category: 'Packing list',
    items: 1,
    size: '0.1 MB',
    downloaded: true,
    lastSync: 'Just now',
  },
  {
    id: '6',
    icon: '💰',
    iconBg: '#FFF8E1',
    category: 'Budget & expenses',
    items: 24,
    size: '0.4 MB',
    downloaded: true,
    lastSync: '1 min ago',
  },
];

export default function OfflineCenterScreen() {
  const navigation = useNavigation();
  const [autoSync, setAutoSync] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [downloadStates, setDownloadStates] = useState<Record<string, boolean>>(
    Object.fromEntries(OFFLINE_ITEMS.map((item) => [item.id, item.downloaded]))
  );

  const totalDownloaded = OFFLINE_ITEMS.filter((i) => downloadStates[i.id]).length;
  const totalSize = '34.8 MB';

  const toggleDownload = (id: string) => {
    setDownloadStates((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Offline Center</Text>
        <TouchableOpacity><Text style={{ fontSize: 22 }}>⋯</Text></TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Status banner */}
        <View style={styles.statusBanner}>
          <View style={styles.statusLeft}>
            <View style={styles.statusDot} />
            <View>
              <Text style={styles.statusTitle}>Ready for offline</Text>
              <Text style={styles.statusSubtitle}>{totalDownloaded} of {OFFLINE_ITEMS.length} categories saved</Text>
            </View>
          </View>
          <View style={styles.syncChip}>
            <Text style={styles.syncIcon}>🔄</Text>
            <Text style={styles.syncText}>Synced</Text>
          </View>
        </View>

        {/* Summary stats */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryIcon}>📦</Text>
            <Text style={styles.summaryValue}>{totalDownloaded}</Text>
            <Text style={styles.summaryLabel}>Categories</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryIcon}>💾</Text>
            <Text style={styles.summaryValue}>{totalSize}</Text>
            <Text style={styles.summaryLabel}>Storage used</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryIcon}>🕐</Text>
            <Text style={styles.summaryValue}>2m</Text>
            <Text style={styles.summaryLabel}>Last synced</Text>
          </View>
        </View>

        {/* Offline toggles */}
        <View style={styles.section}>
          <View style={styles.sectionLabel}>
            <Text style={{ fontSize: 14, marginRight: 4 }}>⚙️</Text>
            <Text style={styles.sectionLabelText}>SYNC SETTINGS</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <Text style={{ fontSize: 18, marginRight: 12 }}>🔄</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>Auto-sync</Text>
                <Text style={styles.toggleSub}>Sync when on WiFi</Text>
              </View>
              <Switch
                value={autoSync}
                onValueChange={setAutoSync}
                trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
                thumbColor={autoSync ? '#4CAF50' : '#f4f3f4'}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.toggleRow}>
              <Text style={{ fontSize: 18, marginRight: 12 }}>✈️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>Offline mode</Text>
                <Text style={styles.toggleSub}>Disable all network requests</Text>
              </View>
              <Switch
                value={offlineMode}
                onValueChange={setOfflineMode}
                trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
                thumbColor={offlineMode ? '#4CAF50' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* Downloaded content */}
        <View style={styles.section}>
          <View style={styles.sectionLabel}>
            <Sparkle color="#FF9800" size={12} style={{ position: 'relative', marginRight: 4 }} />
            <Text style={styles.sectionLabelText}>DOWNLOADED CONTENT</Text>
          </View>
          <View style={styles.card}>
            {OFFLINE_ITEMS.map((item, index) => {
              const isDown = downloadStates[item.id];
              return (
                <View key={item.id}>
                  <View style={[styles.offlineRow, !isDown && { opacity: 0.6 }]}>
                    <CartoonIcon emoji={item.icon} bg={item.iconBg} size={44} />
                    <View style={styles.offlineInfo}>
                      <Text style={styles.offlineCategory}>{item.category}</Text>
                      <Text style={styles.offlineMeta}>{item.items} items · {item.size}</Text>
                      <View style={styles.offlineStatusRow}>
                        <View style={[styles.offlineStatusDot, { backgroundColor: isDown ? '#4CAF50' : '#9E9E9E' }]} />
                        <Text style={[styles.offlineStatusText, { color: isDown ? '#4CAF50' : '#9E9E9E' }]}>
                          {isDown ? item.lastSync : 'Not downloaded'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.downloadBtn, isDown && styles.downloadBtnActive]}
                      onPress={() => toggleDownload(item.id)}
                    >
                      <Text style={[styles.downloadBtnText, isDown && styles.downloadBtnTextActive]}>
                        {isDown ? '✓ Saved' : '⬇ Save'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {index < OFFLINE_ITEMS.length - 1 && <View style={styles.divider} />}
                </View>
              );
            })}
          </View>
        </View>

        {/* Download all button */}
        <TouchableOpacity style={styles.downloadAllBtn}>
          <Text style={{ fontSize: 18 }}>⬇️</Text>
          <Text style={styles.downloadAllText}>Download everything</Text>
        </TouchableOpacity>

        {/* Clear cache */}
        <TouchableOpacity style={styles.clearBtn}>
          <Text style={{ fontSize: 18 }}>🗑️</Text>
          <Text style={styles.clearText}>Clear offline data</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footerDecor}>
          <Dot color="#DDD" size={5} style={{ position: 'relative' }} />
          <Dot color="#DDD" size={4} style={{ position: 'relative', marginLeft: 8 }} />
          <Sparkle color="#FF9800" size={10} style={{ position: 'relative', marginLeft: 6 }} />
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: { padding: 4 },
  backIcon: { fontSize: 28, color: '#1A1A1A', fontWeight: '300' },
  title: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  scroll: { flex: 1, padding: 16 },

  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#4CAF50' },
  statusTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  statusSubtitle: { fontSize: 12, color: '#666', marginTop: 2 },
  syncChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  syncIcon: { fontSize: 14 },
  syncText: { fontSize: 12, fontWeight: '600', color: '#4CAF50' },

  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  summaryIcon: { fontSize: 20, marginBottom: 4 },
  summaryValue: { fontSize: 14, fontWeight: '800', color: '#1A1A1A' },
  summaryLabel: { fontSize: 10, color: '#888', marginTop: 2, textAlign: 'center' },

  section: { marginBottom: 8 },
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  sectionLabelText: { fontSize: 12, fontWeight: '700', color: '#888', letterSpacing: 0.8 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  divider: { height: 1, backgroundColor: '#F5F5F5' },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  toggleSub: { fontSize: 12, color: '#888', marginTop: 2 },

  offlineRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  offlineInfo: { flex: 1 },
  offlineCategory: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  offlineMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  offlineStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  offlineStatusDot: { width: 6, height: 6, borderRadius: 3 },
  offlineStatusText: { fontSize: 11, fontWeight: '600' },
  downloadBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#4CAF50',
  },
  downloadBtnActive: { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' },
  downloadBtnText: { fontSize: 12, fontWeight: '700', color: '#4CAF50' },
  downloadBtnTextActive: { color: '#4CAF50' },

  downloadAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 10,
    shadowColor: '#4CAF50',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  downloadAllText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FFCDD2',
    backgroundColor: '#FFF5F5',
  },
  clearText: { fontSize: 14, fontWeight: '600', color: '#F44336' },

  footerDecor: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
});
