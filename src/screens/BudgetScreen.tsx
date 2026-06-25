import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import BudgetDonut from '../components/BudgetDonut';
import { Sparkle, Dot } from '../components/TravelDecorations';
import { PASTEL } from '../data/colors';
import { supabase } from '../lib/supabase';
import { useCurrentTrip, currentTripIdRef } from '../context/TripContext';

function WalletEmoji() {
  return <Text style={{ fontSize: 40 }}>👛</Text>; // TODO: replace with local asset
}

function CategoryIcon({ color }: { color: string }) {
  return (
    <View style={[styles.catIcon, { backgroundColor: color }]}>
      <Text style={{ fontSize: 10, color: '#fff', fontWeight: '800' }}>■</Text>
    </View>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  food: '#FF9800',
  transport: '#2196F3',
  accommodation: '#9C27B0',
  activity: '#4CAF50',
  flight: '#00BCD4',
  shopping: '#F44336',
  other: '#888888',
};

const CATEGORY_PASTEL_BG: Record<string, string> = {
  food: PASTEL.food,
  transport: PASTEL.flights,
  accommodation: PASTEL.accommodation,
  activity: PASTEL.activities,
  shopping: PASTEL.shopping ?? '#FFF3E0',
};

const EXPENSE_CATEGORIES = [
  { label: 'food', emoji: '🍜' },
  { label: 'transport', emoji: '🚗' },
  { label: 'accommodation', emoji: '🏨' },
  { label: 'activity', emoji: '🎯' },
  { label: 'flight', emoji: '✈️' },
  { label: 'shopping', emoji: '🛍️' },
  { label: 'other', emoji: '📦' },
];

const EXPENSE_EMOJIS: Record<string, string> = {
  food: '🍜', transport: '🚗', accommodation: '🏨',
  activity: '🎯', flight: '✈️', shopping: '🛍️', other: '📦',
};

function AddExpenseModal({
  visible,
  onClose,
  tripId,
  onAdded,
}: {
  visible: boolean;
  onClose: () => void;
  tripId: string;
  onAdded: () => void;
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
    if (!user) return;

    const { error } = await supabase.from('expenses').insert({
      trip_id: tripId,
      title: title.trim(),
      amount: parseFloat(amount),
      currency: 'EUR',
      category,
      date: new Date().toISOString(),
      paid_by: user.id,
      notes: notes || null,
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setTitle('');
      setAmount('');
      setCategory('food');
      setNotes('');
      onAdded();
      onClose();
    }
    setSaving(false);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.bottomSheet} onPress={() => {}}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Add Expense</Text>

          <Text style={styles.fieldLabel}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Lunch at Warung"
            placeholderTextColor="#C0C0C0"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.fieldLabel}>Amount (€)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor="#C0C0C0"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />

          <Text style={styles.fieldLabel}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
            {EXPENSE_CATEGORIES.map((opt) => (
              <TouchableOpacity
                key={opt.label}
                style={[styles.catChip, category === opt.label && styles.catChipActive]}
                onPress={() => setCategory(opt.label)}
              >
                <Text style={{ fontSize: 16 }}>{opt.emoji}</Text>
                <Text style={[styles.catChipText, category === opt.label && styles.catChipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.fieldLabel}>Notes <Text style={styles.optional}>(optional)</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Add details..."
            placeholderTextColor="#C0C0C0"
            value={notes}
            onChangeText={setNotes}
          />

          <TouchableOpacity
            style={[styles.addBtn, (!title.trim() || !amount || saving) && styles.addBtnDisabled]}
            onPress={handleAdd}
            disabled={!title.trim() || !amount || saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.addBtnText}>Add Expense</Text>
            )}
          </TouchableOpacity>
          <View style={{ height: Platform.OS === 'ios' ? 34 : 20 }} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function BudgetScreen() {
  const navigation = useNavigation<any>();
  const { currentTripId } = useCurrentTrip();
  const route = useRoute<any>();
  const [trip, setTrip] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);


const loadData = React.useCallback(async (tripId?: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: memberships } = await supabase
    .from('trip_members')
    .select('trip_id')
    .eq('user_id', user.id);

  if (!memberships || memberships.length === 0) { setLoading(false); return; }

  const tripIds = memberships.map((m: any) => m.trip_id);
  let tripData: any = null;

  if (currentTripId) {
    const { data } = await supabase.from('trips').select('*').eq('id', currentTripId).single();
    tripData = data;
  } else {
    const { data: tripsData } = await supabase.from('trips').select('*').in('id', tripIds).eq('status', 'active').order('created_at', { ascending: false });
    tripData = tripsData?.[0] ?? null;
  }

  if (!tripData) { setLoading(false); return; }
  setTrip(tripData);

  const { data: expensesData } = await supabase
    .from('expenses')
    .select('*')
    .eq('trip_id', tripData.id)
    .order('date', { ascending: false });

  setExpenses(expensesData ?? []);
  setLoading(false);
}, []);

useFocusEffect(
    React.useCallback(() => {
      loadData(currentTripIdRef.current ?? route.params?.tripId);
    }, [])
  );

  // Calculate stats
  const totalBudget = trip?.budget ?? 0;
  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const remaining = totalBudget - totalSpent;
  const percentUsed = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  // Group by category
  const categoryTotals: Record<string, number> = {};
  for (const expense of expenses) {
    const cat = expense.category ?? 'other';
    categoryTotals[cat] = (categoryTotals[cat] ?? 0) + Number(expense.amount);
  }

  const categories = Object.entries(categoryTotals).map(([name, spent]) => ({
    name,
    spent,
    percentage: totalSpent > 0 ? Math.round((spent / totalSpent) * 100) : 0,
    color: CATEGORY_COLORS[name] ?? '#888',
  })).sort((a, b) => b.spent - a.spent);

  const recentExpenses = expenses.slice(0, 5);

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
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>💰</Text>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#1A1A1A' }}>No active trip</Text>
          <Text style={{ color: '#888', marginTop: 4 }}>Create a trip to track expenses</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Total budget card */}
        <View style={styles.totalCard}>
          <View style={styles.totalLeft}>
            <Text style={styles.totalAmount}>€{totalBudget.toLocaleString()}</Text>
            <Text style={styles.totalSub}>Total budget</Text>
          </View>
          <WalletEmoji />
        </View>

        {/* Progress card */}
        <View style={styles.progressCard}>
          <View style={styles.progressLeft}>
            <BudgetDonut percentage={percentUsed} size={130} strokeWidth={15} />
          </View>
          <View style={styles.progressRight}>
            <ProgressRow color="#4CAF50" label="Spent so far" value={`€${totalSpent.toFixed(0)}`} />
            <View style={styles.rowDivider} />
            <ProgressRow color="#FF9800" label="Remaining" value={`€${remaining.toFixed(0)}`} />
          </View>
        </View>

        {/* By category */}
        {categories.length > 0 && (
          <SectionBlock title="BY CATEGORY" headerColor="#AED581" textColor="#33691E" right={null}>
            {categories.map((cat) => {
              const bg = CATEGORY_PASTEL_BG[cat.name] ?? '#F5F5F5';
              return (
                <View key={cat.name} style={[styles.catCard, { backgroundColor: bg }]}>
                  <CategoryIcon color={cat.color} />
                  <View style={styles.catContent}>
                    <View style={styles.catHeaderRow}>
                      <Text style={styles.catName}>{cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}</Text>
                      <Text style={styles.catAmount}>€{cat.spent.toFixed(0)}</Text>
                      <Text style={styles.catPercent}>{cat.percentage}%</Text>
                    </View>
                    <View style={styles.progressBg}>
                      <View style={[styles.progressFill, { width: `${cat.percentage}%`, backgroundColor: cat.color }]} />
                    </View>
                  </View>
                </View>
              );
            })}
          </SectionBlock>
        )}

        {/* Recent expenses */}
        <SectionBlock
          title="RECENT EXPENSES"
          headerColor="#90CAF9"
          textColor="#0D47A1"
          right={<Text style={[styles.seeAll, { color: '#0D47A1' }]}>See all</Text>}
        >
          {recentExpenses.length === 0 ? (
            <Text style={{ padding: 16, color: '#888', textAlign: 'center' }}>No expenses yet</Text>
          ) : (
            recentExpenses.map((expense) => (
              <TouchableOpacity
                key={expense.id}
                style={styles.expenseRow}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 28 }}>{EXPENSE_EMOJIS[expense.category] ?? '📦'}</Text>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseName}>{expense.title}</Text>
                  <Text style={styles.expenseTime}>
                    {new Date(expense.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </Text>
                </View>
                <Text style={styles.expenseAmount}>€{Number(expense.amount).toFixed(0)}</Text>
              </TouchableOpacity>
            ))
          )}
        </SectionBlock>

        {/* Add expense button */}
        <TouchableOpacity style={styles.addExpenseBtn} onPress={() => setShowAddModal(true)}>
          <Text style={styles.addExpenseIcon}>＋</Text>
          <Text style={styles.addExpenseText}>Add expense</Text>
        </TouchableOpacity>

        <View style={styles.footerDecor}>
          <Dot color="#BBB" size={5} style={{ position: 'relative' }} />
          <Dot color="#BBB" size={4} style={{ position: 'relative', marginLeft: 8 }} />
          <Sparkle color="#FF9800" size={10} style={{ position: 'relative', marginLeft: 6 }} />
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>

      <AddExpenseModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        tripId={trip.id}
        onAdded={() => loadData(route.params?.tripId)}
      />
    </SafeAreaView>
  );
}

function ProgressRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <View style={styles.progressRow}>
      <View style={[styles.progressDot, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>{value}</Text>
      </View>
    </View>
  );
}

function SectionBlock({ title, headerColor, textColor, right, children }: {
  title: string; headerColor: string; textColor: string; right: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <View style={[styles.sectionBlock, { backgroundColor: headerColor, borderColor: headerColor }]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleWrap}>
          <Sparkle color={textColor} size={12} style={{ position: 'relative', marginRight: 6 }} />
          <Text style={[styles.sectionTitle, { color: textColor }]}>{title}</Text>
        </View>
        {right}
      </View>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#E8E8E8' },
  scroll: { flex: 1 },
  totalCard: { backgroundColor: '#fff', borderRadius: 20, marginHorizontal: 16, marginTop: 14, marginBottom: 10, paddingVertical: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E0E0E0', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  totalLeft: { flex: 1 },
  totalAmount: { fontSize: 52, fontWeight: '900', color: '#1A1A1A', lineHeight: 56 },
  totalSub: { fontSize: 14, color: '#888', marginTop: 4 },
  progressCard: { backgroundColor: '#fff', borderRadius: 20, marginHorizontal: 16, paddingVertical: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 24, borderWidth: 1, borderColor: '#E0E0E0', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, marginBottom: 8 },
  progressLeft: { alignItems: 'center', justifyContent: 'center' },
  progressRight: { flex: 1 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  progressDot: { width: 11, height: 11, borderRadius: 5.5, flexShrink: 0 },
  progressLabel: { fontSize: 12, color: '#888', marginBottom: 1 },
  progressValue: { fontSize: 17, fontWeight: '800', color: '#1A1A1A' },
  rowDivider: { height: 1, backgroundColor: '#F5F5F5', marginLeft: 21 },
  sectionBlock: { marginHorizontal: 16, marginTop: 16, borderRadius: 20, overflow: 'hidden', borderWidth: 3 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 24 },
  sectionTitleWrap: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  seeAll: { fontSize: 13, fontWeight: '600' },
  sectionCard: { backgroundColor: '#fff', borderRadius: 16, margin: 4, marginTop: -16, paddingHorizontal: 10, paddingVertical: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: -2 }, elevation: 3 },
  catCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 16, paddingVertical: 13, paddingHorizontal: 12, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  catIcon: { width: 22, height: 22, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  catContent: { flex: 1 },
  catHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 7 },
  catName: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', flex: 1 },
  catAmount: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginRight: 8 },
  catPercent: { fontSize: 12, color: '#888', width: 32, textAlign: 'right' },
  progressBg: { height: 6, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  expenseRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  expenseInfo: { flex: 1 },
  expenseName: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  expenseTime: { fontSize: 12, color: '#888', marginTop: 2 },
  expenseAmount: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  addExpenseBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, marginTop: 16, marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#E0E0E0', borderStyle: 'dashed' },
  addExpenseIcon: { fontSize: 20, color: '#4CAF50', fontWeight: '700' },
  addExpenseText: { fontSize: 15, fontWeight: '600', color: '#4CAF50' },
  footerDecor: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, maxHeight: '90%' },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 18 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#888', letterSpacing: 0.5, marginBottom: 6, marginTop: 12 },
  optional: { fontSize: 11, fontWeight: '400', color: '#BBB' },
  input: { backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1A1A1A', borderWidth: 1, borderColor: '#EBEBEB' },
  catRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#EBEBEB' },
  catChipActive: { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' },
  catChipText: { fontSize: 13, fontWeight: '600', color: '#666' },
  catChipTextActive: { color: '#4CAF50' },
  addBtn: { marginTop: 20, backgroundColor: '#4CAF50', borderRadius: 14, paddingVertical: 16, alignItems: 'center', shadowColor: '#4CAF50', shadowOpacity: 0.25, shadowRadius: 8, elevation: 3 },
  addBtnDisabled: { backgroundColor: '#C8E6C9', shadowOpacity: 0, elevation: 0 },
  addBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
