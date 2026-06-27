import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, Pressable, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import BudgetDonut from '../components/BudgetDonut';
import { Sparkle, Dot } from '../components/TravelDecorations';
import { PASTEL } from '../data/colors';
import { supabase } from '../lib/supabase';
import { useCurrentTrip, currentTripIdRef } from '../context/TripContext';

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORY_META: Record<string, { emoji: string; color: string; bg: string; label: string }> = {
  food:          { emoji: '🍜', color: '#FF9800', bg: '#FFF8E1', label: 'Food' },
  transport:     { emoji: '🚗', color: '#2196F3', bg: '#E3F2FD', label: 'Transport' },
  accommodation: { emoji: '🏨', color: '#9C27B0', bg: '#F3E5F5', label: 'Accommodation' },
  activity:      { emoji: '🎯', color: '#4CAF50', bg: '#E8F5E9', label: 'Activities' },
  flight:        { emoji: '✈️', color: '#00BCD4', bg: '#E0F7FA', label: 'Flights' },
  shopping:      { emoji: '🛍️', color: '#F44336', bg: '#FCE4EC', label: 'Shopping' },
  other:         { emoji: '📦', color: '#888888', bg: '#F5F5F5', label: 'Other' },
};

const EXPENSE_CATEGORIES = Object.entries(CATEGORY_META).map(([label, v]) => ({ label, emoji: v.emoji }));

function localDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getTodayStr(): string {
  const now = new Date();
  return localDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
}

function getYesterdayStr(): string {
  const now = new Date();
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  return localDateStr(yesterday);
}

// ─── Add Expense Modal ────────────────────────────────────────────────────────
function AddExpenseModal({ visible, onClose, tripId, currency, onAdded }: {
  visible: boolean; onClose: () => void; tripId: string; currency: string; onAdded: () => void;
}) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!title.trim() || !amount) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const { error } = await supabase.from('expenses').insert({
      trip_id: tripId,
      title: title.trim(),
      amount: parseFloat(amount),
      currency: currency || 'EUR',
      category,
      date: new Date().toISOString(),
      paid_by: user.id,
      notes: notes || null,
    });
    if (error) { Alert.alert('Error', error.message); }
    else {
      setTitle(''); setAmount(''); setCategory('food'); setNotes('');
      onAdded(); onClose();
    }
    setSaving(false);
  }

  const sym = currency || 'EUR';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={am.overlay}>
        <View style={am.sheet}>
          <View style={am.handle} />

          {/* Header */}
          <View style={am.header}>
            <TouchableOpacity onPress={onClose}><Text style={am.cancel}>Cancel</Text></TouchableOpacity>
            <Text style={am.title}>Add Expense</Text>
            <TouchableOpacity
              onPress={handleAdd}
              disabled={!title.trim() || !amount || saving}
              style={[am.saveBtn, (!title.trim() || !amount || saving) && am.saveBtnDisabled]}
            >
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={am.saveText}>Save</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={am.scroll}>
            {/* Amount — big and central */}
            <View style={am.amountWrap}>
              <Text style={am.amountCurrency}>{sym}</Text>
              <TextInput
                style={am.amountInput}
                placeholder="0.00"
                placeholderTextColor="#D0D0D0"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>

            <Text style={am.fieldLabel}>Title</Text>
            <TextInput style={am.input} placeholder="e.g. Lunch at Warung" placeholderTextColor="#C0C0C0" value={title} onChangeText={setTitle} />

            <Text style={am.fieldLabel}>Category</Text>
            <View style={am.catGrid}>
              {EXPENSE_CATEGORIES.map((opt) => {
                const meta = CATEGORY_META[opt.label];
                const active = category === opt.label;
                return (
                  <TouchableOpacity
                    key={opt.label}
                    style={[am.catChip, active && { backgroundColor: meta.bg, borderColor: meta.color }]}
                    onPress={() => setCategory(opt.label)}
                  >
                    <Text style={{ fontSize: 18 }}>{opt.emoji}</Text>
                    <Text style={[am.catLabel, active && { color: meta.color }]}>{meta.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={am.fieldLabel}>Notes <Text style={am.optional}>(optional)</Text></Text>
            <TextInput style={[am.input, am.textArea]} placeholder="Add details..." placeholderTextColor="#C0C0C0" value={notes} onChangeText={setNotes} multiline numberOfLines={2} />
            <View style={{ height: 24 }} />
          </ScrollView>

          {/* Sticky bottom button */}
          <View style={am.stickyBottom}>
            <TouchableOpacity
              style={[am.addBtn, (!title.trim() || !amount || saving) && am.addBtnDisabled]}
              onPress={handleAdd}
              disabled={!title.trim() || !amount || saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={am.addBtnText}>＋ Add Expense</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const am = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '90%' },
  handle: { width: 36, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  title: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  cancel: { fontSize: 15, color: '#888', fontWeight: '500' },
  saveBtn: { backgroundColor: '#4CAF50', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
  saveBtnDisabled: { backgroundColor: '#C8E6C9' },
  saveText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  amountWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 24, gap: 4 },
  amountCurrency: { fontSize: 28, fontWeight: '700', color: '#888', marginTop: 8 },
  amountInput: { fontSize: 56, fontWeight: '900', color: '#1A1A1A', minWidth: 120, textAlign: 'center' },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#888', letterSpacing: 0.5, marginBottom: 8, marginTop: 16 },
  optional: { fontWeight: '400', color: '#BBB' },
  input: { backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#1A1A1A', borderWidth: 1, borderColor: '#EBEBEB' },
  textArea: { height: 70, textAlignVertical: 'top' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#F5F5F5', borderWidth: 1.5, borderColor: '#EBEBEB' },
  catLabel: { fontSize: 12, fontWeight: '600', color: '#666' },
  stickyBottom: { padding: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0', backgroundColor: '#fff' },
  addBtn: { backgroundColor: '#4CAF50', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  addBtnDisabled: { backgroundColor: '#C8E6C9' },
  addBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function BudgetScreen() {
  const navigation = useNavigation<any>();
  const { currentTripId } = useCurrentTrip();
  const route = useRoute<any>();

  const [trip, setTrip] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const loadData = useCallback(async (tripId?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

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

    const { data: expensesData } = await supabase
      .from('expenses').select('*').eq('trip_id', tripData.id).order('date', { ascending: false });
    setExpenses(expensesData ?? []);
    setLoading(false);
  }, [currentTripId]);

  useFocusEffect(useCallback(() => {
    loadData(currentTripIdRef.current ?? route.params?.tripId);
  }, []));

  // ─── Calculations ─────────────────────────────────────────────────────────
  const totalBudget = trip?.budget ?? 0;
  const currency = trip?.currency ?? 'EUR';
  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const remaining = totalBudget - totalSpent;
  const percentUsed = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  // Day calculations
  const today = getTodayStr();
  const yesterday = getYesterdayStr();

  const todaySpent = expenses
    .filter(e => e.date?.startsWith(today))
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const yesterdaySpent = expenses
    .filter(e => e.date?.startsWith(yesterday))
    .reduce((sum, e) => sum + Number(e.amount), 0);

  // Days elapsed in trip
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

  // Categories
  const categoryTotals: Record<string, number> = {};
  for (const expense of expenses) {
    const cat = expense.category ?? 'other';
    categoryTotals[cat] = (categoryTotals[cat] ?? 0) + Number(expense.amount);
  }
  const categories = Object.entries(categoryTotals)
    .map(([name, spent]) => ({
      name,
      spent,
      percentage: totalSpent > 0 ? Math.round((spent / totalSpent) * 100) : 0,
    }))
    .sort((a, b) => b.spent - a.spent);

  // Daily timeline — group expenses by date
  const expensesByDate: Record<string, any[]> = {};
  for (const expense of expenses) {
    const dateKey = expense.date?.split('T')[0] ?? 'unknown';
    if (!expensesByDate[dateKey]) expensesByDate[dateKey] = [];
    expensesByDate[dateKey].push(expense);
  }
  const sortedDates = Object.keys(expensesByDate).sort((a, b) => b.localeCompare(a)).slice(0, 5);

  function formatDateLabel(dateStr: string): string {
    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    } catch { return dateStr; }
  }

  const sym = currency;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      </SafeAreaView>
    );
  }

  if (!trip) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
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
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Budget</Text>
          <Text style={styles.headerTrip} numberOfLines={1}>{trip.name}</Text>
        </View>
        <TouchableOpacity style={styles.addHeaderBtn} onPress={() => setShowAddModal(true)}>
          <Text style={styles.addHeaderBtnText}>＋ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ─── Hero Budget Card ─── */}
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

          {/* Progress bar */}
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

        {/* ─── Spending Insights ─── */}
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
                  ? `⚠️ Spending ${sym} ${Math.abs(overUnder).toFixed(0)}/day more than planned`
                  : `✅ On track — ${sym} ${Math.abs(overUnder).toFixed(0)}/day under budget`}
              </Text>
            </View>
          )}
        </View>

        {/* ─── Donut + Categories ─── */}
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

        {/* ─── Daily Timeline ─── */}
        {sortedDates.length > 0 && (
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>🗓 DAILY TIMELINE</Text>
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
                    {dayExpenses.map((expense, ei) => {
                      const meta = CATEGORY_META[expense.category] ?? CATEGORY_META.other;
                      return (
                        <View key={expense.id} style={styles.timelineItem}>
                          <View style={[styles.timelineIcon, { backgroundColor: meta.bg }]}>
                            <Text style={{ fontSize: 16 }}>{meta.emoji}</Text>
                          </View>
                          <View style={styles.timelineInfo}>
                            <Text style={styles.timelineTitle}>{expense.title}</Text>
                            <Text style={styles.timelineCategory}>{meta.label}</Text>
                          </View>
                          <Text style={styles.timelineAmount}>{sym} {Number(expense.amount).toFixed(0)}</Text>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ─── Add Expense Button ─── */}
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Text style={styles.addBtnIcon}>＋</Text>
          <Text style={styles.addBtnText}>Add expense</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      <AddExpenseModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        tripId={trip.id}
        currency={currency}
        onAdded={() => loadData(route.params?.tripId)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F0F0' },
  scroll: { flex: 1 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#1A1A1A' },
  headerTrip: { fontSize: 13, fontWeight: '600', color: '#4CAF50', marginTop: 1 },
  addHeaderBtn: { backgroundColor: '#4CAF50', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  addHeaderBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // Hero Card
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

  // Section
  sectionWrap: { marginHorizontal: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#888', letterSpacing: 0.8, marginBottom: 10 },

  // Insights
  insightsGrid: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  insightCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 12, alignItems: 'center', gap: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  insightEmoji: { fontSize: 20 },
  insightValue: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  insightLabel: { fontSize: 10, color: '#888', fontWeight: '600' },
  insightAlert: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  insightAlertText: { fontSize: 13, fontWeight: '600' },

  // Categories
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

  // Timeline
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
  timelineAmount: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },

  // Add button
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, marginHorizontal: 16, marginBottom: 8, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#E0E0E0', borderStyle: 'dashed' },
  addBtnIcon: { fontSize: 18, color: '#4CAF50', fontWeight: '700' },
  addBtnText: { fontSize: 14, fontWeight: '600', color: '#4CAF50' },
});
