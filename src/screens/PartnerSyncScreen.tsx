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
import { Sparkle, Dot, Cloud, DottedLine } from '../components/TravelDecorations';

const SHARED_ACTIVITIES = [
  { id: '1', time: '08:00', title: 'Borobudur Temple', icon: '🛕', iconBg: '#E8F5E9', shared: true },
  { id: '2', time: '13:30', title: 'Lunch at Jejamuran', icon: '🍜', iconBg: '#FFF3E0', shared: true },
  { id: '3', time: '16:00', title: 'Transfer to Airport', icon: '🚗', iconBg: '#E3F2FD', shared: true },
];

const PERSONAL_ACTIVITIES = [
  { id: '4', time: '10:00', title: 'Souvenir shopping', icon: '🛍️', iconBg: '#FCE4EC', shared: false, by: 'Raul' },
  { id: '5', time: '07:30', title: 'Morning run', icon: '🏃', iconBg: '#E8F5E9', shared: false, by: 'Vlad' },
];

export default function PartnerSyncScreen() {
  const navigation = useNavigation();
  const [showShared, setShowShared] = useState(true);
  const [liveLocation, setLiveLocation] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(true);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Partner Sync</Text>
        <TouchableOpacity><Text style={{ fontSize: 22 }}>⋯</Text></TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Traveler pair */}
        <View style={styles.pairCard}>
          <View style={styles.travelerBlock}>
            <View style={[styles.travelerAvatar, { backgroundColor: '#FFF9C4', borderColor: '#FFD600' }]}>
              <Text style={{ fontSize: 32 }}>👨</Text>
            </View>
            <Text style={styles.travelerName}>Vlad</Text>
            <View style={styles.onlineIndicator}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
            <Text style={styles.lastSeen}>Yogyakarta</Text>
          </View>

          {/* Sync animation */}
          <View style={styles.syncMiddle}>
            <DottedLine color={syncEnabled ? '#4CAF50' : '#CCC'} />
            <View style={[styles.syncIcon, { backgroundColor: syncEnabled ? '#E8F5E9' : '#F5F5F5' }]}>
              <Text style={{ fontSize: 20 }}>🔄</Text>
            </View>
            <DottedLine color={syncEnabled ? '#4CAF50' : '#CCC'} />
            {syncEnabled && (
              <Text style={styles.syncLabel}>Synced 2m ago</Text>
            )}
          </View>

          <View style={styles.travelerBlock}>
            <View style={[styles.travelerAvatar, { backgroundColor: '#E3F2FD', borderColor: '#42A5F5' }]}>
              <Text style={{ fontSize: 32 }}>🧑</Text>
            </View>
            <Text style={styles.travelerName}>Raul</Text>
            <View style={[styles.onlineIndicator, { backgroundColor: '#FFF3E0' }]}>
              <View style={[styles.onlineDot, { backgroundColor: '#FF9800' }]} />
              <Text style={[styles.onlineText, { color: '#FF9800' }]}>Away</Text>
            </View>
            <Text style={styles.lastSeen}>Last seen 15m ago</Text>
          </View>
        </View>

        {/* Sync settings */}
        <View style={styles.section}>
          <View style={styles.sectionLabel}>
            <Sparkle color="#FF9800" size={12} style={{ position: 'relative', marginRight: 4 }} />
            <Text style={styles.sectionLabelText}>SYNC SETTINGS</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <Text style={{ fontSize: 18, marginRight: 12 }}>🔄</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>Real-time sync</Text>
                <Text style={styles.toggleSub}>Keep activities in sync with Raul</Text>
              </View>
              <Switch
                value={syncEnabled}
                onValueChange={setSyncEnabled}
                trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
                thumbColor={syncEnabled ? '#4CAF50' : '#f4f3f4'}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.toggleRow}>
              <Text style={{ fontSize: 18, marginRight: 12 }}>📍</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>Live location sharing</Text>
                <Text style={styles.toggleSub}>Share your location with Raul</Text>
              </View>
              <Switch
                value={liveLocation}
                onValueChange={setLiveLocation}
                trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
                thumbColor={liveLocation ? '#4CAF50' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* Activity toggle */}
        <View style={styles.section}>
          <View style={styles.sectionLabel}>
            <Cloud size={14} style={{ position: 'relative', marginRight: 4 }} />
            <Text style={styles.sectionLabelText}>ACTIVITIES</Text>
          </View>
          <View style={styles.activityToggleRow}>
            <TouchableOpacity
              style={[styles.activityToggleBtn, showShared && styles.activityToggleBtnActive]}
              onPress={() => setShowShared(true)}
            >
              <Text style={[styles.activityToggleText, showShared && styles.activityToggleTextActive]}>
                Shared ({SHARED_ACTIVITIES.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.activityToggleBtn, !showShared && styles.activityToggleBtnActive]}
              onPress={() => setShowShared(false)}
            >
              <Text style={[styles.activityToggleText, !showShared && styles.activityToggleTextActive]}>
                Personal ({PERSONAL_ACTIVITIES.length})
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            {(showShared ? SHARED_ACTIVITIES : PERSONAL_ACTIVITIES).map((act, index, arr) => (
              <View key={act.id}>
                <View style={styles.actRow}>
                  <Text style={styles.actTime}>{act.time}</Text>
                  <View style={[styles.actIconBg, { backgroundColor: act.iconBg }]}>
                    <Text style={{ fontSize: 18 }}>{act.icon}</Text>
                  </View>
                  <View style={styles.actInfo}>
                    <Text style={styles.actTitle}>{act.title}</Text>
                    {!showShared && 'by' in act && (
                      <Text style={styles.actBy}>by {String(act.by)}</Text>
                    )}
                  </View>
                  {showShared ? (
                    <View style={styles.sharedBadge}>
                      <Text style={styles.sharedBadgeText}>👥 Both</Text>
                    </View>
                  ) : (
                    <View style={styles.personalBadge}>
                      <Text style={styles.personalBadgeText}>👤 Personal</Text>
                    </View>
                  )}
                </View>
                {index < arr.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        {/* Ping / message */}
        <View style={styles.section}>
          <View style={styles.sectionLabel}>
            <Text style={{ fontSize: 14, marginRight: 4 }}>💬</Text>
            <Text style={styles.sectionLabelText}>QUICK ACTIONS</Text>
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={{ fontSize: 24 }}>📍</Text>
              <Text style={styles.actionBtnText}>Share location</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={{ fontSize: 24 }}>👋</Text>
              <Text style={styles.actionBtnText}>Ping Raul</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={{ fontSize: 24 }}>💬</Text>
              <Text style={styles.actionBtnText}>Send message</Text>
            </TouchableOpacity>
          </View>
        </View>

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

  pairCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  travelerBlock: { flex: 1, alignItems: 'center', gap: 6 },
  travelerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
  },
  travelerName: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  onlineDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#4CAF50' },
  onlineText: { fontSize: 11, fontWeight: '700', color: '#4CAF50' },
  lastSeen: { fontSize: 11, color: '#888', textAlign: 'center' },

  syncMiddle: { flex: 1, alignItems: 'center', gap: 4 },
  syncIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  syncLabel: { fontSize: 9, color: '#4CAF50', fontWeight: '600', textAlign: 'center' },

  section: { marginBottom: 8 },
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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

  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  toggleSub: { fontSize: 12, color: '#888', marginTop: 2 },

  activityToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  activityToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  activityToggleBtnActive: { backgroundColor: '#4CAF50' },
  activityToggleText: { fontSize: 13, fontWeight: '600', color: '#666' },
  activityToggleTextActive: { color: '#fff' },

  actRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  actTime: { width: 44, fontSize: 12, fontWeight: '700', color: '#666' },
  actIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actInfo: { flex: 1 },
  actTitle: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  actBy: { fontSize: 11, color: '#888', marginTop: 2 },
  sharedBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sharedBadgeText: { fontSize: 11, fontWeight: '700', color: '#4CAF50' },
  personalBadge: {
    backgroundColor: '#EDE7F6',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  personalBadgeText: { fontSize: 11, fontWeight: '700', color: '#9C27B0' },

  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  actionBtnText: { fontSize: 11, fontWeight: '600', color: '#555', textAlign: 'center' },

  footerDecor: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
});
