import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch,
  Alert, ActivityIndicator, TextInput, Modal, Share, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Sparkle, Dot } from '../components/TravelDecorations';
import { supabase } from '../lib/supabase';
import SectionBlock from '../components/SectionBlock';
import { CURRENCIES } from '../data/staticData';


// ─── Flag map pentru cele mai comune valute ────────────────────────────────────
const CURRENCY_FLAGS: Record<string, string> = {
  EUR: '🇪🇺', USD: '🇺🇸', GBP: '🇬🇧', JPY: '🇯🇵', IDR: '🇮🇩',
  CHF: '🇨🇭', AUD: '🇦🇺', CAD: '🇨🇦', CNY: '🇨🇳', INR: '🇮🇳',
  KRW: '🇰🇷', SGD: '🇸🇬', THB: '🇹🇭', MYR: '🇲🇾', PHP: '🇵🇭',
  VND: '🇻🇳', HKD: '🇭🇰', NZD: '🇳🇿', SEK: '🇸🇪', NOK: '🇳🇴',
  DKK: '🇩🇰', PLN: '🇵🇱', CZK: '🇨🇿', HUF: '🇭🇺', RON: '🇷🇴',
  TRY: '🇹🇷', AED: '🇦🇪', SAR: '🇸🇦', ZAR: '🇿🇦', BRL: '🇧🇷',
  MXN: '🇲🇽', ARS: '🇦🇷', RUB: '🇷🇺', UAH: '🇺🇦', EGP: '🇪🇬',
  MAD: '🇲🇦', NGN: '🇳🇬', KES: '🇰🇪', GHS: '🇬🇭', TZS: '🇹🇿',
};

const COMMON_CURRENCIES = ['EUR', 'USD', 'GBP', 'IDR', 'JPY', 'CHF', 'AUD', 'CAD'];

// ─── Currency Picker Modal ─────────────────────────────────────────────────────
function CurrencyPickerModal({ visible, selected, onSelect, onClose }: {
  visible: boolean; selected: string; onSelect: (code: string) => void; onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = search.trim()
    ? CURRENCIES.filter(c =>
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    : CURRENCIES;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={cpStyles.overlay}>
        <View style={cpStyles.sheet}>
          <View style={cpStyles.handle} />
          <Text style={cpStyles.title}>Select Currency</Text>

          <View style={cpStyles.searchBar}>
            <Text style={{ fontSize: 16 }}>🔍</Text>
            <TextInput
              style={cpStyles.searchInput}
              placeholder="Search currency..."
              placeholderTextColor="#C0C0C0"
              value={search}
              onChangeText={setSearch}
              autoFocus={false}
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Text style={{ fontSize: 16, color: '#999' }}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {!search.trim() && (
            <View style={cpStyles.commonWrap}>
              <Text style={cpStyles.commonLabel}>COMMON</Text>
              <View style={cpStyles.commonGrid}>
                {COMMON_CURRENCIES.map(code => (
                  <TouchableOpacity
                    key={code}
                    style={[cpStyles.commonPill, selected === code && cpStyles.commonPillSelected]}
                    onPress={() => { onSelect(code); onClose(); }}
                  >
                    <Text style={{ fontSize: 20 }}>{CURRENCY_FLAGS[code] ?? '💱'}</Text>
                    <Text style={[cpStyles.commonCode, selected === code && cpStyles.commonCodeSelected]}>{code}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[cpStyles.commonLabel, { marginTop: 14 }]}>ALL CURRENCIES</Text>
            </View>
          )}

          <FlatList
            data={filtered}
            keyExtractor={item => item.code}
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[cpStyles.currItem, selected === item.code && cpStyles.currItemSelected]}
                onPress={() => { onSelect(item.code); onClose(); }}
              >
                <Text style={{ fontSize: 22, width: 32 }}>{CURRENCY_FLAGS[item.code] ?? '💱'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={cpStyles.currName}>{item.name}</Text>
                </View>
                <Text style={cpStyles.currCode}>{item.code}</Text>
                {selected === item.code && <Text style={cpStyles.currCheck}>✓</Text>}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#F5F5F5' }} />}
          />

          <TouchableOpacity style={cpStyles.closeBtn} onPress={onClose}>
            <Text style={cpStyles.closeBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const cpStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '85%', paddingTop: 12 },
  handle: { width: 36, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  title: { fontSize: 17, fontWeight: '700', color: '#1A1A1A', paddingHorizontal: 16, marginBottom: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginHorizontal: 16, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 14, color: '#1A1A1A' },
  commonWrap: { paddingHorizontal: 16 },
  commonLabel: { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 0.8, marginBottom: 8 },
  commonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  commonPill: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, gap: 4, borderWidth: 1, borderColor: '#EBEBEB', minWidth: 64 },
  commonPillSelected: { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' },
  commonCode: { fontSize: 11, fontWeight: '700', color: '#666' },
  commonCodeSelected: { color: '#2E7D32' },
  currItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  currItemSelected: { backgroundColor: '#F1F8E9' },
  currName: { fontSize: 14, color: '#1A1A1A', fontWeight: '500' },
  currCode: { fontSize: 13, color: '#888', marginRight: 6 },
  currCheck: { fontSize: 16, color: '#4CAF50' },
  closeBtn: { margin: 16, backgroundColor: '#F5F5F5', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  closeBtnText: { fontSize: 15, fontWeight: '600', color: '#666' },
});

// ─── Scroll Wheel Date Picker ──────────────────────────────────────────────────
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ITEM_HEIGHT = 48;

function WheelColumn({ items, selectedIndex, onSelect }: {
  items: string[]; selectedIndex: number; onSelect: (index: number) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const containerHeight = ITEM_HEIGHT * 5;

useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: false });
      }, 200);
    }
  }, [selectedIndex]);

  return (
    <View style={{ width: '100%', height: containerHeight, overflow: 'hidden' }}>
      <View style={{
        position: 'absolute',
        top: ITEM_HEIGHT * 2,
        left: 0, right: 0,
        height: ITEM_HEIGHT,
        backgroundColor: '#E8F5E9',
        borderRadius: 12,
      }} pointerEvents="none" />
      <ScrollView
        ref={scrollRef}
        style={{ height: containerHeight }}
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        snapToAlignment="center"
        decelerationRate="fast"
        onMomentumScrollEnd={e => {
          const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
          onSelect(Math.max(0, Math.min(index, items.length - 1)));
        }}
      >
        {items.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}
            onPress={() => {
              onSelect(i);
              scrollRef.current?.scrollTo({ y: i * ITEM_HEIGHT, animated: true });
            }}
          >
            <Text style={{
              fontSize: i === selectedIndex ? 20 : 15,
              color: i === selectedIndex ? '#2E7D32' : '#BBBBBB',
              fontWeight: i === selectedIndex ? '700' : '400',
            }}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const wheelStyles = StyleSheet.create({
  col: { flex: 1, height: ITEM_HEIGHT * 5, overflow: 'hidden', position: 'relative' },
  highlight: {
    position: 'absolute', top: ITEM_HEIGHT * 2, left: 6, right: 6,
    height: ITEM_HEIGHT, backgroundColor: '#E8F5E9', borderRadius: 12, zIndex: 0,
  },
  item: { height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' },
  itemText: { fontSize: 16, color: '#BBBBBB', fontWeight: '400' },
  itemSelected: { fontSize: 18, color: '#2E7D32', fontWeight: '700' },
});

function DatePickerModal({ visible, value, title, onSelect, onClose }: {
  visible: boolean; value: string; title: string;
  onSelect: (date: string) => void; onClose: () => void;
}) {
  const parsed = value ? new Date(value) : new Date();
  const [day, setDay] = useState(parsed.getDate() - 1);
  const [month, setMonth] = useState(parsed.getMonth());
  const [year, setYear] = useState(parsed.getFullYear() - 2020);

  const years = Array.from({ length: 20 }, (_, i) => String(2020 + i));
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

  useEffect(() => {
    if (visible && value) {
      const d = new Date(value);
      setDay(d.getDate() - 1);
      setMonth(d.getMonth());
      setYear(d.getFullYear() - 2020);
    }
  }, [visible, value]);

  function handleConfirm() {
    const y = 2020 + year;
    const m = month + 1;
    const d = day + 1;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    onSelect(dateStr);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={dpStyles.overlay}>
        <View style={dpStyles.sheet}>
          <View style={dpStyles.handle} />
          <Text style={dpStyles.title}>{title}</Text>

          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24, height: ITEM_HEIGHT * 5 }}>
            <View style={dpStyles.colWrap}>
              <Text style={dpStyles.colLabel}>Day</Text>
              <WheelColumn items={days} selectedIndex={day} onSelect={setDay} />
            </View>
            <View style={dpStyles.colWrap}>
              <Text style={dpStyles.colLabel}>Month</Text>
              <WheelColumn items={MONTHS} selectedIndex={month} onSelect={setMonth} />
            </View>
            <View style={dpStyles.colWrap}>
              <Text style={dpStyles.colLabel}>Year</Text>
              <WheelColumn items={years} selectedIndex={year} onSelect={setYear} />
            </View>
          </View>

          <TouchableOpacity style={dpStyles.confirmBtn} onPress={handleConfirm}>
            <Text style={dpStyles.confirmText}>Confirm</Text>
          </TouchableOpacity>
          <TouchableOpacity style={dpStyles.cancelBtn} onPress={onClose}>
            <Text style={dpStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const dpStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32 },
  handle: { width: 36, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 17, fontWeight: '700', color: '#1A1A1A', marginBottom: 20, textAlign: 'center' },
  wheelsRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  colWrap: { flex: 1 },
  colLabel: { fontSize: 11, fontWeight: '700', color: '#999', textAlign: 'center', letterSpacing: 0.8, marginBottom: 8 },
  confirmBtn: { backgroundColor: '#4CAF50', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  confirmText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  cancelBtn: { backgroundColor: '#F5F5F5', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#666' },
});

// ─── Invite Modal ──────────────────────────────────────────────────────────────
function InviteModal({ visible, tripCode, onClose }: { visible: boolean; tripCode: string; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={invStyles.overlay}>
        <View style={invStyles.box}>
          <Text style={invStyles.title}>🔗 Invite Traveler</Text>
          <Text style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>Share this code with your travel partner:</Text>
          <View style={invStyles.codeBox}>
            <Text style={invStyles.code}>{tripCode}</Text>
          </View>
          <TouchableOpacity style={invStyles.shareBtn} onPress={() =>
            Share.share({ message: `Join my trip on Ultimate Travel Buddy! Use code: ${tripCode}` })
          }>
            <Text style={invStyles.shareBtnText}>📤 Share Code</Text>
          </TouchableOpacity>
          <TouchableOpacity style={invStyles.cancelBtn} onPress={onClose}>
            <Text style={invStyles.cancelText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const invStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  box: { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%' },
  title: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  codeBox: { backgroundColor: '#E8F5E9', borderRadius: 14, padding: 18, alignItems: 'center', marginBottom: 16 },
  code: { fontSize: 32, fontWeight: '900', color: '#2E7D32', letterSpacing: 6 },
  shareBtn: { backgroundColor: '#4CAF50', borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginBottom: 8 },
  shareBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  cancelBtn: { backgroundColor: '#F5F5F5', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '600', color: '#666' },
});

// ─── Budget Edit Modal ─────────────────────────────────────────────────────────
function BudgetModal({ visible, value, onSave, onClose }: {
  visible: boolean; value: string; onSave: (v: string) => void; onClose: () => void;
}) {
  const [text, setText] = useState(value);
  useEffect(() => { setText(value); }, [value, visible]);
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={bmStyles.overlay}>
        <View style={bmStyles.box}>
          <Text style={bmStyles.title}>🏦 Budget</Text>
          <TextInput
            style={bmStyles.input}
            value={text}
            onChangeText={setText}
            keyboardType="numeric"
            autoFocus
            selectTextOnFocus
            placeholder="e.g. 2000"
            placeholderTextColor="#C0C0C0"
          />
          <View style={bmStyles.btnRow}>
            <TouchableOpacity style={bmStyles.cancelBtn} onPress={onClose}>
              <Text style={bmStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={bmStyles.saveBtn} onPress={() => { onSave(text); onClose(); }}>
              <Text style={bmStyles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const bmStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  box: { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%' },
  title: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 16 },
  input: { backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 22, fontWeight: '700', color: '#1A1A1A', borderWidth: 1, borderColor: '#E0E0E0', textAlign: 'center' },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F5F5F5', alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '600', color: '#888' },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#4CAF50', alignItems: 'center' },
  saveText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});

// ─── Trip Name Modal ───────────────────────────────────────────────────────────
function TripNameModal({ visible, value, onSave, onClose }: {
  visible: boolean; value: string; onSave: (v: string) => void; onClose: () => void;
}) {
  const [text, setText] = useState(value);
  useEffect(() => { setText(value); }, [value, visible]);
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={bmStyles.overlay}>
        <View style={bmStyles.box}>
          <Text style={bmStyles.title}>✏️ Trip Name</Text>
          <TextInput
            style={[bmStyles.input, { fontSize: 16, textAlign: 'left' }]}
            value={text}
            onChangeText={setText}
            autoFocus
            selectTextOnFocus
            placeholder="e.g. Java → Bali → Lombok"
            placeholderTextColor="#C0C0C0"
          />
          <View style={bmStyles.btnRow}>
            <TouchableOpacity style={bmStyles.cancelBtn} onPress={onClose}>
              <Text style={bmStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={bmStyles.saveBtn} onPress={() => { onSave(text); onClose(); }}>
              <Text style={bmStyles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function TripSettingsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const tripId = route.params?.tripId;

  const [trip, setTrip] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [showNameModal, setShowNameModal] = useState(false);
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const [showCurrency, setShowCurrency] = useState(false);
  const [showBudget, setShowBudget] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  const [notifFlight, setNotifFlight] = useState(true);
  const [notifCheckin, setNotifCheckin] = useState(true);
  const [notifBudget, setNotifBudget] = useState(true);
  const [notifPartner, setNotifPartner] = useState(true);

  useFocusEffect(useCallback(() => { loadData(); }, []));

  async function loadData() {
    if (!tripId) { setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id ?? null);
    const { data: tripData } = await supabase.from('trips').select('*').eq('id', tripId).single();
    setTrip(tripData);
    const { data: membersData } = await supabase
      .from('trip_members')
      .select('*, profiles:user_id(id, name, email)')
      .eq('trip_id', tripId);
    setMembers(membersData ?? []);
    setLoading(false);
  }

  async function updateField(field: string, value: any) {
    if (!tripId) return;
    setSaving(true);
    const { error } = await supabase.from('trips').update({ [field]: value }).eq('id', tripId);
    if (error) { Alert.alert('Error', error.message); }
    else { setTrip((prev: any) => ({ ...prev, [field]: value })); }
    setSaving(false);
  }

  async function handleRemoveMember(userId: string) {
    if (userId === currentUserId) { Alert.alert('Error', 'You cannot remove yourself.'); return; }
    Alert.alert('Remove traveler', 'Remove this person from the trip?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        await supabase.from('trip_members').delete().eq('trip_id', tripId).eq('user_id', userId);
        await loadData();
      }},
    ]);
  }

  async function handleDuplicateTrip() {
    if (!trip) return;
    setSaving(true);
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data: newTrip, error } = await supabase.from('trips').insert({
      name: `${trip.name} (copy)`,
      start_date: trip.start_date,
      end_date: trip.end_date,
      budget: trip.budget,
      currency: trip.currency,
      status: 'upcoming',
      invite_code: newCode,
    }).select().single();
    if (error || !newTrip) { Alert.alert('Error', error?.message ?? 'Failed.'); setSaving(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('trip_members').insert({ trip_id: newTrip.id, user_id: user!.id, role: 'owner' });
    Alert.alert('✅ Duplicated', `"${newTrip.name}" created.`);
    setSaving(false);
  }

  async function handleDeleteTrip() {
    if (!tripId) return;
    Alert.alert('Delete Trip', 'This will permanently delete the trip and all its data.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setDeleting(true);
        try {
          await supabase.from('activities').delete().eq('trip_id', tripId);
          await supabase.from('expenses').delete().eq('trip_id', tripId);
          await supabase.from('accommodations').delete().eq('trip_id', tripId);
          await supabase.from('transport').delete().eq('trip_id', tripId);
          await supabase.from('journal_entries').delete().eq('trip_id', tripId);
          await supabase.from('packing_items').delete().eq('trip_id', tripId);
          await supabase.from('documents').delete().eq('trip_id', tripId);
          await supabase.from('destinations').delete().eq('trip_id', tripId);
          await supabase.from('trip_members').delete().eq('trip_id', tripId);
          const { error } = await supabase.from('trips').delete().eq('id', tripId);
          if (error) throw error;
          Alert.alert('✅ Trip deleted', 'Your trip has been successfully deleted.', [
            { text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Home' }] }) },
          ]);
        } catch (err: any) {
          Alert.alert('Error', err.message ?? 'Could not delete trip.');
          setDeleting(false);
        }
      }},
    ]);
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '—';
    try { return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return dateStr; }
  }

  function getInviteCode() {
    if (trip?.invite_code) return trip.invite_code;
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Trip Settings</Text>
        <View style={{ width: 40, alignItems: 'flex-end' }}>
          {saving ? <ActivityIndicator size="small" color="#4CAF50" /> : null}
        </View>
      </View>

      {deleting ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
          <ActivityIndicator size="large" color="#F44336" />
          <Text style={{ fontSize: 15, color: '#888' }}>Deleting trip...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

          <SectionBlock title="TRIP DETAILS" headerColor="#FFE082" textColor="#E65100" icon="✏️">
            <SettingsRow icon="✏️" label="Trip name" value={trip?.name ?? '—'} tappable onPress={() => setShowNameModal(true)} />
            <View style={styles.divider} />
            <SettingsRow icon="📅" label="Start date" value={formatDate(trip?.start_date)} tappable onPress={() => setShowStartDate(true)} />
            <View style={styles.divider} />
            <SettingsRow icon="📅" label="End date" value={formatDate(trip?.end_date)} tappable onPress={() => setShowEndDate(true)} />
            <View style={styles.divider} />
            <SettingsRow
              icon="💶" label="Currency"
              value={`${CURRENCY_FLAGS[trip?.currency] ?? '💱'} ${trip?.currency ?? 'EUR'}`}
              tappable onPress={() => setShowCurrency(true)}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon="🏦" label="Budget"
              value={trip?.budget ? `${trip?.currency ?? '€'} ${Number(trip.budget).toLocaleString()}` : '—'}
              tappable onPress={() => setShowBudget(true)}
            />
          </SectionBlock>

          <SectionBlock title="TRAVELERS" headerColor="#B39DDB" textColor="#311B92" icon="👥">
            {members.map((m, index) => {
              const profile = m.profiles;
              const isOwner = m.role === 'owner' || m.user_id === currentUserId;
              const name = profile?.name ?? profile?.email ?? 'Unknown';
              return (
                <View key={m.user_id ?? index}>
                  <View style={styles.travelerRow}>
                    <View style={[styles.travelerAvatar, { backgroundColor: isOwner ? '#FFF9C4' : '#E3F2FD', borderColor: isOwner ? '#FFD600' : '#42A5F5' }]}>
                      <Text style={{ fontSize: 20 }}>{isOwner ? '👨' : '🧑'}</Text>
                    </View>
                    <View style={styles.travelerInfo}>
                      <Text style={styles.travelerName}>{name}</Text>
                      <Text style={styles.travelerRole}>{isOwner ? 'Trip owner' : 'Co-traveler'}</Text>
                    </View>
                    {isOwner ? (
                      <View style={styles.ownerBadge}><Text style={styles.ownerBadgeText}>OWNER</Text></View>
                    ) : (
                      <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemoveMember(m.user_id)}>
                        <Text style={styles.removeBtnText}>Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {index < members.length - 1 && <View style={styles.divider} />}
                </View>
              );
            })}
            {members.length === 0 && (
              <Text style={{ color: '#888', fontSize: 13, paddingVertical: 12, textAlign: 'center' }}>No members found</Text>
            )}
            <View style={styles.divider} />
            <TouchableOpacity style={styles.addTravelerRow} onPress={() => setShowInvite(true)}>
              <View style={styles.addIcon}><Text style={{ fontSize: 20, color: '#4CAF50' }}>＋</Text></View>
              <Text style={styles.addTravelerText}>Invite traveler</Text>
            </TouchableOpacity>
          </SectionBlock>

          <SectionBlock title="NOTIFICATIONS" headerColor="#90CAF9" textColor="#0D47A1" icon="🔔">
            <NotifRow icon="✈️" label="Flight reminders" value={notifFlight} onToggle={setNotifFlight} />
            <View style={styles.divider} />
            <NotifRow icon="🏨" label="Check-in reminders" value={notifCheckin} onToggle={setNotifCheckin} />
            <View style={styles.divider} />
            <NotifRow icon="💰" label="Budget alerts" value={notifBudget} onToggle={setNotifBudget} />
            <View style={styles.divider} />
            <NotifRow icon="👥" label="Partner activity" value={notifPartner} onToggle={setNotifPartner} />
          </SectionBlock>

          <SectionBlock title="ACTIONS" headerColor="#A5D6A7" textColor="#1B5E20" icon="⚙️">
            <SettingsRow icon="🔗" label="Share invite code" tappable onPress={() => setShowInvite(true)} />
            <View style={styles.divider} />
            <SettingsRow icon="📤" label="Share trip info" tappable onPress={() => {
              if (!trip) return;
              Share.share({ message: `✈️ ${trip.name}\n📅 ${formatDate(trip.start_date)} – ${formatDate(trip.end_date)}\n💶 Budget: ${trip.currency ?? '€'} ${trip.budget ?? 0}\n\nPlanned with Ultimate Travel Buddy` });
            }} />
            <View style={styles.divider} />
            <SettingsRow icon="📋" label="Duplicate trip" tappable onPress={handleDuplicateTrip} />
          </SectionBlock>

          <TouchableOpacity style={styles.deleteCard} onPress={handleDeleteTrip}>
            <Text style={{ fontSize: 20 }}>🗑️</Text>
            <View style={styles.deleteInfo}>
              <Text style={styles.deleteTitle}>Delete trip</Text>
              <Text style={styles.deleteSubtitle}>This action cannot be undone</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <View style={styles.footerDecor}>
            <Dot color="#BBB" size={5} style={{ position: 'relative' }} />
            <Dot color="#BBB" size={4} style={{ position: 'relative', marginLeft: 8 }} />
            <Sparkle color="#FF9800" size={10} style={{ position: 'relative', marginLeft: 6 }} />
          </View>
          <View style={{ height: 24 }} />
        </ScrollView>
      )}

      <TripNameModal visible={showNameModal} value={trip?.name ?? ''} onSave={v => updateField('name', v)} onClose={() => setShowNameModal(false)} />
      <DatePickerModal visible={showStartDate} title="📅 Start Date" value={trip?.start_date ?? ''} onSelect={v => updateField('start_date', v)} onClose={() => setShowStartDate(false)} />
      <DatePickerModal visible={showEndDate} title="📅 End Date" value={trip?.end_date ?? ''} onSelect={v => updateField('end_date', v)} onClose={() => setShowEndDate(false)} />
      <CurrencyPickerModal visible={showCurrency} selected={trip?.currency ?? 'EUR'} onSelect={v => updateField('currency', v)} onClose={() => setShowCurrency(false)} />
      <BudgetModal visible={showBudget} value={String(trip?.budget ?? '')} onSave={v => updateField('budget', Number(v))} onClose={() => setShowBudget(false)} />
      <InviteModal visible={showInvite} tripCode={getInviteCode()} onClose={() => setShowInvite(false)} />
    </SafeAreaView>
  );
}

function SettingsRow({ icon, label, value, tappable, onPress }: {
  icon: string; label: string; value?: string; tappable?: boolean; onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.settingsRow} activeOpacity={tappable ? 0.7 : 1} onPress={onPress}>
      <Text style={styles.settingsIcon}>{icon}</Text>
      <View style={styles.settingsContent}>
        <Text style={styles.settingsLabel}>{label}</Text>
        {value ? <Text style={styles.settingsValue}>{value}</Text> : null}
      </View>
      {tappable && <Text style={styles.chevron}>›</Text>}
    </TouchableOpacity>
  );
}

function NotifRow({ icon, label, value, onToggle }: {
  icon: string; label: string; value: boolean; onToggle: (v: boolean) => void;
}) {
  return (
    <View style={styles.settingsRow}>
      <Text style={styles.settingsIcon}>{icon}</Text>
      <Text style={[styles.settingsLabel, { flex: 1 }]}>{label}</Text>
      <Switch value={value} onValueChange={onToggle} trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }} thumbColor={value ? '#4CAF50' : '#f4f3f4'} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#E8E8E8' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  backBtn: { padding: 4 },
  backIcon: { fontSize: 28, color: '#1A1A1A', fontWeight: '300' },
  title: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  scroll: { flex: 1, padding: 16 },
  divider: { height: 1, backgroundColor: '#F5F5F5' },
  settingsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  settingsIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  settingsContent: { flex: 1 },
  settingsLabel: { fontSize: 15, color: '#1A1A1A', fontWeight: '500' },
  settingsValue: { fontSize: 13, color: '#888', marginTop: 2 },
  chevron: { fontSize: 22, color: '#CCC', fontWeight: '300' },
  travelerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  travelerAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  travelerInfo: { flex: 1 },
  travelerName: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  travelerRole: { fontSize: 12, color: '#888', marginTop: 2 },
  ownerBadge: { backgroundColor: '#E8F5E9', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  ownerBadgeText: { fontSize: 11, fontWeight: '800', color: '#4CAF50' },
  removeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#FFCDD2' },
  removeBtnText: { fontSize: 12, fontWeight: '600', color: '#F44336' },
  addTravelerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  addIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#A5D6A7', borderStyle: 'dashed' },
  addTravelerText: { fontSize: 14, fontWeight: '600', color: '#4CAF50' },
  deleteCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFF5F5', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1.5, borderColor: '#FFCDD2' },
  deleteInfo: { flex: 1 },
  deleteTitle: { fontSize: 15, fontWeight: '700', color: '#F44336' },
  deleteSubtitle: { fontSize: 12, color: '#888', marginTop: 2 },
  footerDecor: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
});