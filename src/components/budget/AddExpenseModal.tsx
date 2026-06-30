import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, Alert,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import CategoryPickerModal, { getCategoryDef } from './CategoryPickerModal';

// ─── Exchange rate (unchanged business logic) ─────────────────────────────────
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

// ─── Title placeholder per category — small UX polish, no logic change ───────
const TITLE_PLACEHOLDERS: Record<string, string> = {
  food: 'e.g. Dinner at Street Food Market',
  coffee: 'e.g. Starbucks',
  drinks: 'e.g. Rooftop bar',
  groceries: 'e.g. 7-Eleven',
  transport: 'e.g. Grab to Airport',
  flight: 'e.g. Bangkok → Bali',
  accommodation: 'e.g. Hilton Bangkok',
  activity: 'e.g. Cooking class',
  attraction: 'e.g. Grand Palace entry',
  shopping: 'e.g. Chatuchak Market',
  exchange_fees: 'e.g. Currency exchange',
  atm_fees: 'e.g. ATM withdrawal fee',
  laundry: 'e.g. Hotel laundry service',
  other: 'e.g. Miscellaneous',
  other_income: 'e.g. Refund',
  salary: 'e.g. Freelance payment',
  gifts: 'e.g. Birthday gift received',
};

interface DestinationContext {
  name: string;
  country: string | null;
  dayNumber: number;
  totalDays: number;
  dateLabel: string;
  isCurrent: boolean;
  heroEmoji: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  tripId: string;
  currency: string;
  members: any[];
  currentUserId: string;
  onAdded: () => void;
  editData?: any | null;
  destinationContext?: DestinationContext | null;
}

export default function AddExpenseModal({
  visible, onClose, tripId, currency, members, currentUserId, onAdded, editData, destinationContext,
}: Props) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [saving, setSaving] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const [paidBy, setPaidBy] = useState(currentUserId);
  const [splitWith, setSplitWith] = useState<string[]>([]);

  const [useLocalCurrency, setUseLocalCurrency] = useState(false);
  const [localAmount, setLocalAmount] = useState('');
  const [localCurrency, setLocalCurrency] = useState('');
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    if (visible) {
      if (editData) {
        setTitle(editData.title ?? '');
        setAmount(String(editData.amount ?? ''));
        setCategory(editData.category ?? 'food');
        setNotes(editData.notes ?? '');
        setLocation(editData.location ?? '');
        setPaymentMethod(editData.payment_method === 'card' ? 'card' : 'cash');
        setPaidBy(editData.paid_by ?? currentUserId);
        setSplitWith(editData.split_with ?? []);
      } else {
        setTitle(''); setAmount(''); setCategory('food'); setNotes(''); setLocation('');
        setPaidBy(currentUserId);
        setSplitWith([]);
        setPaymentMethod('cash');
      }
      setUseLocalCurrency(false);
      setLocalAmount('');
      setLocalCurrency('');
      setConvertedAmount(null);
    }
  }, [visible, currentUserId, editData]);

  async function handleConvert() {
    if (!localAmount || !localCurrency) return;
    setConverting(true);
    const rate = await getExchangeRate(localCurrency.toUpperCase(), currency);
    const converted = parseFloat(localAmount) * rate;
    setConvertedAmount(converted);
    setAmount(converted.toFixed(2));
    setConverting(false);
  }

  function toggleSplit(memberId: string) {
    setSplitWith(prev =>
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );
  }

  async function handleAdd() {
    if (!title.trim() || !amount) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const payload = {
      title: title.trim(),
      amount: parseFloat(amount),
      currency: currency || 'EUR',
      category,
      paid_by: paidBy,
      notes: notes || null,
      location: location || null,
      payment_method: paymentMethod,
      split_with: splitWith.length > 0 ? splitWith : null,
      local_amount: useLocalCurrency && localAmount ? parseFloat(localAmount) : null,
      local_currency: useLocalCurrency && localCurrency ? localCurrency.toUpperCase() : null,
    };

    let error: any = null;
    if (editData?.id) {
      const res = await supabase.from('expenses').update(payload).eq('id', editData.id);
      error = res.error;
    } else {
      const res = await supabase.from('expenses').insert({ ...payload, trip_id: tripId, date: new Date().toISOString() });
      error = res.error;
    }

    if (error) { Alert.alert('Error', error.message); }
    else {
      setTitle(''); setAmount(''); setCategory('food'); setNotes(''); setLocation('');
      setSplitWith([]); setLocalAmount(''); setLocalCurrency('');
      setConvertedAmount(null); setUseLocalCurrency(false);
      onAdded(); onClose();
    }
    setSaving(false);
  }

  const sym = currency || 'EUR';
  const canSave = title.trim() && amount && !saving;
  const categoryDef = getCategoryDef(category);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
            <Text style={styles.title}>{editData ? 'Edit Expense' : 'Add Expense'}</Text>
            <TouchableOpacity
              onPress={handleAdd}
              disabled={!canSave}
              style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
            >
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveText}>Save</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={styles.scroll}>

            {/* Destination Context Card */}
            {destinationContext && (
              <View style={styles.destCard}>
                <View style={styles.destImageWrap}>
                  <Text style={styles.destEmoji}>{destinationContext.heroEmoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.destName} numberOfLines={1}>
                    {destinationContext.name}{destinationContext.country ? `, ${destinationContext.country}` : ''}
                  </Text>
                  <Text style={styles.destMeta}>
                    📅 Day {destinationContext.dayNumber} · {destinationContext.dateLabel}
                  </Text>
                  {destinationContext.isCurrent && (
                    <View style={styles.destBadge}>
                      <Text style={styles.destBadgeText}>📍 Current destination</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Amount Card */}
            <View style={styles.amountCard}>
              <View style={styles.amountTopRow}>
                <View style={styles.walletIconWrap}>
                  <Text style={{ fontSize: 18 }}>👛</Text>
                </View>
                <View style={styles.amountInputRow}>
                  <Text style={styles.amountCurrency}>{sym}</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0.00"
                    placeholderTextColor="#D8D0C6"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                    autoFocus={!editData}
                  />
                </View>
                <View style={styles.currencyBadge}>
                  <Text style={styles.currencyBadgeText}>{sym} ▾</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.localCurrencyPill, useLocalCurrency && styles.localCurrencyPillActive]}
                onPress={() => setUseLocalCurrency(v => !v)}
              >
                <Text style={[styles.localCurrencyPillText, useLocalCurrency && { color: '#fff' }]}>
                  🔄 {useLocalCurrency ? 'Using local currency' : 'Paid in local currency'}
                </Text>
              </TouchableOpacity>

              {useLocalCurrency && (
                <View style={styles.localCurrencyWrap}>
                  <View style={styles.localRow}>
                    <TextInput
                      style={[styles.localInput, { flex: 2 }]}
                      placeholder="Amount paid"
                      placeholderTextColor="#C0C0C0"
                      value={localAmount}
                      onChangeText={setLocalAmount}
                      keyboardType="decimal-pad"
                    />
                    <TextInput
                      style={[styles.localInput, { flex: 1 }]}
                      placeholder="THB"
                      placeholderTextColor="#C0C0C0"
                      value={localCurrency}
                      onChangeText={text => setLocalCurrency(text.toUpperCase())}
                      autoCapitalize="characters"
                      maxLength={3}
                    />
                    <TouchableOpacity
                      style={[styles.convertBtn, (!localAmount || !localCurrency) && styles.convertBtnDisabled]}
                      onPress={handleConvert}
                      disabled={!localAmount || !localCurrency || converting}
                    >
                      {converting
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <Text style={styles.convertBtnText}>Convert</Text>
                      }
                    </TouchableOpacity>
                  </View>
                  {convertedAmount !== null && (
                    <Text style={styles.convertedText}>≈ {sym} {convertedAmount.toFixed(2)}</Text>
                  )}
                </View>
              )}
            </View>

            {/* Category selector row */}
            <Text style={styles.fieldLabel}>Category</Text>
            <TouchableOpacity
              style={styles.categorySelectorRow}
              onPress={() => setShowCategoryPicker(true)}
              activeOpacity={0.8}
            >
              <View style={[styles.categoryIconWrap, { backgroundColor: categoryDef.bg }]}>
                <Text style={{ fontSize: 18 }}>{categoryDef.emoji}</Text>
              </View>
              <Text style={styles.categorySelectorText}>{categoryDef.label}</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            {/* Title */}
            <Text style={styles.fieldLabel}>Title <Text style={styles.optional}>(optional)</Text></Text>
            <View style={styles.inputCard}>
              <Text style={styles.inputIcon}>📝</Text>
              <TextInput
                style={styles.inputCardField}
                placeholder={TITLE_PLACEHOLDERS[category] ?? 'e.g. Expense title'}
                placeholderTextColor="#C0C0C0"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Payment method */}
            <Text style={styles.fieldLabel}>Payment Method</Text>
            <View style={styles.paymentRow}>
              <TouchableOpacity
                style={[styles.paymentOption, paymentMethod === 'cash' && styles.paymentOptionActive]}
                onPress={() => setPaymentMethod('cash')}
                activeOpacity={0.8}
              >
                <View style={[styles.radioOuter, paymentMethod === 'cash' && styles.radioOuterActive]}>
                  {paymentMethod === 'cash' && <View style={styles.radioInner} />}
                </View>
                <Text style={{ fontSize: 16 }}>💵</Text>
                <Text style={styles.paymentLabel}>Cash</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.paymentOption, paymentMethod === 'card' && styles.paymentOptionActive]}
                onPress={() => setPaymentMethod('card')}
                activeOpacity={0.8}
              >
                <View style={[styles.radioOuter, paymentMethod === 'card' && styles.radioOuterActive]}>
                  {paymentMethod === 'card' && <View style={styles.radioInner} />}
                </View>
                <Text style={{ fontSize: 16 }}>💳</Text>
                <Text style={styles.paymentLabel}>Card</Text>
              </TouchableOpacity>
            </View>

            {/* Paid by */}
            {members.length > 1 && (
              <>
                <Text style={styles.fieldLabel}>Paid by</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.memberRow}>
                  {members.map(m => {
                    const isSelected = paidBy === m.id;
                    return (
                      <TouchableOpacity
                        key={m.id}
                        style={[styles.memberChip, isSelected && styles.memberChipActive]}
                        onPress={() => setPaidBy(m.id)}
                      >
                        <Text style={{ fontSize: 16 }}>👤</Text>
                        <Text style={[styles.memberChipText, isSelected && styles.memberChipTextActive]}>
                          {m.name ?? m.email ?? 'Unknown'}
                        </Text>
                        {isSelected && <Text style={{ color: '#4CAF50', fontSize: 12 }}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {/* Split with */}
            {members.length > 1 && (
              <>
                <Text style={styles.fieldLabel}>Split with</Text>
                <Text style={styles.fieldSub}>Select who shares this expense equally</Text>
                <View style={styles.splitGrid}>
                  {members.map(m => {
                    const isSelected = splitWith.includes(m.id);
                    return (
                      <TouchableOpacity
                        key={m.id}
                        style={[styles.splitChip, isSelected && styles.splitChipActive]}
                        onPress={() => toggleSplit(m.id)}
                      >
                        <Text style={{ fontSize: 16 }}>👤</Text>
                        <Text style={[styles.splitChipText, isSelected && styles.splitChipTextActive]}>
                          {m.name ?? m.email ?? 'Unknown'}
                        </Text>
                        {isSelected && (
                          <Text style={styles.splitAmount}>
                            {sym} {(parseFloat(amount || '0') / (splitWith.length + 1)).toFixed(0)}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {splitWith.length > 0 && (
                  <View style={styles.splitSummary}>
                    <Text style={styles.splitSummaryText}>
                      Split equally between {splitWith.length + 1} people
                      · {sym} {(parseFloat(amount || '0') / (splitWith.length + 1)).toFixed(2)} each
                    </Text>
                  </View>
                )}
              </>
            )}

            {/* Location */}
            <Text style={styles.fieldLabel}>Location <Text style={styles.optional}>(optional)</Text></Text>
            <View style={styles.inputCard}>
              <Text style={styles.inputIcon}>📍</Text>
              <TextInput
                style={styles.inputCardField}
                placeholder="e.g. Chatuchak Market, Bangkok"
                placeholderTextColor="#C0C0C0"
                value={location}
                onChangeText={setLocation}
              />
              <Text style={styles.mapIcon}>🗺️</Text>
            </View>

            {/* Notes */}
            <Text style={styles.fieldLabel}>Notes <Text style={styles.optional}>(optional)</Text></Text>
            <View style={[styles.inputCard, styles.textAreaCard]}>
              <Text style={styles.inputIcon}>🗒️</Text>
              <TextInput
                style={[styles.inputCardField, styles.textArea]}
                placeholder="Add any extra details..."
                placeholderTextColor="#C0C0C0"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={{ height: 24 }} />
          </ScrollView>

          {/* Sticky bottom button */}
          <View style={styles.stickyBottom}>
            <TouchableOpacity
              style={[styles.addBtn, !canSave && styles.addBtnDisabled]}
              onPress={handleAdd}
              disabled={!canSave}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.addBtnText}>{editData ? 'Save Changes' : '＋ Add Expense'}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <CategoryPickerModal
        visible={showCategoryPicker}
        selected={category}
        onSelect={setCategory}
        onClose={() => setShowCategoryPicker(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFF8F0', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '95%' },
  handle: { width: 36, height: 4, backgroundColor: '#E5DFD7', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 17, fontWeight: '800', color: '#1A1A1A' },
  cancel: { fontSize: 15, color: '#4CAF50', fontWeight: '600' },
  saveBtn: { backgroundColor: '#4CAF50', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
  saveBtnDisabled: { backgroundColor: '#C8E6C9' },
  saveText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  scroll: { flex: 1, paddingHorizontal: 16 },

  // Destination context card
  destCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff',
    borderRadius: 18, padding: 12, marginTop: 8, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  destImageWrap: { width: 56, height: 56, borderRadius: 14, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' },
  destEmoji: { fontSize: 28 },
  destName: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  destMeta: { fontSize: 12, color: '#8A817A', marginTop: 3, fontWeight: '600' },
  destBadge: { backgroundColor: '#E8F5E9', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 6 },
  destBadgeText: { fontSize: 10, fontWeight: '700', color: '#2E7D32' },

  // Amount card — dominant focus
  amountCard: {
    backgroundColor: '#fff', borderRadius: 22, padding: 18, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, elevation: 2,
  },
  amountTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  walletIconWrap: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' },
  amountInputRow: { flex: 1, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 4 },
  amountCurrency: { fontSize: 22, fontWeight: '800', color: '#4CAF50' },
  amountInput: { fontSize: 40, fontWeight: '900', color: '#1A1A1A', minWidth: 110, textAlign: 'center' },
  currencyBadge: { backgroundColor: '#F0EBE5', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 },
  currencyBadgeText: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
  localCurrencyPill: { alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: '#4CAF50' },
  localCurrencyPillActive: { backgroundColor: '#4CAF50' },
  localCurrencyPillText: { fontSize: 13, fontWeight: '700', color: '#4CAF50' },
  localCurrencyWrap: { marginTop: 12 },
  localRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 6 },
  localInput: { backgroundColor: '#F0EBE5', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: '#1A1A1A' },
  convertBtn: { backgroundColor: '#3F51B5', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11 },
  convertBtnDisabled: { backgroundColor: '#C5CAE9' },
  convertBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  convertedText: { fontSize: 14, fontWeight: '700', color: '#4CAF50', textAlign: 'center' },

  fieldLabel: { fontSize: 13, fontWeight: '800', color: '#1A1A1A', marginBottom: 8, marginTop: 14 },
  fieldSub: { fontSize: 11, color: '#B0A89E', marginBottom: 8, marginTop: -4 },
  optional: { fontWeight: '400', color: '#B0A89E' },

  // Category selector
  categorySelectorRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff',
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  categoryIconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  categorySelectorText: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  chevron: { fontSize: 20, color: '#C8BFB5', fontWeight: '300' },

  // Generic input card
  inputCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff',
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 13,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  textAreaCard: { alignItems: 'flex-start' },
  inputIcon: { fontSize: 15, marginTop: 2 },
  inputCardField: { flex: 1, fontSize: 15, color: '#1A1A1A' },
  textArea: { minHeight: 60, textAlignVertical: 'top' },
  mapIcon: { fontSize: 18 },

  // Payment method
  paymentRow: { flexDirection: 'row', gap: 10 },
  paymentOption: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 13,
    borderWidth: 1.5, borderColor: 'transparent',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  paymentOptionActive: { borderColor: '#4CAF50' },
  radioOuter: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#D8D0C6', alignItems: 'center', justifyContent: 'center' },
  radioOuterActive: { borderColor: '#4CAF50' },
  radioInner: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: '#4CAF50' },
  paymentLabel: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },

  // Members / split (unchanged styling philosophy, refreshed colors)
  memberRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  memberChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#F0EBE5' },
  memberChipActive: { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' },
  memberChipText: { fontSize: 13, fontWeight: '600', color: '#666' },
  memberChipTextActive: { color: '#4CAF50' },
  splitGrid: { gap: 8 },
  splitChip: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#F0EBE5' },
  splitChipActive: { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' },
  splitChipText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#666' },
  splitChipTextActive: { color: '#4CAF50' },
  splitAmount: { fontSize: 12, fontWeight: '700', color: '#4CAF50' },
  splitSummary: { backgroundColor: '#E8F5E9', borderRadius: 12, padding: 10, marginTop: 8 },
  splitSummaryText: { fontSize: 12, fontWeight: '600', color: '#2E7D32', textAlign: 'center' },

  stickyBottom: { padding: 16, backgroundColor: '#FFF8F0' },
  addBtn: { backgroundColor: '#4CAF50', borderRadius: 18, paddingVertical: 17, alignItems: 'center', shadowColor: '#4CAF50', shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 },
  addBtnDisabled: { backgroundColor: '#C8E6C9', shadowOpacity: 0 },
  addBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
