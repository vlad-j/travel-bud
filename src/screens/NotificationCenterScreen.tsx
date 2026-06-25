import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Sparkle, Dot } from '../components/TravelDecorations';

interface Notification {
  id: string;
  type: 'flight' | 'checkin' | 'budget' | 'partner' | 'activity' | 'document';
  icon: string;
  iconBg: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  accentColor: string;
}

const NOTIFICATIONS_TODAY: Notification[] = [
  {
    id: '1', type: 'flight', icon: '✈️', iconBg: '#E3F2FD',
    title: 'Boarding in 2 hours', body: 'GA408 Yogyakarta → Bali departs at 18:20. Gate 3, Terminal 1.',
    time: '16:15', read: false, accentColor: '#2196F3',
  },
  {
    id: '2', type: 'activity', icon: '🍜', iconBg: '#FFF3E0',
    title: 'Activity starting soon', body: 'Lunch at Jejamuran starts in 30 minutes.',
    time: '13:00', read: false, accentColor: '#FF9800',
  },
  {
    id: '3', type: 'budget', icon: '💸', iconBg: '#FFF3E0',
    title: 'Budget alert — 80% reached', body: 'You\'ve spent €1,240 of your €2,000 budget (62%). You\'re on track!',
    time: '11:30', read: false, accentColor: '#FF9800',
  },
  {
    id: '4', type: 'partner', icon: '🧑', iconBg: '#E3F2FD',
    title: 'Raul added an expense', body: 'Raul added "Taxi to Temple — €8" to the shared expenses.',
    time: '09:15', read: true, accentColor: '#42A5F5',
  },
];

const NOTIFICATIONS_YESTERDAY: Notification[] = [
  {
    id: '5', type: 'checkin', icon: '🏨', iconBg: '#F3E5F5',
    title: 'Check-in reminder', body: 'Hotel Yogyakarta check-in is today at 15:00. Have your booking ref ready: HY-98765.',
    time: '08:00', read: true, accentColor: '#9C27B0',
  },
  {
    id: '6', type: 'partner', icon: '🧑', iconBg: '#E3F2FD',
    title: 'Raul added an activity', body: 'Raul added "Prambanan Temple" to your Day 7 itinerary.',
    time: '07:45', read: true, accentColor: '#42A5F5',
  },
];

const NOTIFICATIONS_EARLIER: Notification[] = [
  {
    id: '7', type: 'document', icon: '📋', iconBg: '#FFF8E1',
    title: 'Document expiry warning', body: 'Your Indonesia E-Visa expires in 14 days. Make sure it covers your full trip.',
    time: 'May 14', read: true, accentColor: '#FF9800',
  },
  {
    id: '8', type: 'flight', icon: '✈️', iconBg: '#E3F2FD',
    title: 'Flight check-in open', body: 'Online check-in for GA408 is now open. Seat 14A is reserved for you.',
    time: 'May 15', read: true, accentColor: '#2196F3',
  },
  {
    id: '9', type: 'budget', icon: '💰', iconBg: '#E8F5E9',
    title: 'Daily spending recap', body: 'Yesterday you spent €47. Running total: €1,193.',
    time: 'May 15', read: true, accentColor: '#4CAF50',
  },
];

function SectionBlock({ title, headerColor, textColor, icon, children }: {
  title: string; headerColor: string; textColor: string; icon: string; children: React.ReactNode;
}) {
  return (
    <View style={[styles.sectionBlock, { backgroundColor: headerColor, borderColor: headerColor }]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleWrap}>
          <Text style={{ fontSize: 14, marginRight: 6 }}>{icon}</Text>
          <Text style={[styles.sectionTitle, { color: textColor }]}>{title}</Text>
        </View>
      </View>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

export default function NotificationCenterScreen() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState({
    today: NOTIFICATIONS_TODAY,
    yesterday: NOTIFICATIONS_YESTERDAY,
    earlier: NOTIFICATIONS_EARLIER,
  });

  const unreadCount = notifications.today.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => ({
      today: prev.today.map((n) => ({ ...n, read: true })),
      yesterday: prev.yesterday,
      earlier: prev.earlier,
    }));
  };

  const markRead = (id: string) => {
    setNotifications((prev) => ({
      ...prev,
      today: prev.today.map((n) => n.id === id ? { ...n, read: true } : n),
    }));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}><Text style={styles.unreadBadgeText}>{unreadCount}</Text></View>
          )}
        </View>
        <TouchableOpacity onPress={markAllRead}>
          <Text style={styles.markAllText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <SectionBlock title="TODAY" headerColor="#C8E6C9" textColor="#1B5E20" icon="🌅">
          {notifications.today.map((notif, index) => (
            <View key={notif.id}>
              <TouchableOpacity style={[styles.notifRow, !notif.read && styles.notifRowUnread]} onPress={() => markRead(notif.id)} activeOpacity={0.7}>
                <View style={[styles.notifIconBg, { backgroundColor: notif.iconBg }]}>
                  <Text style={{ fontSize: 22 }}>{notif.icon}</Text>
                </View>
                <View style={styles.notifContent}>
                  <View style={styles.notifTitleRow}>
                    <Text style={styles.notifTitle} numberOfLines={1}>{notif.title}</Text>
                    <Text style={styles.notifTime}>{notif.time}</Text>
                  </View>
                  <Text style={styles.notifBody} numberOfLines={2}>{notif.body}</Text>
                </View>
                {!notif.read && <View style={[styles.unreadDot, { backgroundColor: notif.accentColor }]} />}
              </TouchableOpacity>
              {index < notifications.today.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </SectionBlock>

        <SectionBlock title="YESTERDAY" headerColor="#FFE082" textColor="#E65100" icon="📅">
          {notifications.yesterday.map((notif, index) => (
            <View key={notif.id}>
              <TouchableOpacity style={styles.notifRow} onPress={() => {}} activeOpacity={0.7}>
                <View style={[styles.notifIconBg, { backgroundColor: notif.iconBg }]}>
                  <Text style={{ fontSize: 22 }}>{notif.icon}</Text>
                </View>
                <View style={styles.notifContent}>
                  <View style={styles.notifTitleRow}>
                    <Text style={styles.notifTitle} numberOfLines={1}>{notif.title}</Text>
                    <Text style={styles.notifTime}>{notif.time}</Text>
                  </View>
                  <Text style={styles.notifBody} numberOfLines={2}>{notif.body}</Text>
                </View>
              </TouchableOpacity>
              {index < notifications.yesterday.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </SectionBlock>

        <SectionBlock title="EARLIER" headerColor="#90CAF9" textColor="#0D47A1" icon="📜">
          {notifications.earlier.map((notif, index) => (
            <View key={notif.id}>
              <TouchableOpacity style={styles.notifRow} onPress={() => {}} activeOpacity={0.7}>
                <View style={[styles.notifIconBg, { backgroundColor: notif.iconBg }]}>
                  <Text style={{ fontSize: 22 }}>{notif.icon}</Text>
                </View>
                <View style={styles.notifContent}>
                  <View style={styles.notifTitleRow}>
                    <Text style={styles.notifTitle} numberOfLines={1}>{notif.title}</Text>
                    <Text style={styles.notifTime}>{notif.time}</Text>
                  </View>
                  <Text style={styles.notifBody} numberOfLines={2}>{notif.body}</Text>
                </View>
              </TouchableOpacity>
              {index < notifications.earlier.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </SectionBlock>

        <TouchableOpacity style={styles.settingsShortcut}>
          <Text style={{ fontSize: 18 }}>⚙️</Text>
          <Text style={styles.settingsShortcutText}>Notification settings</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <View style={styles.footerDecor}>
          <Dot color="#BBB" size={5} style={{ position: 'relative' }} />
          <Dot color="#BBB" size={4} style={{ position: 'relative', marginLeft: 8 }} />
          <Sparkle color="#FF9800" size={10} style={{ position: 'relative', marginLeft: 6 }} />
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#E8E8E8' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  backBtn: { padding: 4 },
  backIcon: { fontSize: 28, color: '#1A1A1A', fontWeight: '300' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  unreadBadge: { backgroundColor: '#FF5252', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, minWidth: 20, alignItems: 'center' },
  unreadBadgeText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  markAllText: { fontSize: 13, fontWeight: '600', color: '#4CAF50' },
  scroll: { flex: 1, padding: 16 },

  sectionBlock: { marginBottom: 14, borderRadius: 20, overflow: 'hidden', borderWidth: 3 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 24 },
  sectionTitleWrap: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  sectionCard: { backgroundColor: '#fff', borderRadius: 16, margin: 4, marginTop: -16, paddingHorizontal: 10, paddingVertical: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: -2 }, elevation: 3 },

  divider: { height: 1, backgroundColor: '#F5F5F5' },

  notifRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, gap: 12, borderRadius: 10 },
  notifRowUnread: { backgroundColor: '#FAFFF8' },
  notifIconBg: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifContent: { flex: 1 },
  notifTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, gap: 8 },
  notifTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', flex: 1 },
  notifTime: { fontSize: 11, color: '#888', flexShrink: 0 },
  notifBody: { fontSize: 13, color: '#666', lineHeight: 18 },
  unreadDot: { width: 9, height: 9, borderRadius: 4.5, marginTop: 8, flexShrink: 0 },

  settingsShortcut: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#F0F0F0' },
  settingsShortcutText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  chevron: { fontSize: 22, color: '#CCC', fontWeight: '300' },

  footerDecor: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
});
