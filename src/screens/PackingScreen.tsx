import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Svg, { Circle } from 'react-native-svg';
import { Swipeable } from 'react-native-gesture-handler';
import { MenuSheet } from '../components/BottomSheet';
import { supabase } from '../lib/supabase';
import { useCurrentTrip, currentTripIdRef } from '../context/TripContext';
import { useStatusBarHeight } from '../../hooks/useStatusBarHeight';
import { useWeather } from '../../hooks/useWeather';
import { getDestinationHero } from '../lib/destinationHero';
import { PACKING_CATEGORIES, getPackingCategoryDef, TRIP_ESSENTIALS } from '../lib/packingCategories';
import AddItemModal from '../components/packing/AddItemModal';

// ─── Date helpers ───────────────────────────────────────────────────────────
function localDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatShortRange(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return '';
  const s = localDate(startDate);
  const e = localDate(endDate);
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  if (sameMonth) {
    return `${s.getDate()} – ${e.getDate()} ${MONTHS[e.getMonth()]} ${e.getFullYear()}`;
  }
  return `${s.getDate()} ${MONTHS[s.getMonth()]} – ${e.getDate()} ${MONTHS[e.getMonth()]} ${e.getFullYear()}`;
}

function getDaysUntilStart(startDate: string): number {
  const start = localDate(startDate);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)), 0);
}

function getTotalDays(startDate: string, endDate: string): number {
  const start = localDate(startDate);
  const end = localDate(endDate);
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

function getCurrentDay(startDate: string, endDate: string): number {
  const start = localDate(startDate);
  const end = localDate(endDate);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (today < start) return 0;
  if (today > end) return getTotalDays(startDate, endDate);
  return Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

// ─── Circular progress ring ─────────────────────────────────────────────────
function ProgressRing({ progress, size = 64, strokeWidth = 7, color = '#4CAF50' }: {
  progress: number; size?: number; strokeWidth?: number; color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.min(Math.max(progress, 0), 1));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="#EFEAE3" strokeWidth={strokeWidth} fill="none"
        />
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.ringLabelWrap}>
        <Text style={styles.ringLabel}>{Math.round(progress * 100)}%</Text>
      </View>
    </View>
  );
}

export default function PackingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { currentTripId } = useCurrentTrip();
  const [trip, setTrip] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [menuVisible, setMenuVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [filter, setFilter] = useState<'unpacked' | 'packed'>('unpacked');
  const statusBarHeight = useStatusBarHeight();
  const swipeRefs = useRef<Map<string, Swipeable | null>>(new Map());

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
      const { data } = await supabase
        .from('trips')
        .select('*, destinations(id, name, country)')
        .eq('id', tripId)
        .single();
      tripData = data;
    } else {
      const { data: tripsData } = await supabase
        .from('trips')
        .select('*, destinations(id, name, country)')
        .in('id', tripIds)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
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

    const { data: docsData } = await supabase
      .from('documents')
      .select('id, type')
      .eq('trip_id', tripData.id);

    setDocuments(docsData ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadData(currentTripIdRef.current ?? route.params?.tripId);
    }, [])
  );

  const heroDestination = trip?.destinations?.[0] ?? null;
  const { weather } = useWeather(heroDestination?.name ?? null);

  async function toggleItem(item: any) {
    const { error } = await supabase
      .from('packing_items')
      .update({ packed: !item.packed })
      .eq('id', item.id);

    if (!error) {
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, packed: !i.packed } : i));
    }
  }

  async function deleteItem(item: any) {
    const { error } = await supabase.from('packing_items').delete().eq('id', item.id);
    if (!error) {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    }
  }

  async function toggleEssential(def: { key: string; label: string }) {
    const existing = items.find((i) => i.category === 'Essentials' && i.title === def.label);

    if (existing) {
      await toggleItem(existing);
      return;
    }

    if (!trip) return;
    const { data, error } = await supabase
      .from('packing_items')
      .insert({ trip_id: trip.id, title: def.label, category: 'Essentials', packed: true, quantity: 1 })
      .select()
      .single();

    if (!error && data) {
      setItems((prev) => [...prev, data]);
    }
  }

  async function clearCompleted() {
    if (!trip) return;
    const completedIds = items.filter((i) => i.packed).map((i) => i.id);
    if (completedIds.length === 0) return;

    await supabase.from('packing_items').delete().in('id', completedIds);
    setItems((prev) => prev.filter((i) => !i.packed));
    setMenuVisible(false);
  }

  // ─── Derived data ───────────────────────────────────────────────────────
  const totalItems = items.length;
  const packedItems = items.filter((i) => i.packed).length;
  const unpackedItems = totalItems - packedItems;
  const progress = totalItems > 0 ? packedItems / totalItems : 0;

  const knownCatKeys = new Set(PACKING_CATEGORIES.map((c) => c.key));
  const categoryOrder = [...PACKING_CATEGORIES.map((c) => c.key), 'Other'];

  const categories = categoryOrder
    .map((key) => ({
      key,
      def: getPackingCategoryDef(key),
      items: key === 'Other'
        ? items.filter((i) => !knownCatKeys.has(i.category))
        : items.filter((i) => i.category === key),
    }))
    .filter((cat) => cat.items.length > 0);

  const isExpanded = (cat: { key: string; items: any[] }) => {
    if (expanded[cat.key] !== undefined) return expanded[cat.key];
    const catPacked = cat.items.filter((i) => i.packed).length;
    return catPacked < cat.items.length; // collapsed by default only if fully packed
  };

  const daysUntilStart = trip ? getDaysUntilStart(trip.start_date) : 0;
  const totalDays = trip ? getTotalDays(trip.start_date, trip.end_date) : 0;
  const currentDay = trip ? getCurrentDay(trip.start_date, trip.end_date) : 0;
  const isCompleted = trip?.status === 'completed';
  const isUpcoming = daysUntilStart > 0;

  const heroTheme = getDestinationHero(heroDestination?.name, heroDestination?.country);
  const documentTypes = new Set(documents.map((d) => d.type));

  const MENU_ITEMS = [
    { label: 'Add item', icon: '＋', onPress: () => { setMenuVisible(false); setAddModalVisible(true); } },
    { label: 'Clear completed', icon: '✅', onPress: clearCompleted },
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
      <View style={[styles.headerOverlay, { paddingTop: statusBarHeight + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Packing List</Text>
        <TouchableOpacity style={styles.menuBtn} onPress={() => setMenuVisible(true)}>
          <Text style={{ fontSize: 20 }}>⋯</Text>
        </TouchableOpacity>
      </View>

      {!trip ? (
        <View style={styles.emptyWrap}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🧳</Text>
          <Text style={styles.emptyTitle}>No active trip</Text>
          <Text style={styles.emptySubtitle}>Create a trip to start packing</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Hero */}
          <View style={[styles.heroCard, { backgroundColor: heroTheme.background, borderColor: heroTheme.border }]}>
            <View style={[styles.heroBlobOne, { backgroundColor: heroTheme.blobOne }]} />
            <View style={[styles.heroBlobTwo, { backgroundColor: heroTheme.blobTwo }]} />
            <View style={[styles.heroHillBack, { backgroundColor: heroTheme.hillBack }]} />
            <View style={[styles.heroHillFront, { backgroundColor: heroTheme.hillFront }]} />

            {weather && (
              <View style={styles.weatherBadge}>
                <Text style={{ fontSize: 15 }}>{weather.icon}</Text>
                <Text style={styles.weatherText}>{weather.tempC}°C</Text>
              </View>
            )}

            <View style={styles.heroTextBlock}>
              <Text style={styles.heroName} numberOfLines={1}>
                {heroDestination?.name ?? trip.name}
              </Text>
              {trip.start_date && trip.end_date && (
                <Text style={styles.heroDates}>{formatShortRange(trip.start_date, trip.end_date)}</Text>
              )}
              <View style={[styles.heroPill, { backgroundColor: heroTheme.pillBg }]}>
                <Text style={[styles.heroPillText, { color: heroTheme.text }]}>
                  {isCompleted
                    ? '✓ Trip completed'
                    : isUpcoming
                      ? `🗓 ${daysUntilStart} day${daysUntilStart === 1 ? '' : 's'} until trip`
                      : `📍 Day ${currentDay} of ${totalDays}`}
                </Text>
              </View>
            </View>
          </View>

          {/* Progress card */}
          <View style={styles.progressCard}>
            <ProgressRing progress={progress} />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.progressHeadline}>{packedItems} / {totalItems} items packed</Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
              </View>
              <Text style={styles.progressSub}>
                {unpackedItems > 0 ? `${unpackedItems} item${unpackedItems === 1 ? '' : 's'} left to pack` : 'All packed! 🎉'}
              </Text>
            </View>
            <Text style={styles.progressBackpack}>🎒</Text>
          </View>

          {/* Progress by category */}
          {categories.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Progress by category</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
                {categories.map((cat) => {
                  const catPacked = cat.items.filter((i) => i.packed).length;
                  const catTotal = cat.items.length;
                  const catProgress = catTotal > 0 ? catPacked / catTotal : 0;
                  return (
                    <View key={cat.key} style={styles.miniCatCard}>
                      <Text style={{ fontSize: 18, marginBottom: 4 }}>{cat.def.emoji}</Text>
                      <Text style={styles.miniCatName} numberOfLines={1}>{cat.def.label}</Text>
                      <Text style={styles.miniCatCount}>{catPacked} / {catTotal}</Text>
                      <View style={styles.miniCatBarBg}>
                        <View style={[styles.miniCatBarFill, { width: `${catProgress * 100}%`, backgroundColor: catProgress === 1 ? '#4CAF50' : '#FFA726' }]} />
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Trip essentials */}
          <View style={styles.essentialsCard}>
            <View style={styles.essentialsHeader}>
              <Text style={{ fontSize: 16 }}>⭐</Text>
              <Text style={styles.essentialsTitle}>Trip Essentials</Text>
            </View>
            <Text style={styles.essentialsSubtitle}>Don't forget these important items.</Text>
            <View style={styles.essentialsGrid}>
              {TRIP_ESSENTIALS.map((def) => {
                const existing = items.find((i) => i.category === 'Essentials' && i.title === def.label);
                const packed = existing?.packed ?? false;
                const linked = def.linkedDocType ? documentTypes.has(def.linkedDocType) : false;
                return (
                  <TouchableOpacity
                    key={def.key}
                    style={styles.essentialItem}
                    onPress={() => toggleEssential(def)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.essentialIconWrap}>
                      <Text style={{ fontSize: 22 }}>{def.emoji}</Text>
                    </View>
                    <Text style={styles.essentialLabel} numberOfLines={1}>{def.label}</Text>
                    {linked && !packed && <Text style={styles.essentialLinked}>🔗 Linked</Text>}
                    <View style={[styles.essentialCheckbox, packed && styles.essentialCheckboxChecked]}>
                      {packed && <Text style={styles.checkMark}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Packing list */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Packing list</Text>
            </View>

            {categories.length > 0 && (
              <View style={styles.filterRow}>
                <TouchableOpacity
                  style={[styles.filterPill, filter === 'unpacked' && styles.filterPillActive]}
                  onPress={() => setFilter('unpacked')}
                >
                  <Text style={[styles.filterPillText, filter === 'unpacked' && styles.filterPillTextActive]}>
                    ○ Unpacked ({unpackedItems})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterPill, filter === 'packed' && styles.filterPillActive]}
                  onPress={() => setFilter('packed')}
                >
                  <Text style={[styles.filterPillText, filter === 'packed' && styles.filterPillTextActive]}>
                    ✓ Packed ({packedItems})
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {categories.length === 0 ? (
              <View style={styles.emptyListCard}>
                <Text style={{ fontSize: 44, marginBottom: 10 }}>🧳</Text>
                <Text style={styles.emptyTitle}>Nothing to pack yet</Text>
                <Text style={styles.emptySubtitle}>Start building your packing list.</Text>
                <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setAddModalVisible(true)}>
                  <Text style={styles.emptyAddBtnText}>＋ Add Item</Text>
                </TouchableOpacity>
              </View>
            ) : (
              categories.map((cat) => {
                const catPacked = cat.items.filter((i) => i.packed).length;
                const catTotal = cat.items.length;
                const expand = isExpanded(cat);
                const visibleItems = cat.items.filter((i) => filter === 'packed' ? i.packed : !i.packed);

                return (
                  <View key={cat.key} style={styles.categorySection}>
                    <TouchableOpacity
                      style={styles.categoryHeader}
                      onPress={() => setExpanded((prev) => ({ ...prev, [cat.key]: !expand }))}
                      activeOpacity={0.7}
                    >
                      <View style={styles.catTitleWrap}>
                        <Text style={styles.catIcon}>{cat.def.emoji}</Text>
                        <Text style={styles.categoryTitle}>{cat.def.label}</Text>
                      </View>
                      <View style={styles.catRight}>
                        {catPacked === catTotal ? (
                          <View style={styles.catDoneBadge}><Text style={styles.checkMark}>✓</Text></View>
                        ) : (
                          <Text style={styles.catCountText}>{catPacked}/{catTotal}</Text>
                        )}
                        <Text style={[styles.chevron, expand && styles.chevronOpen]}>▾</Text>
                      </View>
                    </TouchableOpacity>

                    {expand && (
                      visibleItems.length === 0 ? (
                        <View style={styles.card}>
                          <Text style={styles.filteredEmptyText}>
                            {filter === 'packed' ? 'Nothing packed yet in this category' : 'Everything here is packed 🎉'}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.card}>
                          {visibleItems.map((item, index) => (
                            <View key={item.id}>
                              <Swipeable
                                ref={(ref) => swipeRefs.current.set(item.id, ref)}
                                renderLeftActions={() => (
                                  <TouchableOpacity
                                    style={styles.swipePackAction}
                                    onPress={() => { toggleItem(item); swipeRefs.current.get(item.id)?.close(); }}
                                  >
                                    <Text style={styles.swipeActionText}>{item.packed ? 'Unpack' : 'Pack'}</Text>
                                  </TouchableOpacity>
                                )}
                                renderRightActions={() => (
                                  <TouchableOpacity
                                    style={styles.swipeDeleteAction}
                                    onPress={() => deleteItem(item)}
                                  >
                                    <Text style={styles.swipeActionText}>Delete</Text>
                                  </TouchableOpacity>
                                )}
                              >
                                <TouchableOpacity
                                  style={styles.itemRow}
                                  onPress={() => toggleItem(item)}
                                  activeOpacity={0.7}
                                >
                                  <View style={[styles.checkbox, item.packed && styles.checkboxChecked]}>
                                    {item.packed && <Text style={styles.checkMark}>✓</Text>}
                                  </View>
                                  <View style={{ flex: 1 }}>
                                    <Text style={[styles.itemName, item.packed && styles.itemNamePacked]}>
                                      {item.title}
                                    </Text>
                                    {(item.quantity > 1 || item.notes) && (
                                      <Text style={styles.itemMeta} numberOfLines={1}>
                                        {item.quantity > 1 ? `${item.quantity}${item.unit ? ` ${item.unit}` : 'x'}` : ''}
                                        {item.quantity > 1 && item.notes ? ' · ' : ''}
                                        {item.notes ?? ''}
                                      </Text>
                                    )}
                                  </View>
                                </TouchableOpacity>
                              </Swipeable>
                              {index < visibleItems.length - 1 && <View style={styles.divider} />}
                            </View>
                          ))}
                        </View>
                      )
                    )}
                  </View>
                );
              })
            )}
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      )}

      {trip && (
        <View style={styles.stickyBottom}>
          <TouchableOpacity style={styles.addBtn} onPress={() => setAddModalVisible(true)}>
            <Text style={styles.addBtnText}>＋ Add Item</Text>
          </TouchableOpacity>
        </View>
      )}

      <MenuSheet visible={menuVisible} onClose={() => setMenuVisible(false)} items={MENU_ITEMS} />

      <AddItemModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        tripId={trip?.id}
        tripName={trip?.name}
        destinationContext={heroDestination ? { name: heroDestination.name, country: heroDestination.country ?? null } : null}
        onAdded={() => loadData(currentTripIdRef.current ?? undefined)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF8F0' },
  scroll: { flex: 1 },

  headerOverlay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 30, color: '#1A1A1A', fontWeight: '300' },
  title: { fontSize: 18, fontWeight: '900', color: '#1A1A1A' },
  menuBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: '#8A817A', fontWeight: '600' },

  // Hero
  heroCard: {
    marginHorizontal: 16, height: 176, borderRadius: 28, borderWidth: 1,
    overflow: 'hidden', position: 'relative', justifyContent: 'flex-end', marginBottom: 20,
  },
  heroBlobOne: { position: 'absolute', width: 150, height: 150, borderRadius: 999, top: -54, left: -36, opacity: 0.78 },
  heroBlobTwo: { position: 'absolute', width: 180, height: 180, borderRadius: 999, right: -60, bottom: -76, opacity: 0.72 },
  heroHillBack: { position: 'absolute', left: -24, right: -40, bottom: -32, height: 80, borderTopLeftRadius: 120, borderTopRightRadius: 140, transform: [{ rotate: '-2deg' }] },
  heroHillFront: { position: 'absolute', left: 60, right: -16, bottom: -40, height: 84, borderTopLeftRadius: 120, borderTopRightRadius: 120, transform: [{ rotate: '3deg' }] },
  weatherBadge: {
    position: 'absolute', top: 16, left: 16, flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  weatherText: { fontSize: 12, fontWeight: '800', color: '#1A1A1A' },
  heroTextBlock: { padding: 16 },
  heroName: { fontSize: 22, fontWeight: '900', color: '#1A1A1A' },
  heroDates: { fontSize: 13, fontWeight: '700', color: '#5C5148', marginTop: 4, opacity: 0.8 },
  heroPill: { alignSelf: 'flex-start', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7, marginTop: 10 },
  heroPillText: { fontSize: 12, fontWeight: '900' },

  // Progress card
  progressCard: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: -46, marginBottom: 20,
    backgroundColor: '#fff', borderRadius: 24, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  ringLabelWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  ringLabel: { fontSize: 13, fontWeight: '900', color: '#1A1A1A' },
  progressHeadline: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  progressBarBg: { height: 7, backgroundColor: '#EFEAE3', borderRadius: 4, overflow: 'hidden', marginTop: 8, marginBottom: 6 },
  progressBarFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 4 },
  progressSub: { fontSize: 12, color: '#8A817A', fontWeight: '600' },
  progressBackpack: { fontSize: 30, marginLeft: 8 },

  // Sections
  section: { marginHorizontal: 16, marginBottom: 20 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#1A1A1A' },

  // Mini category cards
  miniCatCard: {
    width: 96, backgroundColor: '#fff', borderRadius: 16, padding: 12, marginRight: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  miniCatName: { fontSize: 12, fontWeight: '800', color: '#1A1A1A', marginBottom: 2 },
  miniCatCount: { fontSize: 11, color: '#8A817A', fontWeight: '700', marginBottom: 6 },
  miniCatBarBg: { height: 5, backgroundColor: '#EFEAE3', borderRadius: 3, overflow: 'hidden' },
  miniCatBarFill: { height: '100%', borderRadius: 3 },

  // Trip essentials
  essentialsCard: {
    marginHorizontal: 16, marginBottom: 20, backgroundColor: '#FFF3E0', borderRadius: 22, padding: 16,
    borderWidth: 1, borderColor: '#FFE0B2',
  },
  essentialsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  essentialsTitle: { fontSize: 15, fontWeight: '900', color: '#1A1A1A' },
  essentialsSubtitle: { fontSize: 12, color: '#8A6D3B', fontWeight: '600', marginBottom: 14 },
  essentialsGrid: { flexDirection: 'row', gap: 8 },
  essentialItem: {
    flex: 1,
    alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 4,
  },
  essentialIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F8F4EF', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  essentialLabel: { fontSize: 11, fontWeight: '700', color: '#1A1A1A', marginBottom: 6, textAlign: 'center' },
  essentialLinked: { fontSize: 9, color: '#4CAF50', fontWeight: '700', marginBottom: 4 },
  essentialCheckbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#E0D5C7', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  essentialCheckboxChecked: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },

  // Filter pills
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filterPill: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14, backgroundColor: '#F0EBE5' },
  filterPillActive: { backgroundColor: '#E8F5E9' },
  filterPillText: { fontSize: 12, fontWeight: '700', color: '#8A817A' },
  filterPillTextActive: { color: '#2E7D32' },

  emptyListCard: { alignItems: 'center', backgroundColor: '#fff', borderRadius: 22, paddingVertical: 40, paddingHorizontal: 20 },
  emptyAddBtn: { backgroundColor: '#4CAF50', borderRadius: 14, paddingHorizontal: 22, paddingVertical: 12, marginTop: 16 },
  emptyAddBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },

  categorySection: { marginBottom: 14 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingVertical: 2 },
  catTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catIcon: { fontSize: 17 },
  categoryTitle: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  catRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catCountBadge: { backgroundColor: '#E8F5E9', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  catCountText: { fontSize: 12, fontWeight: '700', color: '#8A817A' },
  catDoneBadge: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#4CAF50', alignItems: 'center', justifyContent: 'center' },
  chevron: { fontSize: 15, color: '#8A817A' },
  chevronOpen: { transform: [{ rotate: '180deg' }] },
  card: { backgroundColor: '#fff', borderRadius: 18, paddingHorizontal: 14, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  filteredEmptyText: { fontSize: 12, color: '#8A817A', fontWeight: '600', paddingVertical: 16, textAlign: 'center' },

  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: 12, backgroundColor: '#fff' },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#E0D5C7', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  checkboxChecked: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  checkMark: { fontSize: 12, color: '#fff', fontWeight: '900' },
  itemName: { fontSize: 14, color: '#1A1A1A', fontWeight: '600' },
  itemNamePacked: { color: '#B0A89E', textDecorationLine: 'line-through' },
  itemMeta: { fontSize: 11, color: '#8A817A', marginTop: 2, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#F5F1EB' },

  swipePackAction: { backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'flex-start', paddingLeft: 20, width: 90 },
  swipeDeleteAction: { backgroundColor: '#F44336', justifyContent: 'center', alignItems: 'flex-end', paddingRight: 20, width: 90 },
  swipeActionText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  stickyBottom: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14, backgroundColor: '#FFF8F0' },
  addBtn: { backgroundColor: '#4CAF50', borderRadius: 18, paddingVertical: 16, alignItems: 'center', shadowColor: '#4CAF50', shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 },
  addBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});
