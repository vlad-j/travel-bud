import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Sparkle, Cloud, Dot, TravelStamp } from '../components/TravelDecorations';
import { MenuSheet } from '../components/BottomSheet';
import BottomSheet, { SheetButton } from '../components/BottomSheet';
import { supabase } from '../lib/supabase';
import { useCurrentTrip, currentTripIdRef } from '../context/TripContext';
import { useStatusBarHeight } from '../../hooks/useStatusBarHeight';

const CATEGORY_ICONS: Record<string, string> = {
  Essentials: '✅',
  Clothes: '👕',
  Electronics: '💻',
  Toiletries: '🧴',
  Medication: '💊',
  Other: '🎒',
};

const ADD_CATEGORIES = ['Essentials', 'Clothes', 'Electronics', 'Toiletries', 'Medication', 'Other'];

export default function PackingScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { currentTripId } = useCurrentTrip();
  const [trip, setTrip] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [menuVisible, setMenuVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Essentials');
  const [saving, setSaving] = useState(false);
  const statusBarHeight = useStatusBarHeight();


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

    if (tripId) {
      const { data } = await supabase.from('trips').select('*').eq('id', tripId).single();
      tripData = data;
    } else {
      const { data: tripsData } = await supabase.from('trips').select('*').in('id', tripIds).eq('status', 'active').order('created_at', { ascending: false });
      tripData = tripsData?.[0] ?? null;
    }

    if (!tripData) { setLoading(false); return; }
    setTrip(tripData);

    const { data: packingData } = await supabase
      .from('packing_items')
      .select('*')
      .eq('trip_id', tripData.id)
      .order('created_at', { ascending: true });

    setItems(packingData ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadData(currentTripIdRef.current ?? route.params?.tripId);
    }, [])
  );

  async function toggleItem(item: any) {
    const { error } = await supabase
      .from('packing_items')
      .update({ packed: !item.packed })
      .eq('id', item.id);

    if (!error) {
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, packed: !i.packed } : i));
    }
  }

  async function handleAddItem() {
    if (!newItemName.trim() || !trip) return;
    setSaving(true);

    const { data, error } = await supabase
      .from('packing_items')
      .insert({
        trip_id: trip.id,
        title: newItemName.trim(),
        category: selectedCategory,
        packed: false,
      })
      .select()
      .single();

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setItems((prev) => [...prev, data]);
      setNewItemName('');
      setAddModalVisible(false);
    }
    setSaving(false);
  }

  async function clearCompleted() {
    if (!trip) return;
    const completedIds = items.filter((i) => i.packed).map((i) => i.id);
    if (completedIds.length === 0) return;

    await supabase.from('packing_items').delete().in('id', completedIds);
    setItems((prev) => prev.filter((i) => !i.packed));
    setMenuVisible(false);
  }

  // Group by category
  const categories = ADD_CATEGORIES.map((cat) => ({
    name: cat,
    items: items.filter((i) => i.category === cat),
  })).filter((cat) => cat.items.length > 0);

  // Also add items with unknown categories
  const knownCats = new Set(ADD_CATEGORIES);
  const otherItems = items.filter((i) => !knownCats.has(i.category));
  if (otherItems.length > 0) {
    categories.push({ name: 'Other', items: otherItems });
  }

  const totalItems = items.length;
  const packedItems = items.filter((i) => i.packed).length;
  const progress = totalItems > 0 ? packedItems / totalItems : 0;

  const isExpanded = (name: string) => expanded[name] !== false;

  const MENU_ITEMS = [
    { label: 'Clear completed', icon: '✅', onPress: clearCompleted },
    { label: 'Add item', icon: '＋', onPress: () => { setMenuVisible(false); setAddModalVisible(true); } },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <View style={[styles.header, { paddingTop: statusBarHeight + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Packing List</Text>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Text style={{ fontSize: 22 }}>⋯</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.progressCard}>
        <View style={styles.progressTopRow}>
          <View style={styles.progressTitleWrap}>
            <Cloud size={16} style={{ position: 'relative', marginRight: 6 }} />
            <Text style={styles.progressTitle}>
              {trip?.name ?? 'Packing List'}
            </Text>
          </View>
          <TravelStamp
            label={`${packedItems}/${totalItems} packed`}
            color="#4CAF50"
            style={{ position: 'relative', transform: [] }}
          />
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressSub}>{packedItems} of {totalItems} items packed</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {!trip ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🎒</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#1A1A1A' }}>No active trip</Text>
            <Text style={{ color: '#888', marginTop: 4 }}>Create a trip to start packing</Text>
          </View>
        ) : categories.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🎒</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#1A1A1A' }}>Nothing to pack yet</Text>
            <Text style={{ color: '#888', marginTop: 4 }}>Tap + to add your first item</Text>
          </View>
        ) : (
          categories.map((category) => {
            const catPacked = category.items.filter((i) => i.packed).length;
            const catTotal = category.items.length;
            const expand = isExpanded(category.name);
            const catIcon = CATEGORY_ICONS[category.name] ?? '📦';

            return (
              <View key={category.name} style={styles.categorySection}>
                <TouchableOpacity
                  style={styles.categoryHeader}
                  onPress={() => setExpanded((prev) => ({ ...prev, [category.name]: !expand }))}
                  activeOpacity={0.7}
                >
                  <View style={styles.catTitleWrap}>
                    <Text style={styles.catIcon}>{catIcon}</Text>
                    <Text style={styles.categoryTitle}>{category.name}</Text>
                    <View style={styles.catCountBadge}>
                      <Text style={styles.catCountText}>{catPacked}/{catTotal}</Text>
                    </View>
                  </View>
                  <Text style={[styles.chevron, expand && styles.chevronOpen]}>▾</Text>
                </TouchableOpacity>

                {expand && (
                  <View style={styles.card}>
                    {category.items.map((item, index) => (
                      <View key={item.id}>
                        <TouchableOpacity
                          style={styles.itemRow}
                          onPress={() => toggleItem(item)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.checkbox, item.packed && styles.checkboxChecked]}>
                            {item.packed && <Text style={styles.checkMark}>✓</Text>}
                          </View>
                          <Text style={[styles.itemName, item.packed && styles.itemNamePacked]}>
                            {item.title}
                          </Text>
                          <Text style={styles.itemChevron}>›</Text>
                        </TouchableOpacity>
                        {index < category.items.length - 1 && <View style={styles.divider} />}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })
        )}

        <View style={styles.footerDecor}>
          <Dot color="#DDD" size={5} style={{ position: 'relative' }} />
          <Dot color="#DDD" size={4} style={{ position: 'relative', marginLeft: 8 }} />
          <Sparkle color="#FF9800" size={10} style={{ position: 'relative', marginLeft: 6 }} />
        </View>
        <View style={{ height: 80 }} />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setAddModalVisible(true)}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      <MenuSheet visible={menuVisible} onClose={() => setMenuVisible(false)} items={MENU_ITEMS} />

      <BottomSheet visible={addModalVisible} onClose={() => setAddModalVisible(false)} title="Add Item">
        <Text style={styles.fieldLabel}>Item name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Sunscreen"
          placeholderTextColor="#C0C0C0"
          value={newItemName}
          onChangeText={setNewItemName}
        />
        <Text style={styles.fieldLabel}>Category</Text>
        <View style={styles.catGrid}>
          {ADD_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catOption, selectedCategory === cat && styles.catOptionActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={{ fontSize: 18 }}>{CATEGORY_ICONS[cat]}</Text>
              <Text style={[styles.catOptionText, selectedCategory === cat && styles.catOptionTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <SheetButton label={saving ? 'Adding...' : 'Add Item'} onPress={handleAddItem} disabled={!newItemName.trim() || saving} />
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  backBtn: { padding: 4 },
  backIcon: { fontSize: 28, color: '#1A1A1A', fontWeight: '300' },
  title: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  progressCard: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  progressTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  progressTitleWrap: { flexDirection: 'row', alignItems: 'center' },
  progressTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  progressBg: { height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 4 },
  progressSub: { fontSize: 12, color: '#888' },
  scroll: { flex: 1, padding: 16 },
  categorySection: { marginBottom: 14 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingVertical: 2 },
  catTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catIcon: { fontSize: 18 },
  categoryTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  catCountBadge: { backgroundColor: '#E8F5E9', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  catCountText: { fontSize: 12, fontWeight: '600', color: '#4CAF50' },
  chevron: { fontSize: 16, color: '#888' },
  chevronOpen: { transform: [{ rotate: '180deg' }] },
  card: { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 4, borderWidth: 1, borderColor: '#F0F0F0', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  checkboxChecked: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  checkMark: { fontSize: 13, color: '#fff', fontWeight: '800' },
  itemName: { flex: 1, fontSize: 15, color: '#1A1A1A', fontWeight: '500' },
  itemNamePacked: { color: '#888', textDecorationLine: 'line-through' },
  itemChevron: { fontSize: 18, color: '#DDD', fontWeight: '300' },
  divider: { height: 1, backgroundColor: '#F5F5F5', marginLeft: 36 },
  footerDecor: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#4CAF50', alignItems: 'center', justifyContent: 'center', shadowColor: '#4CAF50', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  fabText: { fontSize: 28, color: '#fff', fontWeight: '400', lineHeight: 32 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#888', letterSpacing: 0.4, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#FAFAFA', borderRadius: 12, borderWidth: 0.5, borderColor: '#E0E0E0', paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1A1A1A' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  catOption: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#EBEBEB', backgroundColor: '#F5F5F5' },
  catOptionActive: { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' },
  catOptionText: { fontSize: 13, fontWeight: '600', color: '#666' },
  catOptionTextActive: { color: '#4CAF50' },
});
