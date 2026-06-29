import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Sparkle, Dot } from '../components/TravelDecorations';
import { useStatusBarHeight } from '../../hooks/useStatusBarHeight';
import { supabase } from '../lib/supabase';
import { currentTripIdRef } from '../context/TripContext';

interface AppNotification {
  id: string;
  type: 'flight' | 'checkin' | 'checkout' | 'budget' | 'activity' | 'document' | 'journal' | 'member';
  icon: string;
  iconBg: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  accentColor: string;
  date: string; // for grouping
}

// ─── Notification generators ──────────────────────────────────────────────────

function localDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getTodayStr() {
  const now = new Date();
  return localDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
}

function getTomorrowStr() {
  const now = new Date();
  return localDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

async function generateNotifications(tripId: string, currency: string): Promise<AppNotification[]> {
  const today = getTodayStr();
  const tomorrow = getTomorrowStr();
  const now = new Date();
  const notifications: AppNotification[] = [];

  const [transportRes, accommodationRes, expensesRes, journalRes, membersRes, tripRes] = await Promise.all([
    supabase.from('transport').select('*').eq('trip_id', tripId).order('departure_time', { ascending: true }),
    supabase.from('accommodations').select('*').eq('trip_id', tripId),
    supabase.from('expenses').select('amount, date').eq('trip_id', tripId),
    supabase.from('journal_entries').select('id, date').eq('trip_id', tripId).gte('date', `${today}T00:00:00`),
    supabase.from('trip_members').select('user_id, role, created_at, profiles:user_id(name, email)').eq('trip_id', tripId).order('created_at', { ascending: false }),
    supabase.from('trips').select('budget, name').eq('id', tripId).single(),
  ]);

  const transport = transportRes.data ?? [];
  const accommodations = accommodationRes.data ?? [];
  const expenses = expensesRes.data ?? [];
  const journalToday = journalRes.data ?? [];
  const members = membersRes.data ?? [];
  const trip = tripRes.data;

  // ── Flight today ──
  const flightToday = transport.find(t => t.type === 'Flight' && t.departure_time?.startsWith(today));
  if (flightToday) {
    const time = formatTime(flightToday.departure_time);
    notifications.push({
      id: `flight-today-${flightToday.id}`,
      type: 'flight',
      icon: '✈️', iconBg: '#E3F2FD', accentColor: '#2196F3',
      title: `Flight today${time ? ` at ${time}` : ''}`,
      body: `${flightToday.departure_location} → ${flightToday.arrival_location}${flightToday.flight_number ? ` · ${flightToday.flight_number}` : ''}`,
      time: time || 'Today',
      read: false,
      date: today,
    });
  }

  // ── Flight tomorrow ──
  const flightTomorrow = transport.find(t => t.type === 'Flight' && t.departure_time?.startsWith(tomorrow));
  if (flightTomorrow) {
    const time = formatTime(flightTomorrow.departure_time);
    notifications.push({
      id: `flight-tomorrow-${flightTomorrow.id}`,
      type: 'flight',
      icon: '✈️', iconBg: '#E3F2FD', accentColor: '#2196F3',
      title: `Flight tomorrow${time ? ` at ${time}` : ''}`,
      body: `${flightTomorrow.departure_location} → ${flightTomorrow.arrival_location} · Have your documents ready`,
      time: 'Tomorrow',
      read: false,
      date: today,
    });
  }

  // ── Check-in today ──
  const checkinToday = accommodations.find(a => a.check_in?.startsWith(today));
  if (checkinToday) {
    notifications.push({
      id: `checkin-${checkinToday.id}`,
      type: 'checkin',
      icon: '🏨', iconBg: '#F3E5F5', accentColor: '#9C27B0',
      title: `Check-in today`,
      body: `${checkinToday.name}${checkinToday.booking_reference ? ` · Ref: ${checkinToday.booking_reference}` : ''}`,
      time: formatTime(checkinToday.check_in) || 'Today',
      read: false,
      date: today,
    });
  }

  // ── Check-out today ──
  const checkoutToday = accommodations.find(a => a.check_out?.startsWith(today));
  if (checkoutToday) {
    notifications.push({
      id: `checkout-${checkoutToday.id}`,
      type: 'checkout',
      icon: '🧳', iconBg: '#FFF3E0', accentColor: '#FF9800',
      title: `Check-out today`,
      body: `${checkoutToday.name} · Don't forget to pack everything`,
      time: formatTime(checkoutToday.check_out) || 'Today',
      read: false,
      date: today,
    });
  }

  // ── Budget warning ──
  if (trip?.budget && expenses.length > 0) {
    const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const pct = (totalSpent / trip.budget) * 100;
    if (pct >= 80) {
      notifications.push({
        id: `budget-warning`,
        type: 'budget',
        icon: pct >= 100 ? '🚨' : '⚠️',
        iconBg: pct >= 100 ? '#FFEBEE' : '#FFF3E0',
        accentColor: pct >= 100 ? '#F44336' : '#FF9800',
        title: pct >= 100 ? 'Budget exceeded' : `Budget ${Math.round(pct)}% used`,
        body: `${currency} ${Math.round(totalSpent)} spent of ${currency} ${trip.budget} budget · ${currency} ${Math.max(0, Math.round(trip.budget - totalSpent))} remaining`,
        time: 'Now',
        read: false,
        date: today,
      });
    }
  }

  // ── Journal reminder (after 18:00, no entry today) ──
  if (now.getHours() >= 18 && journalToday.length === 0) {
    notifications.push({
      id: `journal-reminder`,
      type: 'journal',
      icon: '📖', iconBg: '#F3E5F5', accentColor: '#7C3AED',
      title: `Write today's memory`,
      body: `Don't let today's story go untold`,
      time: 'Evening',
      read: false,
      date: today,
    });
  }

  // ── New members (last 48h) ──
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
  const newMembers = members.filter(m => m.created_at > twoDaysAgo);
  for (const m of newMembers) {
    const name = (m.profiles as any)?.name ?? (m.profiles as any)?.email ?? 'Someone';
    notifications.push({
      id: `member-${m.user_id}`,
      type: 'member',
      icon: '👥', iconBg: '#E3F2FD', accentColor: '#42A5F5',
      title: `${name} joined the trip`,
      body: `${name} joined as ${m.role}`,
      time: 'Recently',
      read: false,
      date: today,
    });
  }

  return notifications;
}

// ─── Components ───────────────────────────────────────────────────────────────

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

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function NotificationCenterScreen() {
  const navigation = useNavigation();
  const statusBarHeight = useStatusBarHeight();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => { loadNotifications(); }, []));

  async function loadNotifications() {
    const tripId = currentTripIdRef.current;
    if (!tripId) { setLoading(false); return; }

    const { data: trip } = await supabase.from('trips').select('currency').eq('id', tripId).single();
    const currency = trip?.currency ?? 'EUR';

    const generated = await generateNotifications(tripId, currency);
    setNotifications(generated);
    setLoading(false);
  }

  function markRead(id: string) {
    setReadIds(prev => new Set([...prev, id]));
  }

  function markAllRead() {
    setReadIds(new Set(notifications.map(n => n.id)));
  }

  const today = getTodayStr();
  const todayNotifs = notifications.filter(n => n.date === today);
  const unreadCount = todayNotifs.filter(n => !readIds.has(n.id)).length;

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <View style={[styles.header, { paddingTop: statusBarHeight + 12 }]}>
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

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🔔</Text>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 8 }}>All caught up</Text>
          <Text style={{ fontSize: 14, color: '#888', textAlign: 'center' }}>No notifications for your current trip</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {todayNotifs.length > 0 && (
            <SectionBlock title="TODAY" headerColor="#C8E6C9" textColor="#1B5E20" icon="🌅">
              {todayNotifs.map((notif, index) => {
                const isRead = readIds.has(notif.id);
                return (
                  <View key={notif.id}>
                    <TouchableOpacity
                      style={[styles.notifRow, !isRead && styles.notifRowUnread]}
                      onPress={() => markRead(notif.id)}
                      activeOpacity={0.7}
                    >
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
                      {!isRead && <View style={[styles.unreadDot, { backgroundColor: notif.accentColor }]} />}
                    </TouchableOpacity>
                    {index < todayNotifs.length - 1 && <View style={styles.divider} />}
                  </View>
                );
              })}
            </SectionBlock>
          )}

          {todayNotifs.length === 0 && (
            <SectionBlock title="TODAY" headerColor="#C8E6C9" textColor="#1B5E20" icon="🌅">
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Text style={{ fontSize: 13, color: '#888' }}>No notifications today</Text>
              </View>
            </SectionBlock>
          )}

          <View style={styles.footerDecor}>
            <Dot color="#BBB" size={5} style={{ position: 'relative' }} />
            <Dot color="#BBB" size={4} style={{ position: 'relative', marginLeft: 8 }} />
            <Sparkle color="#FF9800" size={10} style={{ position: 'relative', marginLeft: 6 }} />
          </View>
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#E8E8E8' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
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
  footerDecor: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
});
