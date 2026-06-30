import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import BudgetDonut from '../components/BudgetDonut';
import { Sparkle, Dot } from '../components/TravelDecorations';
import { supabase } from '../lib/supabase';
import { useCurrentTrip, currentTripIdRef } from '../context/TripContext';
import { useStatusBarHeight } from '../../hooks/useStatusBarHeight';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';
import { getDestinationHero } from '../lib/destinationHero';
import AddExpenseModal from '../components/budget/AddExpenseModal';

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORY_META: Record<string, { emoji: string; color: string; bg: string; label: string }> = {
  food:           { emoji: '🍜', color: '#FF9800', bg: '#FFF8E1', label: 'Food' },
  coffee:         { emoji: '☕', color: '#795548', bg: '#EFEBE9', label: 'Coffee' },
  drinks:         { emoji: '🍷', color: '#9C27B0', bg: '#F3E5F5', label: 'Drinks' },
  groceries:      { emoji: '🛒', color: '#2196F3', bg: '#E3F2FD', label: 'Groceries' },
  transport:      { emoji: '🚗', color: '#F44336', bg: '#FFEBEE', label: 'Transport' },
  accommodation:  { emoji: '🏨', color: '#3F51B5', bg: '#E8EAF6', label: 'Accommodation' },
  activity:       { emoji: '🏃', color: '#4CAF50', bg: '#E8F5E9', label: 'Activities' },
  attraction:     { emoji: '🗽', color: '#009688', bg: '#E0F2F1', label: 'Attractions' },
  flight:         { emoji: '✈️', color: '#00BCD4', bg: '#E0F7FA', label: 'Flights' },
  shopping:       { emoji: '🛍️', color: '#E91E63', bg: '#FCE4EC', label: 'Shopping' },
  exchange_fees:  { emoji: '💱', color: '#673AB7', bg: '#EDE7F6', label: 'Exchange Fees' },
  atm_fees:       { emoji: '🏧', color: '#607D8B', bg: '#ECEFF1', label: 'ATM Fees' },
  laundry:        { emoji: '🧺', color: '#03A9F4', bg: '#E1F5FE', label: 'Laundry' },
  other_income:   { emoji: '💴', color: '#FF9800', bg: '#FFF3E0', label: 'Other Income' },
  salary:         { emoji: '🏦', color: '#4CAF50', bg: '#E8F5E9', label: 'Salary' },
  gifts:          { emoji: '🎁', color: '#9C27B0', bg: '#F3E5F5', label: 'Gifts' },
  other:          { emoji: '📦', color: '#888888', bg: '#F5F5F5', label: 'Other' },
};

const EXPENSE_CATEGORIES = Object.entries(CATEGORY_META).map(([label, v]) => ({ label, emoji: v.emoji }));

const TABS = ['Overview', 'Timeline', 'Settlement'];

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

// ─── Exchange Rate ────────────────────────────────────────────────────────────
async function getExchangeRate(from: string, to: string): Promise<number> {
  if (from === to) return 1;
  try {
    const res = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
    const data = await res.json();
    return data.rates?.[to] ?? 1;
  } catch {
    return 1;
  }
}

// ─── Settlement Calculator ────────────────────────────────────────────────────
function calculateSettlement(expenses: any[], members: any[], currency: string) {
  // Build balance map: how much each person paid vs owes
  const balance: Record<string, number> = {};
  members.forEach(m => { balance[m.id] = 0; });

  for (const expense of expenses) {
    const amount = Number(expense.amount);
    const paidBy = expense.paid_by;
    const splitWith: string[] = expense.split_with ?? [];

    if (!paidBy) continue;

    if (splitWith.length === 0) {
      // No split — payer paid for themselves
      balance[paidBy] = (balance[paidBy] ?? 0) + 0;
    } else {
      // Split between paidBy + splitWith
      const participants = [paidBy, ...splitWith];
      const share = amount / participants.length;

      // Payer gets credited for the full amount
      balance[paidBy] = (balance[paidBy] ?? 0) + amount;

      // Each participant owes their share
      for (const participantId of participants) {
        balance[participantId] = (balance[participantId] ?? 0) - share;
      }
    }
  }

  // Calculate who owes whom
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

    if (payment > 0.01) {
      debts.push({ from: debt.id, to: credit.id, amount: payment });
    }

    debt.amount -= payment;
    credit.amount -= payment;

    if (debt.amount < 0.01) i++;
    if (credit.amount < 0.01) j++;
  }

  return { balance, debts };
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
  const [currentUserId, setCurrentUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editExpense, setEditExpense] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const statusBarHeight = useStatusBarHeight();

  async function handleDeleteExpense(id: string) {
    Alert.alert('Delete expense', 'Remove this expense?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await supabase.from('expenses').delete().eq('id', id);
        setExpenses(prev => prev.filter(e => e.id !== id));
      }},
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
    setLoading(false);
  }, [currentTripId]);

  useFocusEffect(useCallback(() => {
    loadData(currentTripIdRef.current ?? route.params?.tripId);
  }, []));

  useRealtimeSync({ tripId: currentTripIdRef.current, tables: ['expenses'], onChange: () => loadData(currentTripIdRef.current ?? undefined) });

  // ─── Calculations ──────────────────────────────────────────────────────────
  const totalBudget = trip?.budget ?? 0;
  const currency = trip?.currency ?? 'EUR';
  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const remaining = totalBudget - totalSpent;
  const percentUsed = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

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

  const categoryTotals: Record<string, number> = {};
  for (const expense of expenses) {
    const cat = expense.category ?? 'other';
    categoryTotals[cat] = (categoryTotals[cat] ?? 0) + Number(expense.amount);
  }
  const categories = Object.entries(categoryTotals)
    .map(([name, spent]) => ({ name, spent, percentage: totalSpent > 0 ? Math.round((spent / totalSpent) * 100) : 0 }))
    .sort((a, b) => b.spent - a.spent);

  const expensesByDate: Record<string, any[]> = {};
  for (const expense of expenses) {
    const dateKey = expense.date?.split('T')[0] ?? 'unknown';
    if (!expensesByDate[dateKey]) expensesByDate[dateKey] = [];
    expensesByDate[dateKey].push(expense);
  }
  const sortedDates = Object.keys(expensesByDate).sort((a, b) => b.localeCompare(a));

  const { balance, debts } = calculateSettlement(expenses, members, currency);

  function getMemberName(id: string): string {
    const m = members.find(m => m.id === id);
    return m?.name ?? m?.email ?? 'Unknown';
  }

  function formatDateLabel(dateStr: string): string {
    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    } catch { return dateStr; }
  }

  const sym = currency;

  // ─── Destination context for Add Expense card (derived, not new schema) ────
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
      heroEmoji: '🛕',
    };
  })();

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#4CAF50" />
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
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 8 }}>No active trip</Text>
          <Text style={{ fontSize: 14, color: '#888', textAlign: 'center' }}>Create a trip to start tracking expenses</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: statusBarHeight }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Budget</Text>
          <Text style={styles.headerTrip} numberOfLines={1}>{trip.name}</Text>
        </View>
        <TouchableOpacity style={styles.addHeaderBtn} onPress={() => setShowAddModal(true)}>
          <Text style={styles.addHeaderBtnText}>＋ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ─── OVERVIEW TAB ─── */}
        {activeTab === 'Overview' && (
          <>
            {/* Hero Card */}
            <View style={styles.heroCard}>
              <View style={styles.heroTop}>
                <View>
                  <Text style={styles.heroLabel}>Total budget</Text>
                  <Text style={styles.heroAmount}>{sym} {totalBudget.toLocaleString()}</Text>
                </View>
                <View style={styles.heroDaysWrap}>
                  <Text style={styles.heroDaysNum}>{daysLeft}</Text>
                  <Text style={styles.heroDaysLabel}>days left</Text>
                </View>
              </View>
              <View style={styles.progressBarWrap}>
                <View style={styles.progressBarBg}>
                  <View style={[
                    styles.progressBarFill,
                    { width: `${Math.min(percentUsed, 100)}%` },
                    percentUsed > 90 && { backgroundColor: '#F44336' },
                    percentUsed > 70 && percentUsed <= 90 && { backgroundColor: '#FF9800' },
                  ]} />
                </View>
                <Text style={styles.progressPercent}>{percentUsed}%</Text>
              </View>
              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>{sym} {totalSpent.toFixed(0)}</Text>
                  <Text style={styles.heroStatLabel}>Spent</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Text style={[styles.heroStatValue, { color: remaining < 0 ? '#F44336' : '#4CAF50' }]}>
                    {sym} {Math.abs(remaining).toFixed(0)}
                  </Text>
                  <Text style={styles.heroStatLabel}>{remaining < 0 ? 'Over budget' : 'Remaining'}</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>Day {daysElapsed}/{totalDays}</Text>
                  <Text style={styles.heroStatLabel}>Progress</Text>
                </View>
              </View>
            </View>

            {/* Spending Insights */}
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionTitle}>💡 SPENDING INSIGHTS</Text>
              <View style={styles.insightsGrid}>
                <View style={styles.insightCard}>
                  <Text style={styles.insightEmoji}>📅</Text>
                  <Text style={styles.insightValue}>{sym} {todaySpent.toFixed(0)}</Text>
                  <Text style={styles.insightLabel}>Today</Text>
                </View>
                <View style={styles.insightCard}>
                  <Text style={styles.insightEmoji}>⏮</Text>
                  <Text style={styles.insightValue}>{sym} {yesterdaySpent.toFixed(0)}</Text>
                  <Text style={styles.insightLabel}>Yesterday</Text>
                </View>
                <View style={styles.insightCard}>
                  <Text style={styles.insightEmoji}>📊</Text>
                  <Text style={styles.insightValue}>{sym} {dailyAverage.toFixed(0)}</Text>
                  <Text style={styles.insightLabel}>Daily avg</Text>
                </View>
                <View style={styles.insightCard}>
                  <Text style={styles.insightEmoji}>🎯</Text>
                  <Text style={styles.insightValue}>{sym} {targetPerDay.toFixed(0)}</Text>
                  <Text style={styles.insightLabel}>Target/day</Text>
                </View>
              </View>
              {targetPerDay > 0 && (
                <View style={[styles.insightAlert, { backgroundColor: overUnder > 0 ? '#FFF3E0' : '#E8F5E9' }]}>
                  <Text style={[styles.insightAlertText, { color: overUnder > 0 ? '#E65100' : '#2E7D32' }]}>
                    {overUnder > 0
                      ? `⚠️ ${sym} ${Math.abs(overUnder).toFixed(0)}/day over plan`
                      : `✅ ${sym} ${Math.abs(overUnder).toFixed(0)}/day under budget`}
                  </Text>
                </View>
              )}
            </View>

            {/* Categories */}
            {categories.length > 0 && (
              <View style={styles.sectionWrap}>
                <Text style={styles.sectionTitle}>📂 BY CATEGORY</Text>
                <View style={styles.categoriesCard}>
                  <View style={styles.donutRow}>
                    <BudgetDonut percentage={percentUsed} size={100} strokeWidth={12} />
                    <View style={styles.categoryLegend}>
                      {categories.slice(0, 4).map(cat => {
                        const meta = CATEGORY_META[cat.name] ?? CATEGORY_META.other;
                        return (
                          <View key={cat.name} style={styles.legendRow}>
                            <View style={[styles.legendDot, { backgroundColor: meta.color }]} />
                            <Text style={styles.legendLabel}>{meta.label}</Text>
                            <Text style={styles.legendValue}>{cat.percentage}%</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                  <View style={styles.catDivider} />
                  {categories.map(cat => {
                    const meta = CATEGORY_META[cat.name] ?? CATEGORY_META.other;
                    return (
                      <View key={cat.name} style={[styles.catRow, { backgroundColor: meta.bg }]}>
                        <Text style={{ fontSize: 22 }}>{meta.emoji}</Text>
                        <View style={styles.catContent}>
                          <View style={styles.catHeader}>
                            <Text style={styles.catName}>{meta.label}</Text>
                            <Text style={styles.catAmount}>{sym} {cat.spent.toFixed(0)}</Text>
                            <Text style={[styles.catPercent, { color: meta.color }]}>{cat.percentage}%</Text>
                          </View>
                          <View style={styles.catBarBg}>
                            <View style={[styles.catBarFill, { width: `${cat.percentage}%`, backgroundColor: meta.color }]} />
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Add button */}
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
              <Text style={styles.addBtnIcon}>＋</Text>
              <Text style={styles.addBtnText}>Add expense</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ─── TIMELINE TAB ─── */}
        {activeTab === 'Timeline' && (
          <View style={styles.sectionWrap}>
            {sortedDates.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>💸</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1A1A' }}>No expenses yet</Text>
                <Text style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Add your first expense</Text>
              </View>
            ) : (
              <View style={styles.timelineCard}>
                {sortedDates.map((dateKey, di) => {
                  const dayExpenses = expensesByDate[dateKey];
                  const dayTotal = dayExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
                  return (
                    <View key={dateKey}>
                      {di > 0 && <View style={styles.timelineDivider} />}
                      <View style={styles.timelineDateRow}>
                        <Text style={styles.timelineDateLabel}>{formatDateLabel(dateKey)}</Text>
                        <Text style={styles.timelineDateTotal}>{sym} {dayTotal.toFixed(0)}</Text>
                      </View>
                      {dayExpenses.map(expense => {
                        const meta = CATEGORY_META[expense.category] ?? CATEGORY_META.other;
                        const paidByName = getMemberName(expense.paid_by);
                        const splitCount = expense.split_with?.length ?? 0;
                        return (
                          <TouchableOpacity key={expense.id} style={styles.timelineItem} onLongPress={() => {
                          Alert.alert(expense.title, 'What would you like to do?', [
                            { text: 'Edit', onPress: () => setEditExpense(expense) },
                            { text: 'Delete', style: 'destructive', onPress: () => handleDeleteExpense(expense.id) },
                            { text: 'Cancel', style: 'cancel' },
                          ]);
                        }}>
                            <View style={[styles.timelineIcon, { backgroundColor: meta.bg }]}>
                              <Text style={{ fontSize: 16 }}>{meta.emoji}</Text>
                            </View>
                            <View style={styles.timelineInfo}>
                              <Text style={styles.timelineTitle}>{expense.title}</Text>
                              <Text style={styles.timelineCategory}>
                                {meta.label}
                                {expense.local_currency ? ` · ${expense.local_amount} ${expense.local_currency}` : ''}
                                {splitCount > 0 ? ` · Split ${splitCount + 1} ways` : ''}
                              </Text>
                              {members.length > 1 && expense.paid_by && (
                                <Text style={styles.timelinePaidBy}>👤 {paidByName}</Text>
                              )}
                            </View>
                           <Text style={styles.timelineAmount}>{sym} {Number(expense.amount).toFixed(0)}</Text>
                        </TouchableOpacity>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            )}

            <TouchableOpacity style={[styles.addBtn, { marginTop: 8 }]} onPress={() => setShowAddModal(true)}>
              <Text style={styles.addBtnIcon}>＋</Text>
              <Text style={styles.addBtnText}>Add expense</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── SETTLEMENT TAB ─── */}
        {activeTab === 'Settlement' && (
          <View style={styles.sectionWrap}>
            {members.length < 2 ? (
              <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>👥</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1A1A' }}>Add travel companions</Text>
                <Text style={{ fontSize: 13, color: '#888', marginTop: 4, textAlign: 'center' }}>Invite members to your trip to track shared expenses</Text>
              </View>
            ) : (
              <>
                {/* Balances */}
                <Text style={styles.sectionTitle}>💰 BALANCES</Text>
                <View style={styles.balanceCard}>
                  {members.map(m => {
                    const bal = balance[m.id] ?? 0;
                    const isPositive = bal > 0.01;
                    const isNegative = bal < -0.01;
                    return (
                      <View key={m.id} style={styles.balanceRow}>
                        <View style={styles.balanceAvatar}>
                          <Text style={{ fontSize: 18 }}>👤</Text>
                        </View>
                        <Text style={styles.balanceName}>{m.name ?? m.email ?? 'Unknown'}</Text>
                        <Text style={[
                          styles.balanceAmount,
                          isPositive && { color: '#4CAF50' },
                          isNegative && { color: '#F44336' },
                        ]}>
                          {isPositive ? '+' : ''}{sym} {bal.toFixed(0)}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {/* Settlement */}
                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>🤝 WHO PAYS WHOM</Text>
                {debts.length === 0 ? (
                  <View style={styles.settledCard}>
                    <Text style={{ fontSize: 32, marginBottom: 8 }}>✅</Text>
                    <Text style={styles.settledText}>All settled up!</Text>
                    <Text style={styles.settledSub}>No payments needed</Text>
                  </View>
                ) : (
                  <View style={styles.debtsCard}>
                    {debts.map((debt, i) => (
                      <View key={i} style={[styles.debtRow, i < debts.length - 1 && styles.debtRowBorder]}>
                        <View style={styles.debtAvatars}>
                          <Text style={{ fontSize: 20 }}>👤</Text>
                          <Text style={styles.debtArrow}>→</Text>
                          <Text style={{ fontSize: 20 }}>👤</Text>
                        </View>
                        <View style={styles.debtInfo}>
                          <Text style={styles.debtText}>
                            <Text style={styles.debtName}>{getMemberName(debt.from)}</Text>
                            {' owes '}
                            <Text style={styles.debtName}>{getMemberName(debt.to)}</Text>
                          </Text>
                        </View>
                        <Text style={styles.debtAmount}>{sym} {debt.amount.toFixed(0)}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

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
  safe: { flex: 1, backgroundColor: '#F0F0F0' },
  scroll: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#1A1A1A' },
  headerTrip: { fontSize: 13, fontWeight: '600', color: '#4CAF50', marginTop: 1 },
  addHeaderBtn: { backgroundColor: '#4CAF50', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  addHeaderBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  tabRow: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingHorizontal: 16, gap: 8, paddingVertical: 8 },
  tab: { paddingHorizontal: 18, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F0F0F0' },
  tabActive: { backgroundColor: '#4CAF50' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#666' },
  tabTextActive: { color: '#fff' },
  heroCard: { margin: 16, marginBottom: 8, backgroundColor: '#1A1A2E', borderRadius: 20, padding: 20 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  heroLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
  heroAmount: { fontSize: 36, fontWeight: '900', color: '#fff' },
  heroDaysWrap: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  heroDaysNum: { fontSize: 24, fontWeight: '900', color: '#fff' },
  heroDaysLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  progressBarWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  progressBarBg: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 4 },
  progressPercent: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.8)', width: 36, textAlign: 'right' },
  heroStats: { flexDirection: 'row', alignItems: 'center' },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatValue: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 2 },
  heroStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  heroStatDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.15)' },
  sectionWrap: { marginHorizontal: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#888', letterSpacing: 0.8, marginBottom: 10 },
  insightsGrid: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  insightCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 12, alignItems: 'center', gap: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  insightEmoji: { fontSize: 20 },
  insightValue: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  insightLabel: { fontSize: 10, color: '#888', fontWeight: '600' },
  insightAlert: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  insightAlertText: { fontSize: 13, fontWeight: '600' },
  categoriesCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  categoryLegend: { flex: 1, gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { flex: 1, fontSize: 12, color: '#555', fontWeight: '500' },
  legendValue: { fontSize: 12, color: '#888', fontWeight: '600' },
  catDivider: { height: 1, backgroundColor: '#F5F5F5', marginBottom: 12 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 8 },
  catContent: { flex: 1 },
  catHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  catName: { flex: 1, fontSize: 13, fontWeight: '600', color: '#1A1A1A' },
  catAmount: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', marginRight: 6 },
  catPercent: { fontSize: 11, fontWeight: '700', width: 32, textAlign: 'right' },
  catBarBg: { height: 4, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 2, overflow: 'hidden' },
  catBarFill: { height: '100%', borderRadius: 2 },
  timelineCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  timelineDivider: { height: 1, backgroundColor: '#F5F5F5', marginVertical: 12 },
  timelineDateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  timelineDateLabel: { fontSize: 13, fontWeight: '800', color: '#1A1A1A' },
  timelineDateTotal: { fontSize: 13, fontWeight: '700', color: '#4CAF50' },
  timelineItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  timelineIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  timelineInfo: { flex: 1 },
  timelineTitle: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  timelineCategory: { fontSize: 11, color: '#888', marginTop: 1 },
  timelinePaidBy: { fontSize: 11, color: '#4CAF50', marginTop: 2, fontWeight: '600' },
  timelineAmount: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, marginHorizontal: 0, marginBottom: 8, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#E0E0E0', borderStyle: 'dashed' },
  addBtnIcon: { fontSize: 18, color: '#4CAF50', fontWeight: '700' },
  addBtnText: { fontSize: 14, fontWeight: '600', color: '#4CAF50' },
  balanceCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1, marginBottom: 8 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  balanceAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  balanceName: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  balanceAmount: { fontSize: 15, fontWeight: '800', color: '#888' },
  settledCard: { backgroundColor: '#E8F5E9', borderRadius: 16, padding: 24, alignItems: 'center' },
  settledText: { fontSize: 18, fontWeight: '800', color: '#2E7D32' },
  settledSub: { fontSize: 13, color: '#4CAF50', marginTop: 4 },
  debtsCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  debtRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  debtRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  debtAvatars: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  debtArrow: { fontSize: 14, color: '#888' },
  debtInfo: { flex: 1 },
  debtText: { fontSize: 14, color: '#555' },
  debtName: { fontWeight: '700', color: '#1A1A1A' },
  debtAmount: { fontSize: 16, fontWeight: '900', color: '#F44336' },
});
