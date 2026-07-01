import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { getDestinationHero } from '../../lib/destinationHero';
import { getPackingCategoryDef } from '../../lib/packingCategories';
import { useWeather } from '../../../hooks/useWeather';
import PackingCategoryPicker from './PackingCategoryPicker';

const UNITS = ['pcs', 'pairs', 'shirts', 'bottles'];

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function buildSmartTip(destinationName: string | null, condition: string | null, tempC: number | null): string | null {
  if (!destinationName) return null;
  if (tempC === null) return null;
  if (tempC >= 26) return `${destinationName} is looking warm right now. Don't forget sunscreen and light clothes.`;
  if (tempC <= 10) return `${destinationName} is running cold right now. Pack warm layers and a jacket.`;
  if (condition && /rain|drizzle|shower/i.test(condition)) return `Rain is likely in ${destinationName}. An umbrella or rain jacket could help.`;
  return `${destinationName} is currently ${Math.round(tempC)}°C. Pack accordingly.`;
}

interface DestinationContext {
  name: string;
  country: string | null;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  tripId: string;
  destinationContext?: DestinationContext | null;
  tripName?: string;
  onAdded: () => void;
}

export default function AddItemModal({
  visible, onClose, tripId, destinationContext, tripName, onAdded,
}: Props) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Essentials');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState<string | null>(null);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const { weather } = useWeather(destinationContext?.name ?? null);

  async function handleAdd() {
    if (!name.trim() || !tripId) return;
    setSaving(true);

    const { error } = await supabase.from('packing_items').insert({
      trip_id: tripId,
      title: name.trim(),
      category,
      packed: false,
      quantity,
      unit: unit || null,
      notes: notes.trim() || null,
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setName(''); setCategory('Essentials'); setQuantity(1); setUnit(null); setNotes('');
      onAdded();
      onClose();
    }
    setSaving(false);
  }

  const categoryDef = getPackingCategoryDef(category);
  const heroTheme = destinationContext
    ? getDestinationHero(destinationContext.name, destinationContext.country)
    : null;
  const smartTip = buildSmartTip(destinationContext?.name ?? null, weather?.condition ?? null, weather?.tempC ?? null);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kvWrapper}>
          <View style={styles.sheet}>

            {/* Sticky Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Add Item</Text>
              <TouchableOpacity
                onPress={handleAdd}
                disabled={!name.trim() || saving}
                style={[styles.saveBtn, (!name.trim() || saving) && styles.saveBtnDisabled]}
              >
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveText}>Save</Text>}
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              {/* Destination Hero */}
              {destinationContext && heroTheme && (
                <View style={[styles.heroCard, { backgroundColor: heroTheme.background, borderColor: heroTheme.border }]}>
                  <View style={[styles.heroBlobOne, { backgroundColor: heroTheme.blobOne }]} />
                  <View style={[styles.heroBlobTwo, { backgroundColor: heroTheme.blobTwo }]} />
                  <View style={[styles.heroHillBack, { backgroundColor: heroTheme.hillBack }]} />
                  <View style={[styles.heroHillFront, { backgroundColor: heroTheme.hillFront }]} />

                  <View style={styles.heroTextBlock}>
                    <Text style={styles.heroName} numberOfLines={1}>
                      {destinationContext.name}{destinationContext.country ? `, ${destinationContext.country}` : ''}
                    </Text>
                    <View style={[styles.heroBadge, { backgroundColor: heroTheme.pillBg }]}>
                      <Text style={[styles.heroBadgeText, { color: heroTheme.text }]}>🎒 Packing for this trip</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Context card */}
              <View style={styles.dayCard}>
                <View style={styles.dayCardIconWrap}>
                  <Text style={{ fontSize: 18 }}>🧳</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dayCardTitle}>{tripName ?? 'Your trip'}</Text>
                  <Text style={styles.dayCardSub}>Add something to your packing list</Text>
                </View>
              </View>

              {/* Item name — primary input */}
              <View style={styles.primaryInputCard}>
                <View style={[styles.primaryIconWrap, { backgroundColor: categoryDef.bg }]}>
                  <Text style={{ fontSize: 22 }}>{categoryDef.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.primaryInputLabel}>What do you need to pack?</Text>
                  <TextInput
                    style={styles.primaryInputField}
                    placeholder="e.g. Sunscreen, Power Bank, Camera"
                    placeholderTextColor="#C0C0C0"
                    value={name}
                    onChangeText={setName}
                    autoFocus
                  />
                </View>
              </View>

              {/* Category selector */}
              <TouchableOpacity
                style={styles.selectorCard}
                onPress={() => setShowCategoryPicker(true)}
                activeOpacity={0.8}
              >
                <View style={[styles.selectorIconWrap, { backgroundColor: categoryDef.bg }]}>
                  <Text style={{ fontSize: 16 }}>{categoryDef.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectorTitle}>Category</Text>
                  <Text style={styles.selectorValue}>{categoryDef.label}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>

              {/* Quantity */}
              <View style={styles.quantityCard}>
                <View style={[styles.selectorIconWrap, { backgroundColor: '#EDE7F6' }]}>
                  <Text style={{ fontSize: 16 }}>🔢</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectorTitle}>Quantity <Text style={styles.optional}>(optional)</Text></Text>
                  <View style={styles.stepperRow}>
                    <View style={styles.stepper}>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                      >
                        <Text style={styles.stepperBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.stepperValue}>{quantity}</Text>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => setQuantity((q) => q + 1)}
                      >
                        <Text style={styles.stepperBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.unitChip} onPress={() => setShowUnitPicker((v) => !v)}>
                      <Text style={styles.unitChipText}>{unit ?? 'unit'}</Text>
                      <Text style={styles.unitChevron}>▾</Text>
                    </TouchableOpacity>
                  </View>
                  {showUnitPicker && (
                    <View style={styles.unitOptions}>
                      {UNITS.map((u) => (
                        <TouchableOpacity
                          key={u}
                          style={[styles.unitOption, unit === u && styles.unitOptionActive]}
                          onPress={() => { setUnit(u); setShowUnitPicker(false); }}
                        >
                          <Text style={[styles.unitOptionText, unit === u && styles.unitOptionTextActive]}>{u}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              {/* Notes */}
              <View style={[styles.selectorCard, styles.notesCard]}>
                <View style={[styles.selectorIconWrap, { backgroundColor: '#F3E5F5' }]}>
                  <Text style={{ fontSize: 16 }}>📝</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectorTitle}>Notes <Text style={styles.optional}>(optional)</Text></Text>
                  <TextInput
                    style={styles.notesInput}
                    placeholder="Add any extra details..."
                    placeholderTextColor="#C0C0C0"
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>

              {/* Smart tip */}
              {smartTip && (
                <View style={styles.tipCard}>
                  <Text style={{ fontSize: 20 }}>{weather?.icon ?? '☀️'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tipTitle}>Tip</Text>
                    <Text style={styles.tipText}>{smartTip}</Text>
                  </View>
                </View>
              )}

              <View style={{ height: 12 }} />
            </ScrollView>

            {/* Sticky Add Button */}
            <View style={styles.stickyBottom}>
              <TouchableOpacity
                style={[styles.addBtn, (!name.trim() || saving) && styles.addBtnDisabled]}
                onPress={handleAdd}
                disabled={!name.trim() || saving}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.addBtnText}>＋ Add Item</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>

      <PackingCategoryPicker
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
  kvWrapper: { flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFF8F0', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '95%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A1A' },
  cancelBtn: { padding: 4 },
  cancelText: { fontSize: 15, color: '#4CAF50', fontWeight: '600' },
  saveBtn: { backgroundColor: '#4CAF50', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
  saveBtnDisabled: { backgroundColor: '#C8E6C9' },
  saveText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  scroll: { flex: 1, paddingHorizontal: 16 },

  // Hero
  heroCard: {
    height: 140, borderRadius: 24, borderWidth: 1, overflow: 'hidden',
    position: 'relative', marginTop: 8, marginBottom: 14, justifyContent: 'flex-end',
  },
  heroBlobOne: { position: 'absolute', width: 140, height: 140, borderRadius: 999, top: -48, left: -34, opacity: 0.78 },
  heroBlobTwo: { position: 'absolute', width: 160, height: 160, borderRadius: 999, right: -54, bottom: -68, opacity: 0.72 },
  heroHillBack: { position: 'absolute', left: -24, right: -40, bottom: -30, height: 72, borderTopLeftRadius: 120, borderTopRightRadius: 140, transform: [{ rotate: '-2deg' }] },
  heroHillFront: { position: 'absolute', left: 60, right: -16, bottom: -36, height: 76, borderTopLeftRadius: 120, borderTopRightRadius: 120, transform: [{ rotate: '3deg' }] },
  heroTextBlock: { padding: 14 },
  heroName: { fontSize: 17, fontWeight: '900', color: '#1A1A1A', marginBottom: 8 },
  heroBadge: { alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  heroBadgeText: { fontSize: 11, fontWeight: '800' },

  // Day / context card
  dayCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff',
    borderRadius: 18, padding: 14, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  dayCardIconWrap: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#E0F2F1', alignItems: 'center', justifyContent: 'center' },
  dayCardTitle: { fontSize: 14, fontWeight: '800', color: '#1A1A1A' },
  dayCardSub: { fontSize: 11, color: '#8A817A', marginTop: 2, fontWeight: '600' },

  // Primary input — item name
  primaryInputCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff',
    borderRadius: 20, padding: 14, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  primaryIconWrap: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  primaryInputLabel: { fontSize: 13, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  primaryInputField: { fontSize: 15, color: '#1A1A1A', padding: 0 },

  // Selector cards
  selectorCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff',
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  selectorIconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  selectorTitle: { fontSize: 13, fontWeight: '800', color: '#1A1A1A' },
  selectorValue: { fontSize: 13, color: '#8A817A', marginTop: 2, fontWeight: '600' },
  chevron: { fontSize: 20, color: '#C8BFB5', fontWeight: '300' },
  optional: { fontWeight: '400', color: '#B0A89E' },

  // Quantity
  quantityCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#fff',
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, overflow: 'hidden' },
  stepperBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  stepperBtnText: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  stepperValue: { fontSize: 15, fontWeight: '800', color: '#1A1A1A', minWidth: 26, textAlign: 'center' },
  unitChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  unitChipText: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
  unitChevron: { fontSize: 11, color: '#8A817A' },
  unitOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  unitOption: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: '#F5F5F5' },
  unitOptionActive: { backgroundColor: '#E8F5E9' },
  unitOptionText: { fontSize: 12, fontWeight: '600', color: '#666' },
  unitOptionTextActive: { color: '#4CAF50' },

  notesCard: { alignItems: 'flex-start' },
  notesInput: { fontSize: 13, color: '#1A1A1A', marginTop: 4, padding: 0, minHeight: 50, textAlignVertical: 'top' },

  tipCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#E8F5E9',
    borderRadius: 16, padding: 14, marginBottom: 10,
  },
  tipTitle: { fontSize: 12, fontWeight: '800', color: '#2E7D32', marginBottom: 2 },
  tipText: { fontSize: 12, color: '#3D5C40', lineHeight: 17, fontWeight: '500' },

  stickyBottom: { padding: 16, backgroundColor: '#FFF8F0' },
  addBtn: { backgroundColor: '#4CAF50', borderRadius: 18, paddingVertical: 17, alignItems: 'center', shadowColor: '#4CAF50', shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 },
  addBtnDisabled: { backgroundColor: '#C8E6C9', shadowOpacity: 0 },
  addBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
