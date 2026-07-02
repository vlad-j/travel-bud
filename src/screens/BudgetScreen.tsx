import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Modal, Alert, Animated, Easing, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import BudgetDonut from '../components/BudgetDonut';
import { Sparkle, Dot } from '../components/TravelDecorations';
import { supabase } from '../lib/supabase';
import { useCurrentTrip, currentTripIdRef } from '../context/TripContext';
import { useStatusBarHeight } from '../../hooks/useStatusBarHeight';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';
import { getDestinationHero } from '../lib/destinationHero';
import AddExpenseModal from '../components/budget/AddExpenseModal';

// ─── Palette ────────────────────────────────────────────────────────────────
// Premium, warm, "travel companion" palette — cream undertones on a white
// canvas, a deep editorial green for trust/money, amber + coral for status.
const COLORS = {
  bg: '#FFFFFF',
  cream: '#FBF7F0',
  creamDark: '#F4EDDD',
  ink: '#1B1B1F',
  inkSoft: '#6E6B66',
  inkFaint: '#A6A29A',
  border: '#F0EBDF',
  green: '#1F6D4C',
  greenBright: '#2FA36E',
  greenSoft: '#E7F3EC',
  amber: '#B8752B',
  amberSoft: '#FBF0DE',
  red: '#C0483A',
  redSoft: '#FBEAE6',
  gold: '#C9A24B',
};

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORY_META: Record<string, { emoji: string; color: string; bg: string; label: string }> = {
  food:           { emoji: '🍜', color: '#D98A2B', bg: '#FBF1E1', label: 'Food & Drinks' },
  coffee:         { emoji: '☕', color: '#8A5A3B', bg: '#F3EAE3', label: 'Coffee' },
  drinks:         { emoji: '🍷', color: '#9C4F9C', bg: '#F6EAF6', label: 'Drinks' },
  groceries:      { emoji: '🛒', color: '#2E7FB8', bg: '#E7F1FA', label: 'Groceries' },
  transport:      { emoji: '🚗', color: '#2E7FB8', bg: '#E7F1FA', label: 'Transport' },
  accommodation:  { emoji: '🏨', color: '#6C5CB0', bg: '#EEEAF9', label: 'Hotels' },
  activity:       { emoji: '🎟️', color: '#2FA36E', bg: '#E7F3EC', label: 'Activities' },
  attraction:     { emoji: '🗽', color: '#1F9490', bg: '#E4F3F2', label: 'Attractions' },
  flight:         { emoji: '✈️', color: '#2394A8', bg: '#E4F3F5', label: 'Flights' },
  shopping:       { emoji: '🛍️', color: '#C24E77', bg: '#FBE9F0', label: 'Shopping' },
  exchange_fees:  { emoji: '💱', color: '#6C5CB0', bg: '#EEEAF9', label: 'Exchange Fees' },
  atm_fees:       { emoji: '🏧', color: '#6B7280', bg: '#EEEFF1', label: 'ATM Fees' },
  laundry:        { emoji: '🧺', color: '#2E9BC7', bg: '#E5F3FA', label: 'Laundry' },
  other_income:   { emoji: '💴', color: '#D98A2B', bg: '#FBF1E1', label: 'Other Income' },
  salary:         { emoji: '🏦', color: '#2FA36E', bg: '#E7F3EC', label: 'Salary' },
  gifts:          { emoji: '🎁', color: '#9C4F9C', bg: '#F6EAF6', label: 'Gifts' },
  other:          { emoji: '📦', color: '#8A8680', bg: '#F1EFEA', label: 'Other' },
};

const FAB_MENU = [
  { key: 'add',    emoji: '🍜', label: 'Add Expense',            enabled: true },
  { key: 'scan',   emoji: '📷', label: 'Scan Receipt',           enabled: false },
  { key: 'import',  emoji: '✈️', label: 'Import Booking',         enabled: false },
  { key: 'email',  emoji: '📧', label: 'Import Email',           enabled: false },
  { key: 'bank',   emoji: '💳', label: 'Import Bank Transaction', enabled: false },
];

function localDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function getTodayStr(): string {
  const now = new Date();
  return localDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
}
function getYesterdayStr(): string {
  const now = new Date();
  return localDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
}
function formatTime(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

// ─── Settlement Calculator ────────────────────────────────────────────────────
function calculateSettlement(expenses: any[], members: any[], currency: string) {
  const balance: Record<string, number> = {};
  members.forEach(m => { balance[m.id] = 0; });

  for (const expense of expenses) {
    const amount = Number(expense.amount);
    const paidBy = expense.paid_by;
    const splitWith: string[] = expense.split_with ?? [];
    if (!paidBy) continue;

    if (splitWith.length === 0) {
      balance[paidBy] = (balance[paidBy] ?? 0) + 0;
    } else {
      const participants = [paidBy, ...splitWith];
      const share = amount / participants.length;
      balance[paidBy] = (balance[paidBy] ?? 0) + amount;
      for (const participantId of participants) {
        balance[participantId] = (balance[participantId] ?? 0) - share;
      }
    }
  }

  const debts: { from: string; to: string; amount: number }[] = [];
  const debtors = members.filter(m => (balance[m.id] ?? 0) < -0.01);
  const creditors = members.filter(m => (balance[m.id] ?? 0) > 0.01);

  const debtorBalances = debtors.map(m => ({ id: m.id, amount: Math.abs(balance[m.id] ?? 0) }));
  const creditorBalances = creditors.map(m => ({ id: m.id, amount: balance[m.id] ?? 0 }));

  let i = 0, j = 0;
  while (i < debtorBalances.length && j < creditorBalances.length) {
    const debt = debtorBalances[i];
    const credit = creditorBalances[j];
    const payment = Math.min(debt.amount, credit.amount);
    if (payment > 0.01) debts.push({ from: debt.id, to: credit.id, amount: payment });
    debt.amount -= payment;
    credit.amount -= payment;
    if (debt.amount < 0.01) i++;
    if (credit.amount < 0.01) j++;
  }

  return { balance, debts };
}

// ─── Small reusable bits ───────────────────────────────────────────────────

/** Wraps any card/row so it gently lifts (scales) on press. */
function Liftable({ onPress, onLongPress, style, children, disabled }: any) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      onPressIn={onPress || onLongPress ? pressIn : undefined}
      onPressOut={onPress || onLongPress ? pressOut : undefined}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

/** Horizontal category bar that animates its width in on mount / change. */
function AnimatedBar({ percentage, color }: { percentage: number; color: string }) {
  const widthAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: Math.max(2, percentage),
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [percentage]);
  return (
    <View style={styles.catBarBg}>
      <Animated.View
        style={[
          styles.catBarFill,
          {
            backgroundColor: color,
            width: widthAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
          },
        ]}
      />
    </View>
  );
}

/** Fades a value in — used for the hero amount / stat numbers. */
function FadeIn({ children, style, delay = 0 }: any) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(6)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 420, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 420, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function BudgetScreen() {
  const navigation = useNavigation<any>();
  const { currentTripId } = useCurrentTrip();
  const route = useRoute<any>();

  const [trip, setTrip] = useState<any>(null);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [upcomingItems, setUpcomingItems] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editExpense, setEditExpense] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'Overview' | 'Timeline' | 'Settlement'>('Overview');
  const [fabOpen, setFabOpen] = useState(false);
  const statusBarHeight = useStatusBarHeight();
  const tabBarHeight = useBottomTabBarHeight();

  const fabRotate = useRef(new Animated.Value(0)).current;
  const sheetY = useRef(new Animated.Value(280)).current;

  function openFab() {
    setFabOpen(true);
    Animated.parallel([
      Animated.timing(fabRotate, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(sheetY, { toValue: 0, useNativeDriver: true, speed: 16, bounciness: 4 }),
    ]).start();
  }
  function closeFab() {
    Animated.parallel([
      Animated.timing(fabRotate, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(sheetY, { toValue: 280, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]).start(() => setFabOpen(false));
  }

  async function handleDeleteExpense(id: string) {
    Alert.alert('Delete expense', 'Remove this expense?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await supabase.from('expenses').delete().eq('id', id);
        setExpenses(prev => prev.filter(e => e.id !== id));
      }},
    ]);
  }

  function openOverflowMenu() {
    Alert.alert('Budget options', undefined, [
      { text: 'Edit trip budget', onPress: () => {} },
      { text: 'Change currency', onPress: () => {} },
      { text: 'Export expenses', onPress: () => {} },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  const loadData = useCallback(async (tripId?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    const { data: memberships } = await supabase.from('trip_members').select('trip_id').eq('user_id', user.id);
    if (!memberships || memberships.length === 0) { setLoading(false); return; }

    const tripIds = memberships.map((m: any) => m.trip_id);
    let tripData: any = null;

    const resolvedId = tripId || currentTripIdRef.current;
    if (resolvedId) {
      const { data } = await supabase.from('trips').select('*').eq('id', resolvedId).single();
      tripData = data;
    } else {
      const { data: tripsData } = await supabase.from('trips').select('*').in('id', tripIds).eq('status', 'active').order('created_at', { ascending: false });
      tripData = tripsData?.[0] ?? null;
    }

    if (!tripData) { setLoading(false); return; }
    setTrip(tripData);

    const [expensesRes, membersRes, destsRes] = await Promise.all([
      supabase.from('expenses').select('*').eq('trip_id', tripData.id).order('date', { ascending: false }),
      supabase.from('trip_members').select('user_id, role, profiles:user_id(id, name, email)').eq('trip_id', tripData.id),
      supabase.from('destinations').select('*').eq('trip_id', tripData.id).order('order_index', { ascending: true }),
    ]);

    setExpenses(expensesRes.data ?? []);
    setDestinations(destsRes.data ?? []);

    const mappedMembers = (membersRes.data ?? []).map((m: any) => ({
      id: m.user_id,
      name: m.profiles?.name ?? null,
      email: m.profiles?.email ?? null,
      role: m.role,
    }));
    setMembers(mappedMembers);

    // Best-effort: surface upcoming itinerary items with an estimated cost.
    // Hidden gracefully if this table / shape doesn't exist for this trip.
    try {
      const todayStr = getTodayStr();
      const { data: items, error } = await supabase
        .from('itinerary_items')
        .select('id, title, category, estimated_cost, date')
        .eq('trip_id', tripData.id)
        .gte('date', todayStr)
        .order('date', { ascending: true })
        .limit(3);
      if (!error && items) setUpcomingItems(items.filter((it: any) => it.estimated_cost != null));
      else setUpcomingItems([]);
    } catch {
      setUpcomingItems([]);
    }

    setLoading(false);
  }, [currentTripId]);

  useFocusEffect(useCallback(() => {
    loadData(currentTripIdRef.current ?? route.params?.tripId);
  }, []));

  useRealtimeSync({ tripId: currentTripIdRef.current, tables: ['expenses'], onChange: () => loadData(currentTripIdRef.current ?? undefined) });

  // ─── Calculations ──────────────────────────────────────────────────────────
  const totalBudget = trip?.budget ?? 0;
  const currency = trip?.currency ?? 'EUR';
  const sym = currency;
  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const remaining = totalBudget - totalSpent;
  const percentUsed = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const percentRemaining = Math.max(0, 100 - percentUsed);

  const today = getTodayStr();
  const yesterday = getYesterdayStr();
  const todaySpent = expenses.filter(e => e.date?.startsWith(today)).reduce((sum, e) => sum + Number(e.amount), 0);
  const yesterdaySpent = expenses.filter(e => e.date?.startsWith(yesterday)).reduce((sum, e) => sum + Number(e.amount), 0);

  const daysElapsed = (() => {
    if (!trip?.start_date) return 1;
    const [sy, sm, sd] = trip.start_date.split('-').map(Number);
    const startLocal = new Date(sy, sm - 1, sd);
    const now = new Date();
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diff = Math.round((todayLocal.getTime() - startLocal.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff + 1);
  })();

  const totalDays = (() => {
    if (!trip?.start_date || !trip?.end_date) return 1;
    const [sy, sm, sd] = trip.start_date.split('-').map(Number);
    const [ey, em, ed] = trip.end_date.split('-').map(Number);
    return Math.round((new Date(ey, em - 1, ed).getTime() - new Date(sy, sm - 1, sd).getTime()) / (1000 * 60 * 60 * 24)) + 1;
  })();

  const daysLeft = Math.max(0, totalDays - daysElapsed);
  const dailyAverage = daysElapsed > 0 ? totalSpent / daysElapsed : 0;
  const targetPerDay = totalBudget > 0 ? totalBudget / totalDays : 0;
  const overUnder = dailyAverage - targetPerDay;
  const avgAvailableToday = daysLeft > 0 ? remaining / daysLeft : Math.max(0, remaining);
  const remainingToday = avgAvailableToday - todaySpent;

  // Pace comparison drives the status badge + smart insight
  const paceRatio = totalDays > 0 ? Math.min(1, daysElapsed / totalDays) : 0;
  const spendRatio = totalBudget > 0 ? totalSpent / totalBudget : 0;
  const paceDiff = spendRatio - paceRatio;

  type Status = { label: string; emoji: string; color: string; bg: string };
  const status: Status = (() => {
    if (remaining < 0 || paceDiff > 0.15) return { label: 'Budget Alert', emoji: '🔴', color: COLORS.red, bg: COLORS.redSoft };
    if (paceDiff > 0.05) return { label: 'Watch Spending', emoji: '🟡', color: COLORS.amber, bg: COLORS.amberSoft };
    return { label: 'On Track', emoji: '🟢', color: COLORS.green, bg: COLORS.greenSoft };
  })();

  const categoryTotals: Record<string, number> = {};
  for (const expense of expenses) {
    const cat = expense.category ?? 'other';
    categoryTotals[cat] = (categoryTotals[cat] ?? 0) + Number(expense.amount);
  }
  const categories = Object.entries(categoryTotals)
    .map(([name, spent]) => ({ name, spent, percentage: totalSpent > 0 ? Math.round((spent / totalSpent) * 100) : 0 }))
    .sort((a, b) => b.spent - a.spent);

  const smartInsight: string = (() => {
    if (remaining < 0) return `You're ${sym} ${Math.abs(remaining).toFixed(0)} over budget. Might be worth easing off for the rest of the trip.`;
    if (paceDiff > 0.15) return `You're spending faster than planned — about ${sym} ${Math.abs(overUnder).toFixed(0)}/day over your target.`;
    if (paceDiff < -0.05) {
      const projected = dailyAverage * totalDays;
      const savings = totalBudget - projected;
      if (savings > 1) return `You're spending less than expected. At this pace you'll finish around ${sym} ${savings.toFixed(0)} under budget.`;
    }
    if (categories.length > 0) {
      const top = categories[0];
      const meta = CATEGORY_META[top.name] ?? CATEGORY_META.other;
      return `${meta.label} is your biggest expense so far, at ${top.percentage}% of spending.`;
    }
    return `You can comfortably afford tomorrow's plans.`;
  })();

  const expensesByDate: Record<string, any[]> = {};
  for (const expense of expenses) {
    const dateKey = expense.date?.split('T')[0] ?? 'unknown';
    if (!expensesByDate[dateKey]) expensesByDate[dateKey] = [];
    expensesByDate[dateKey].push(expense);
  }
  const sortedDates = Object.keys(expensesByDate).sort((a, b) => b.localeCompare(a));
  const recentExpenses = expenses.slice(0, 5);

  const { balance, debts } = calculateSettlement(expenses, members, currency);

  function getMember(id: string) {
    return members.find(m => m.id === id);
  }
  function getMemberName(id: string): string {
    const m = getMember(id);
    return m?.name ?? m?.email ?? 'Unknown';
  }
  function initials(name?: string | null): string {
    if (!name) return '•';
    const parts = name.trim().split(/\s+/);
    return (parts[0]?.[0] ?? '').concat(parts[1]?.[0] ?? '').toUpperCase() || name[0]?.toUpperCase() || '•';
  }

  function formatDateLabel(dateStr: string): string {
    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    } catch { return dateStr; }
  }
  function formatUpcomingLabel(dateStr: string): string {
    if (dateStr === today) return 'Today';
    const tomorrow = localDateStr(new Date(new Date(today).getTime() + 86400000));
    if (dateStr?.startsWith(tomorrow)) return 'Tomorrow';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    } catch { return dateStr; }
  }

  // ─── Destination context (also feeds the hero illustration) ────────────────
  const destinationContext = (() => {
    if (!trip || destinations.length === 0) return null;

    const now = new Date();
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const [sy, sm, sd] = trip.start_date.split('-').map(Number);
    const startLocal = new Date(sy, sm - 1, sd);
    const diffDays = Math.round((todayLocal.getTime() - startLocal.getTime()) / (1000 * 60 * 60 * 24));
    const dayNumber = Math.max(1, diffDays + 1);

    let dayCounter = 0;
    let destIndex = 0;
    for (let i = 0; i < destinations.length; i++) {
      dayCounter += destinations[i]?.nights ?? 1;
      destIndex = i;
      if (dayNumber <= dayCounter) break;
    }

    const dest = destinations[destIndex];
    const heroTheme = getDestinationHero(dest?.name, dest?.country);

    const [ey, em, ed] = (trip.end_date ?? trip.start_date).split('-').map(Number);
    const endLocal = new Date(ey, em - 1, ed);
    const totalTripDays = Math.round((endLocal.getTime() - startLocal.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const isCurrent = diffDays >= 0 && diffDays < totalTripDays;

    return {
      name: dest?.name ?? 'Destination',
      country: dest?.country ?? null,
      dayNumber,
      totalDays: dayCounter,
      dateLabel: todayLocal.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
      isCurrent,
      heroEmoji: heroTheme?.emoji ?? '🗺️',
    };
  })();

  const spin = fabRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.green} />
        </View>
      </SafeAreaView>
    );
  }

  if (!trip) {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <View style={[styles.header, { paddingTop: statusBarHeight }]}>
          <Text style={styles.headerTitle}>Budget</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>💰</Text>
          <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.ink, marginBottom: 8 }}>No active trip</Text>
          <Text style={{ fontSize: 14, color: COLORS.inkSoft, textAlign: 'center' }}>Create a trip to start tracking expenses</Text>
        </View>
      </SafeAreaView>
    );
  }

  const destName = destinationContext?.name ?? trip.name;

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      {/* ─── Header ─── */}
      <View style={[styles.header, { paddingTop: statusBarHeight }]}>
        {activeTab === 'Overview' ? (
          <>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Budget</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>{destName}</Text>
            </View>
            <TouchableOpacity style={styles.headerAddBtn} onPress={() => setShowAddModal(true)} activeOpacity={0.85}>
              <Text style={styles.headerAddBtnText}>＋ Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconBtn} onPress={openOverflowMenu} activeOpacity={0.7}>
              <Text style={styles.headerIconBtnText}>⋯</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.backBtn} onPress={() => setActiveTab('Overview')} activeOpacity={0.7}>
              <Text style={styles.backBtnText}>‹</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { flex: 1, fontSize: 18 }]}>
              {activeTab === 'Timeline' ? 'Budget Timeline' : 'Settlement'}
            </Text>
            <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.7}>
              <Text style={styles.headerIconBtnText}>{activeTab === 'Timeline' ? '⚲' : '＋'}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: tabBarHeight + 100 }}>

        {/* ─── OVERVIEW ─── */}
        {activeTab === 'Overview' && (
          <>
            {/* Hero */}
            <View style={styles.heroCard}>
              {/* decorative illustration layer */}
              <View style={styles.heroIllustration} pointerEvents="none">
                <View style={[styles.heroBlob, { width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(31,109,76,0.14)', top: -60, right: -50 }]} />
                <View style={[styles.heroBlob, { width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(201,162,75,0.16)', bottom: -40, left: -30 }]} />
                <View style={[styles.heroBlob, { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(31,109,76,0.10)', top: 30, left: 20 }]} />
                <Text style={styles.heroEmojiWatermark}>{destinationContext?.heroEmoji ?? '🗺️'}</Text>
                <Sparkle style={{ position: 'absolute', top: 18, right: 60 }} />
                <Dot style={{ position: 'absolute', bottom: 60, right: 24 }} />
              </View>

              <View style={styles.heroTopRow}>
                <View style={styles.heroProgressPill}>
                  <Text style={styles.heroProgressLabel}>Trip progress</Text>
                  <Text style={styles.heroProgressValue}>{daysElapsed} / {totalDays} days</Text>
                  <View style={styles.heroProgressBarBg}>
                    <View style={[styles.heroProgressBarFill, { width: `${Math.min(100, (daysElapsed / Math.max(1, totalDays)) * 100)}%` }]} />
                  </View>
                </View>
              </View>

              <View style={styles.heroCenter}>
                <View style={styles.ringBackdrop}>
                  <BudgetDonut percentage={percentRemaining} size={148} strokeWidth={12} />
                  <View style={styles.ringTextWrap} pointerEvents="none">
                    <FadeIn>
                      <Text style={styles.ringAmount}>{sym} {Math.abs(remaining).toFixed(0)}</Text>
                    </FadeIn>
                    <Text style={styles.ringSub}>{remaining < 0 ? 'Over budget' : 'Remaining'}</Text>
                    <Text style={styles.ringPercent}>{percentRemaining}%</Text>
                  </View>
                </View>
              </View>

              <View style={styles.heroBottomRow}>
                <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                  <Text style={{ fontSize: 12 }}>{status.emoji}</Text>
                  <Text style={[styles.statusBadgeText, { color: status.color }]}>{status.label}</Text>
                </View>
                <View style={styles.avgAvailableRow}>
                  <Text style={styles.avgAvailableText}>
                    Average available <Text style={styles.avgAvailableAmount}>{sym} {Math.max(0, avgAvailableToday).toFixed(0)}/day</Text>
                  </Text>
                </View>
              </View>
            </View>

            {/* Smart Insight */}
            <View style={styles.sectionWrap}>
              <View style={styles.insightCard}>
                <Text style={styles.insightSparkle}>✨</Text>
                <Text style={styles.insightText}>{smartInsight}</Text>
              </View>
            </View>

            {/* Today Snapshot */}
            <View style={styles.sectionWrap}>
              <View style={styles.snapshotRow}>
                <View style={styles.snapshotCard}>
                  <View style={[styles.snapshotIconWrap, { backgroundColor: COLORS.greenSoft }]}>
                    <Text style={{ fontSize: 16 }}>📅</Text>
                  </View>
                  <Text style={styles.snapshotLabel}>Spent Today</Text>
                  <Text style={styles.snapshotAmount}>{sym} {todaySpent.toFixed(0)}</Text>
                  {yesterdaySpent > 0 && (
                    <Text style={[styles.snapshotDelta, { color: todaySpent > yesterdaySpent ? COLORS.amber : COLORS.green }]}>
                      {todaySpent > yesterdaySpent ? '↗' : '↘'} vs yesterday
                    </Text>
                  )}
                </View>
                <View style={styles.snapshotCard}>
                  <View style={[styles.snapshotIconWrap, { backgroundColor: COLORS.creamDark }]}>
                    <Text style={{ fontSize: 16 }}>👛</Text>
                  </View>
                  <Text style={styles.snapshotLabel}>Remaining Today</Text>
                  <Text style={styles.snapshotAmount}>{sym} {Math.max(0, remainingToday).toFixed(0)}</Text>
                  <Text style={[styles.snapshotDelta, { color: remainingToday >= 0 ? COLORS.green : COLORS.red }]}>
                    {remainingToday >= 0 ? '● Still safe' : '● Over today\'s pace'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Category Breakdown */}
            {categories.length > 0 && (
              <View style={styles.sectionWrap}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>CATEGORY BREAKDOWN</Text>
                  <Text style={styles.sectionLink}>View full report</Text>
                </View>
                <View style={styles.card}>
                  {categories.map((cat, idx) => {
                    const meta = CATEGORY_META[cat.name] ?? CATEGORY_META.other;
                    return (
                      <View key={cat.name} style={[styles.catRow, idx < categories.length - 1 && styles.catRowBorder]}>
                        <View style={[styles.catIconWrap, { backgroundColor: meta.bg }]}>
                          <Text style={{ fontSize: 16 }}>{meta.emoji}</Text>
                        </View>
                        <View style={styles.catMiddle}>
                          <Text style={styles.catName}>{meta.label}</Text>
                          <AnimatedBar percentage={cat.percentage} color={meta.color} />
                        </View>
                        <View style={styles.catRight}>
                          <Text style={[styles.catPercent, { color: meta.color }]}>{cat.percentage}%</Text>
                          <Text style={styles.catAmount}>{sym} {cat.spent.toFixed(0)}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Upcoming Expenses */}
            {upcomingItems.length > 0 && (
              <View style={styles.sectionWrap}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>UPCOMING EXPENSES</Text>
                  <Text style={styles.sectionLink}>View itinerary</Text>
                </View>
                <View style={styles.card}>
                  {upcomingItems.map((item, idx) => {
                    const meta = CATEGORY_META[item.category] ?? CATEGORY_META.other;
                    return (
                      <Liftable
                        key={item.id}
                        style={[styles.upcomingRow, idx < upcomingItems.length - 1 && styles.catRowBorder]}
                      >
                        <View style={[styles.catIconWrap, { backgroundColor: meta.bg }]}>
                          <Text style={{ fontSize: 16 }}>{meta.emoji}</Text>
                        </View>
                        <View style={styles.catMiddle}>
                          <Text style={styles.upcomingWhen}>{formatUpcomingLabel(item.date)}</Text>
                          <Text style={styles.catName}>{item.title}</Text>
                          <Text style={styles.upcomingEstimate}>Estimated</Text>
                        </View>
                        <Text style={styles.catAmount}>{sym} {Number(item.estimated_cost).toFixed(0)}</Text>
                      </Liftable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Recent Expenses */}
            <View style={styles.sectionWrap}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>RECENT EXPENSES</Text>
                <TouchableOpacity onPress={() => setActiveTab('Timeline')}>
                  <Text style={styles.sectionLink}>View all</Text>
                </TouchableOpacity>
              </View>
              {recentExpenses.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>💸</Text>
                  <Text style={styles.emptyTitle}>No expenses yet</Text>
                  <Text style={styles.emptySub}>Tap the + button to log your first expense</Text>
                </View>
              ) : (
                <View style={styles.card}>
                  {recentExpenses.map((expense, idx) => {
                    const meta = CATEGORY_META[expense.category] ?? CATEGORY_META.other;
                    const dateKey = expense.date?.split('T')[0];
                    const splitCount = expense.split_with?.length ?? 0;
                    const isShared = splitCount > 0;
                    const paidByOther = isShared && expense.paid_by && expense.paid_by !== currentUserId;
                    const yourShare = isShared ? Number(expense.amount) / (splitCount + 1) : Number(expense.amount);
                    return (
                      <Liftable
                        key={expense.id}
                        style={[styles.recentRow, idx < recentExpenses.length - 1 && styles.catRowBorder]}
                        onLongPress={() => {
                          Alert.alert(expense.title, 'What would you like to do?', [
                            { text: 'Edit', onPress: () => setEditExpense(expense) },
                            { text: 'Delete', style: 'destructive', onPress: () => handleDeleteExpense(expense.id) },
                            { text: 'Cancel', style: 'cancel' },
                          ]);
                        }}
                      >
                        <View style={[styles.catIconWrap, { backgroundColor: meta.bg }]}>
                          <Text style={{ fontSize: 16 }}>{meta.emoji}</Text>
                        </View>
                        <View style={styles.catMiddle}>
                          <View style={styles.recentTitleRow}>
                            <Text style={styles.catName}>{expense.title}</Text>
                            {isShared && (
                              <View style={styles.sharedPill}>
                                <Text style={styles.sharedPillText}>👥 Split {splitCount + 1}</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.recentSub}>
                            {formatDateLabel(dateKey)}{formatTime(expense.date) ? ` · ${formatTime(expense.date)}` : ''}
                            {members.length > 1 && expense.paid_by ? ` · Paid by ${paidByOther ? getMemberName(expense.paid_by) : 'you'}` : ''}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.catAmount}>{sym} {Number(expense.amount).toFixed(0)}</Text>
                          {isShared && <Text style={styles.yourShareText}>your share {sym} {yourShare.toFixed(0)}</Text>}
                        </View>
                      </Liftable>
                    );
                  })}
                </View>
              )}
            </View>
          </>
        )}

        {/* ─── TIMELINE ─── */}
        {activeTab === 'Timeline' && (
          <View style={styles.sectionWrap}>
            {sortedDates.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>💸</Text>
                <Text style={styles.emptyTitle}>No expenses yet</Text>
                <Text style={styles.emptySub}>Add your first expense</Text>
              </View>
            ) : (
              sortedDates.map((dateKey) => {
                const dayExpenses = expensesByDate[dateKey];
                const dayTotal = dayExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
                return (
                  <View key={dateKey} style={{ marginBottom: 18 }}>
                    <View style={styles.timelineDateRow}>
                      <Text style={styles.timelineDateLabel}>{formatDateLabel(dateKey)}</Text>
                      <Text style={styles.timelineDateSub}>{formatUpcomingLabel(dateKey) === dateKey ? '' : ''}</Text>
                    </View>
                    <View style={styles.card}>
                      {dayExpenses.map((expense, idx) => {
                        const meta = CATEGORY_META[expense.category] ?? CATEGORY_META.other;
                        const paidByName = getMemberName(expense.paid_by);
                        const splitCount = expense.split_with?.length ?? 0;
                        return (
                          <Liftable
                            key={expense.id}
                            style={[styles.timelineItem, idx < dayExpenses.length - 1 && styles.catRowBorder]}
                            onLongPress={() => {
                              Alert.alert(expense.title, 'What would you like to do?', [
                                { text: 'Edit', onPress: () => setEditExpense(expense) },
                                { text: 'Delete', style: 'destructive', onPress: () => handleDeleteExpense(expense.id) },
                                { text: 'Cancel', style: 'cancel' },
                              ]);
                            }}
                          >
                            <View style={styles.timelineTrack}>
                              <View style={[styles.timelineDot, { backgroundColor: meta.color }]} />
                              {idx < dayExpenses.length - 1 && <View style={styles.timelineLine} />}
                            </View>
                            <View style={[styles.catIconWrap, { backgroundColor: meta.bg }]}>
                              <Text style={{ fontSize: 15 }}>{meta.emoji}</Text>
                            </View>
                            <View style={styles.catMiddle}>
                              <Text style={styles.catName}>{expense.title}</Text>
                              <Text style={styles.recentSub}>
                                {formatTime(expense.date)} · {meta.label}
                                {expense.local_currency ? ` · ${expense.local_amount} ${expense.local_currency}` : ''}
                                {splitCount > 0 ? ` · Split ${splitCount + 1} ways` : ''}
                              </Text>
                              {members.length > 1 && expense.paid_by && (
                                <Text style={styles.timelinePaidBy}>👤 {paidByName}</Text>
                              )}
                            </View>
                            <Text style={styles.catAmount}>{sym} {Number(expense.amount).toFixed(2)}</Text>
                          </Liftable>
                        );
                      })}
                    </View>
                    <Text style={styles.timelineDayTotal}>Day total · {sym} {dayTotal.toFixed(0)}</Text>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ─── SETTLEMENT ─── */}
        {activeTab === 'Settlement' && (
          <View style={styles.sectionWrap}>
            {members.length < 2 ? (
              <View style={styles.emptyCard}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>👥</Text>
                <Text style={styles.emptyTitle}>Add travel companions</Text>
                <Text style={styles.emptySub}>Invite members to your trip to track shared expenses</Text>
              </View>
            ) : (
              <>
                <Text style={styles.sectionTitle}>TRAVEL COMPANIONS</Text>
                <View style={styles.card}>
                  {members.map((m, idx) => {
                    const bal = balance[m.id] ?? 0;
                    const isYou = m.id === currentUserId;
                    const paidTotal = expenses.filter(e => e.paid_by === m.id).reduce((s, e) => s + Number(e.amount), 0);
                    return (
                      <View key={m.id} style={[styles.companionRow, idx < members.length - 1 && styles.catRowBorder]}>
                        <View style={styles.avatarCircle}>
                          <Text style={styles.avatarInitials}>{initials(m.name ?? m.email)}</Text>
                        </View>
                        <View style={styles.catMiddle}>
                          <Text style={styles.catName}>{m.name ?? m.email ?? 'Unknown'}{isYou ? ' (You)' : ''}</Text>
                          <Text style={styles.recentSub}>Paid</Text>
                        </View>
                        <Text style={[
                          styles.companionAmount,
                          bal > 0.01 && { color: COLORS.green },
                          bal < -0.01 && { color: COLORS.red },
                        ]}>
                          {sym} {paidTotal.toFixed(2)}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                <Text style={[styles.sectionTitle, { marginTop: 18 }]}>SETTLEMENT SUMMARY</Text>
                {debts.length === 0 ? (
                  <View style={styles.settledCard}>
                    <Text style={{ fontSize: 32, marginBottom: 8 }}>✅</Text>
                    <Text style={styles.settledText}>All settled up!</Text>
                    <Text style={styles.settledSub}>No payments needed</Text>
                  </View>
                ) : (
                  <View style={styles.settlementSummaryCard}>
                    <Text style={styles.settlementEmoji}>💵</Text>
                    {debts.map((debt, i) => (
                      <View key={i} style={{ alignItems: 'center', marginBottom: i < debts.length - 1 ? 14 : 0 }}>
                        <Text style={styles.settlementLine}>
                          <Text style={styles.settlementName}>{getMemberName(debt.from)}</Text>
                          {debt.to === currentUserId ? ' owes you' : (
                            <> owes <Text style={styles.settlementName}>{getMemberName(debt.to)}</Text></>
                          )}
                        </Text>
                        <Text style={styles.settlementAmount}>{sym} {debt.amount.toFixed(2)}</Text>
                      </View>
                    ))}
                    <TouchableOpacity style={styles.requestBtn} activeOpacity={0.88}>
                      <Text style={styles.requestBtnText}>↗ Request Payment</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.howItWorksCard}>
                  <Text style={{ fontSize: 18 }}>💡</Text>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.howItWorksTitle}>How it works</Text>
                    <Text style={styles.howItWorksSub}>We calculate shared expenses fairly so everyone pays their part.</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        )}

      </ScrollView>

      {/* ─── Floating Action Button ─── */}
      {activeTab === 'Overview' && (
        <TouchableOpacity
          style={[styles.fab, { bottom: tabBarHeight + 16 }]}
          activeOpacity={0.9}
          onPress={openFab}
        >
          <Animated.Text style={[styles.fabIcon, { transform: [{ rotate: spin }] }]}>＋</Animated.Text>
        </TouchableOpacity>
      )}

      {/* ─── FAB Menu Sheet ─── */}
      <Modal visible={fabOpen} transparent animationType="fade" onRequestClose={closeFab}>
        <Pressable style={styles.sheetBackdrop} onPress={closeFab}>
          <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetY }] }]}>
            <View style={styles.sheetHandle} />
            {FAB_MENU.map((item, idx) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.sheetRow, idx < FAB_MENU.length - 1 && styles.catRowBorder]}
                disabled={!item.enabled}
                activeOpacity={0.7}
                onPress={() => {
                  closeFab();
                  if (item.key === 'add') setShowAddModal(true);
                }}
              >
                <Text style={{ fontSize: 18, opacity: item.enabled ? 1 : 0.4 }}>{item.emoji}</Text>
                <Text style={[styles.sheetRowText, !item.enabled && { color: COLORS.inkFaint }]}>{item.label}</Text>
                {!item.enabled && <Text style={styles.comingSoonTag}>Coming soon</Text>}
                {item.enabled && <Text style={styles.sheetChevron}>›</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.sheetCancel} onPress={closeFab} activeOpacity={0.7}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Modal>

      <AddExpenseModal
        visible={showAddModal || !!editExpense}
        onClose={() => { setShowAddModal(false); setEditExpense(null); }}
        tripId={trip.id}
        currency={currency}
        members={members}
        currentUserId={currentUserId}
        onAdded={() => loadData(route.params?.tripId)}
        editData={editExpense}
        destinationContext={destinationContext}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 14, gap: 8, backgroundColor: COLORS.bg },
  headerTitle: { fontSize: 26, fontWeight: '800', color: COLORS.ink, letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 14, fontWeight: '700', color: COLORS.green, marginTop: 2 },
  headerAddBtn: { backgroundColor: COLORS.green, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10 },
  headerAddBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  headerIconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.cream, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  headerIconBtnText: { fontSize: 18, color: COLORS.ink, fontWeight: '700' },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.cream },
  backBtnText: { fontSize: 22, color: COLORS.ink, fontWeight: '600', marginTop: -2 },

  // Hero
  heroCard: {
    marginHorizontal: 16, marginTop: 4, marginBottom: 8, borderRadius: 28, padding: 20,
    backgroundColor: COLORS.cream, overflow: 'hidden',
    shadowColor: '#8A7A55', shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 4,
    minHeight: 340,
  },
  heroIllustration: { ...StyleSheet.absoluteFillObject },
  heroBlob: { position: 'absolute' },
  heroEmojiWatermark: { position: 'absolute', fontSize: 120, top: 6, right: -10, opacity: 0.16 },
  heroTopRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  heroProgressPill: { backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, minWidth: 150 },
  heroProgressLabel: { fontSize: 11, fontWeight: '700', color: COLORS.inkSoft, marginBottom: 2 },
  heroProgressValue: { fontSize: 13, fontWeight: '800', color: COLORS.ink, marginBottom: 6 },
  heroProgressBarBg: { height: 4, borderRadius: 2, backgroundColor: 'rgba(31,109,76,0.15)', overflow: 'hidden' },
  heroProgressBarFill: { height: '100%', backgroundColor: COLORS.green, borderRadius: 2 },
  heroCenter: { alignItems: 'center', justifyContent: 'center', marginVertical: 18 },
  ringBackdrop: { alignItems: 'center', justifyContent: 'center' },
  ringTextWrap: { position: 'absolute', alignItems: 'center' },
  ringAmount: { fontSize: 26, fontWeight: '900', color: COLORS.ink, letterSpacing: -0.5 },
  ringSub: { fontSize: 12, fontWeight: '600', color: COLORS.inkSoft, marginTop: 1 },
  ringPercent: { fontSize: 12, fontWeight: '800', color: COLORS.green, marginTop: 4 },
  heroBottomRow: { alignItems: 'center', gap: 10 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  statusBadgeText: { fontSize: 13, fontWeight: '800' },
  avgAvailableRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  avgAvailableText: { fontSize: 12, color: COLORS.inkSoft, fontWeight: '500' },
  avgAvailableAmount: { fontWeight: '800', color: COLORS.ink },

  // Sections
  sectionWrap: { marginHorizontal: 16, marginBottom: 18 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: COLORS.inkFaint, letterSpacing: 0.9 },
  sectionLink: { fontSize: 12, fontWeight: '700', color: COLORS.green },

  // Smart insight
  insightCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: COLORS.greenSoft,
    borderRadius: 20, padding: 16,
  },
  insightSparkle: { fontSize: 16, marginTop: 1 },
  insightText: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.green, lineHeight: 20 },

  // Snapshot
  snapshotRow: { flexDirection: 'row', gap: 12 },
  snapshotCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 22, padding: 16,
    shadowColor: '#8A7A55', shadowOpacity: 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2,
    borderWidth: 1, borderColor: COLORS.border,
  },
  snapshotIconWrap: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  snapshotLabel: { fontSize: 12, fontWeight: '600', color: COLORS.inkSoft, marginBottom: 4 },
  snapshotAmount: { fontSize: 24, fontWeight: '900', color: COLORS.ink, letterSpacing: -0.5 },
  snapshotDelta: { fontSize: 11, fontWeight: '700', marginTop: 6 },

  // Generic card / rows
  card: {
    backgroundColor: '#fff', borderRadius: 22, paddingHorizontal: 14,
    shadowColor: '#8A7A55', shadowOpacity: 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2,
    borderWidth: 1, borderColor: COLORS.border,
  },
  catRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  catIconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  catMiddle: { flex: 1 },
  catName: { fontSize: 14, fontWeight: '700', color: COLORS.ink, marginBottom: 6 },
  catBarBg: { height: 5, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  catBarFill: { height: '100%', borderRadius: 3 },
  catRight: { alignItems: 'flex-end', minWidth: 60 },
  catPercent: { fontSize: 13, fontWeight: '800' },
  catAmount: { fontSize: 13, fontWeight: '700', color: COLORS.inkSoft, marginTop: 2 },

  // Upcoming
  upcomingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  upcomingWhen: { fontSize: 11, fontWeight: '700', color: COLORS.green, marginBottom: 2 },
  upcomingEstimate: { fontSize: 11, color: COLORS.inkFaint, marginTop: 2 },

  // Recent
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  recentSub: { fontSize: 12, color: COLORS.inkSoft, fontWeight: '500' },
  recentTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  sharedPill: { backgroundColor: COLORS.greenSoft, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  sharedPillText: { fontSize: 10, fontWeight: '800', color: COLORS.green },
  yourShareText: { fontSize: 10, fontWeight: '600', color: COLORS.inkFaint, marginTop: 2 },

  // Empty state
  emptyCard: { alignItems: 'center', paddingVertical: 48, backgroundColor: COLORS.cream, borderRadius: 22 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: COLORS.ink },
  emptySub: { fontSize: 13, color: COLORS.inkSoft, marginTop: 4, textAlign: 'center', paddingHorizontal: 24 },

  // Timeline
  timelineDateRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingHorizontal: 2 },
  timelineDateLabel: { fontSize: 13, fontWeight: '800', color: COLORS.ink },
  timelineDateSub: { fontSize: 12, color: COLORS.inkFaint },
  timelineDayTotal: { fontSize: 12, fontWeight: '700', color: COLORS.green, textAlign: 'right', marginTop: 8, marginRight: 4 },
  timelineItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14 },
  timelineTrack: { width: 10, alignItems: 'center', alignSelf: 'stretch' },
  timelineDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  timelineLine: { flex: 1, width: 1.5, backgroundColor: COLORS.border, marginTop: 4 },
  timelinePaidBy: { fontSize: 11, color: COLORS.green, marginTop: 2, fontWeight: '700' },

  // Settlement
  companionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  avatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.creamDark, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 14, fontWeight: '800', color: COLORS.green },
  companionAmount: { fontSize: 15, fontWeight: '800', color: COLORS.ink },
  settledCard: { backgroundColor: COLORS.greenSoft, borderRadius: 22, padding: 28, alignItems: 'center' },
  settledText: { fontSize: 17, fontWeight: '800', color: COLORS.green },
  settledSub: { fontSize: 13, color: COLORS.green, marginTop: 4, opacity: 0.8 },
  settlementSummaryCard: { backgroundColor: COLORS.greenSoft, borderRadius: 22, padding: 22, alignItems: 'center' },
  settlementEmoji: { fontSize: 30, marginBottom: 8 },
  settlementLine: { fontSize: 14, color: COLORS.ink, fontWeight: '600' },
  settlementName: { fontWeight: '800' },
  settlementAmount: { fontSize: 26, fontWeight: '900', color: COLORS.green, marginTop: 4 },
  requestBtn: { backgroundColor: COLORS.green, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 28, marginTop: 16, alignSelf: 'stretch', alignItems: 'center' },
  requestBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  howItWorksCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.amberSoft, borderRadius: 18, padding: 14, marginTop: 14 },
  howItWorksTitle: { fontSize: 13, fontWeight: '800', color: COLORS.amber, marginBottom: 2 },
  howItWorksSub: { fontSize: 12, color: COLORS.amber, opacity: 0.85, lineHeight: 17 },

  // FAB
  fab: {
    position: 'absolute', bottom: 24, right: 20, width: 58, height: 58, borderRadius: 29,
    backgroundColor: COLORS.green, alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.green, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  fabIcon: { fontSize: 28, color: '#fff', fontWeight: '300' },

  // FAB Sheet
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(27,27,31,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 30 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: 12 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  sheetRowText: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.ink },
  sheetChevron: { fontSize: 18, color: COLORS.inkFaint },
  comingSoonTag: { fontSize: 11, fontWeight: '700', color: COLORS.inkFaint, backgroundColor: COLORS.cream, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  sheetCancel: { marginTop: 10, backgroundColor: COLORS.cream, borderRadius: 18, paddingVertical: 15, alignItems: 'center' },
  sheetCancelText: { fontSize: 15, fontWeight: '700', color: COLORS.ink },
});
