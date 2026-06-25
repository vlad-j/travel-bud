import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  User, Mail, ChevronRight, Globe, DollarSign, MapPin, Ruler,
  Plane, Armchair, Star, Phone, Bell, Users, Calendar, FileText,
  CreditCard, Lock, Shield, Download, Trash2, Settings,
} from 'lucide-react-native';
import BottomSheet, { SheetButton } from '../components/BottomSheet';
import { supabase } from '../lib/supabase';
import { COUNTRIES, CURRENCIES, LANGUAGES } from '../data/staticData';

// ─── Connected service logos ────────────────────────────────────────────────────
function GmailLogo() {
  return <View style={logoStyles.container}><Text style={logoStyles.gmail}>M</Text></View>;
}
function AirbnbLogo() {
  return <View style={[logoStyles.container, { backgroundColor: '#FFF0EE' }]}><Text style={[logoStyles.gmail, { color: '#FF5A5F' }]}>A</Text></View>;
}
function BookingLogo() {
  return <View style={[logoStyles.container, { backgroundColor: '#EEF3FF' }]}><Text style={[logoStyles.gmail, { color: '#003580', fontSize: 13, fontWeight: '900' }]}>B.</Text></View>;
}
function AgodaLogo() {
  return <View style={[logoStyles.container, { backgroundColor: '#FFF0F5' }]}><Text style={[logoStyles.gmail, { color: '#D5006D', fontSize: 12 }]}>Ag</Text></View>;
}
function SkyscannerLogo() {
  return <View style={[logoStyles.container, { backgroundColor: '#EEF9FF' }]}><Text style={[logoStyles.gmail, { color: '#0770E3', fontSize: 11 }]}>Sky</Text></View>;
}

const logoStyles = StyleSheet.create({
  container: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF3F0', alignItems: 'center', justifyContent: 'center' },
  gmail: { fontSize: 18, fontWeight: '800', color: '#EA4335' },
});

function SectionHeader({ label, action, onAction }: { label: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {action ? <TouchableOpacity onPress={onAction}><Text style={styles.sectionAction}>{action}</Text></TouchableOpacity> : null}
    </View>
  );
}

function SettingsRow({ icon, label, value, onPress, showDivider = true, destructive = false }: {
  icon: React.ReactNode; label: string; value?: string; onPress?: () => void; showDivider?: boolean; destructive?: boolean;
}) {
  return (
    <>
      <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
        <View style={styles.rowIcon}>{icon}</View>
        <Text style={[styles.rowLabel, destructive && styles.destructiveText]}>{label}</Text>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        {onPress ? <ChevronRight size={16} color="#C0C0C0" /> : null}
      </TouchableOpacity>
      {showDivider && <View style={styles.rowDivider} />}
    </>
  );
}

function SwitchRow({ icon, label, value, onToggle, showDivider = true }: {
  icon: React.ReactNode; label: string; value: boolean; onToggle: (v: boolean) => void; showDivider?: boolean;
}) {
  return (
    <>
      <View style={styles.row}>
        <View style={styles.rowIcon}>{icon}</View>
        <Text style={[styles.rowLabel, { flex: 1 }]}>{label}</Text>
        <Switch value={value} onValueChange={onToggle} trackColor={{ false: '#E5E5E5', true: '#4CAF50' }} thumbColor="#fff" />
      </View>
      {showDivider && <View style={styles.rowDivider} />}
    </>
  );
}

function ConnectedServiceRow({ logo, name, connected, comingSoon, onToggle, showDivider = true }: {
  logo: React.ReactNode; name: string; connected: boolean; comingSoon?: boolean; onToggle: () => void; showDivider?: boolean;
}) {
  return (
    <>
      <View style={styles.row}>
        {logo}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.rowLabel}>{name}</Text>
            {comingSoon && <View style={styles.comingSoonBadge}><Text style={styles.comingSoonText}>Coming soon</Text></View>}
          </View>
          <Text style={[styles.connectedStatus, { color: connected ? '#4CAF50' : '#999' }]}>
            {connected ? 'Connected' : 'Not connected'}
          </Text>
        </View>
        {!comingSoon && (
          <TouchableOpacity style={[styles.connectBtn, connected && styles.disconnectBtn]} onPress={onToggle}>
            <Text style={[styles.connectBtnText, connected && styles.disconnectBtnText]}>
              {connected ? 'Disconnect' : 'Connect'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {showDivider && <View style={styles.rowDivider} />}
    </>
  );
}

function DistanceSegment({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}><Ruler size={18} color="#555" /></View>
      <Text style={styles.rowLabel}>Distance units</Text>
      <View style={styles.segmentControl}>
        {['Kilometers', 'Miles'].map((opt) => (
          <TouchableOpacity key={opt} style={[styles.segmentBtn, value === opt && styles.segmentBtnActive]} onPress={() => onChange(opt)}>
            <Text style={[styles.segmentText, value === opt && styles.segmentTextActive]}>{opt === 'Kilometers' ? 'km' : 'mi'}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function SearchablePickerSheet({ visible, onClose, title, options, selected, onSelect }: {
  visible: boolean; onClose: () => void; title: string; options: string[]; selected: string; onSelect: (v: string) => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = options.filter((o) => o.toLowerCase().includes(search.toLowerCase()));
  return (
    <BottomSheet visible={visible} onClose={() => { onClose(); setSearch(''); }} title={title}>
      <TextInput
        style={sheetStyles.searchInput}
        placeholder="Search..."
        placeholderTextColor="#C0C0C0"
        value={search}
        onChangeText={setSearch}
        autoFocus
      />
      <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
        {filtered.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={pickerStyles.option}
            onPress={() => { onSelect(opt); onClose(); setSearch(''); }}
            activeOpacity={0.7}
          >
            <Text style={[pickerStyles.optionText, selected === opt && pickerStyles.optionTextActive]}>{opt}</Text>
            {selected === opt && <View style={pickerStyles.check}><Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>✓</Text></View>}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </BottomSheet>
  );
}

function PickerSheet({ visible, onClose, title, options, selected, onSelect }: {
  visible: boolean; onClose: () => void; title: string; options: string[]; selected: string; onSelect: (v: string) => void;
}) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      {options.map((opt) => (
        <TouchableOpacity key={opt} style={pickerStyles.option} onPress={() => { onSelect(opt); onClose(); }} activeOpacity={0.7}>
          <Text style={[pickerStyles.optionText, selected === opt && pickerStyles.optionTextActive]}>{opt}</Text>
          {selected === opt && <View style={pickerStyles.check}><Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>✓</Text></View>}
        </TouchableOpacity>
      ))}
    </BottomSheet>
  );
}

const sheetStyles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 6, marginTop: 14, letterSpacing: 0.3 },
  input: { backgroundColor: '#F7F7F7', borderRadius: 12, borderWidth: 1, borderColor: '#EBEBEB', paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1A1A1A' },
  searchInput: { backgroundColor: '#F7F7F7', borderRadius: 12, borderWidth: 1, borderColor: '#EBEBEB', paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: '#1A1A1A', marginBottom: 8 },
});

const pickerStyles = StyleSheet.create({
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  optionText: { fontSize: 16, color: '#1A1A1A' },
  optionTextActive: { color: '#4CAF50', fontWeight: '700' },
  check: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#4CAF50', alignItems: 'center', justifyContent: 'center' },
});

const TRAVEL_STYLES = ['Budget', 'Mid-range', 'Luxury', 'Backpacker', 'Business'];
const SEAT_OPTIONS = ['Window', 'Aisle', 'Middle', 'No preference'];

export default function ProfileSettingsScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [tripCount, setTripCount] = useState(0);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [emergencyVisible, setEmergencyVisible] = useState(false);
  const [flyerVisible, setFlyerVisible] = useState(false);
  const [travelStyleVisible, setTravelStyleVisible] = useState(false);
  const [seatVisible, setSeatVisible] = useState(false);
  const [currencyVisible, setCurrencyVisible] = useState(false);
  const [languageVisible, setLanguageVisible] = useState(false);
  const [countryVisible, setCountryVisible] = useState(false);

  const [services, setServices] = useState({ gmail: false, airbnb: false, booking: false, agoda: false, skyscanner: false });
  const [currency, setCurrency] = useState('EUR');
  const [language, setLanguage] = useState('English');
  const [homeCountry, setHomeCountry] = useState('Romania');
  const [distanceUnits, setDistanceUnits] = useState('Kilometers');
  const [travelStyle, setTravelStyle] = useState('Mid-range');
  const [flightSeat, setFlightSeat] = useState('Window');
  const [notifPartner, setNotifPartner] = useState(true);
  const [notifActivity, setNotifActivity] = useState(true);
  const [notifPrice, setNotifPrice] = useState(false);
  const [notifAccom, setNotifAccom] = useState(true);
  const [notifDoc, setNotifDoc] = useState(true);

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setEmail(user.email ?? '');

    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (profileData) {
      setName(profileData.name ?? '');
      setCurrency(profileData.default_currency ?? 'EUR');
      setHomeCountry(profileData.home_country ?? 'Romania');
      setLanguage(profileData.language ?? 'English');
      setDistanceUnits(profileData.distance_units ?? 'Kilometers');
    } else {
      setName(user.user_metadata?.full_name ?? '');
    }

    const { data: memberships } = await supabase.from('trip_members').select('trip_id').eq('user_id', user.id);
    setTripCount(memberships?.length ?? 0);
    setLoading(false);
  }

  async function savePreference(key: string, value: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').upsert({ id: user.id, [key]: value });
  }

  async function handleSaveProfile() {
    setSavingProfile(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('profiles').upsert({ id: user.id, name: editName.trim(), email: editEmail.trim() });
    if (error) { Alert.alert('Error', error.message); }
    else { setName(editName.trim()); setEmail(editEmail.trim()); setEditVisible(false); }
    setSavingProfile(false);
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) { Alert.alert('Error', 'Passwords do not match'); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { Alert.alert('Error', error.message); }
    else { Alert.alert('Success', 'Password updated!'); setNewPassword(''); setConfirmPassword(''); setPasswordVisible(false); }
  }

  const currencyOptions = CURRENCIES.map((c) => `${c.code} (${c.symbol})`);
  const selectedCurrencyDisplay = CURRENCIES.find((c) => c.code === currency) ? `${currency} (${CURRENCIES.find((c) => c.code === currency)?.symbol})` : currency;

  const initials = name.split(' ').map((w) => w[0]).join('').toUpperCase() || '?';

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
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={() => { setEditName(name); setEditEmail(email); setEditVisible(true); }}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.profileRow} onPress={() => { setEditName(name); setEditEmail(email); setEditVisible(true); }} activeOpacity={0.7}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{name || 'Your Name'}</Text>
              <Text style={styles.profileBadge}>Travel Explorer · {tripCount} trips</Text>
              <View style={styles.emailRow}>
                <Mail size={13} color="#999" />
                <Text style={styles.profileEmail}>{email}</Text>
              </View>
            </View>
            <ChevronRight size={18} color="#C0C0C0" />
          </TouchableOpacity>
        </View>

        <SectionHeader label="CONNECTED SERVICES" action="Manage" />
        <View style={styles.card}>
          <ConnectedServiceRow logo={<GmailLogo />} name="Gmail" connected={services.gmail} comingSoon onToggle={() => {}} />
          <ConnectedServiceRow logo={<AirbnbLogo />} name="Airbnb" connected={services.airbnb} onToggle={() => setServices((p) => ({ ...p, airbnb: !p.airbnb }))} />
          <ConnectedServiceRow logo={<BookingLogo />} name="Booking.com" connected={services.booking} onToggle={() => setServices((p) => ({ ...p, booking: !p.booking }))} />
          <ConnectedServiceRow logo={<AgodaLogo />} name="Agoda" connected={services.agoda} onToggle={() => setServices((p) => ({ ...p, agoda: !p.agoda }))} />
          <ConnectedServiceRow logo={<SkyscannerLogo />} name="Skyscanner" connected={services.skyscanner} onToggle={() => setServices((p) => ({ ...p, skyscanner: !p.skyscanner }))} showDivider={false} />
        </View>

        <SectionHeader label="PREFERENCES" />
        <View style={styles.card}>
          <SettingsRow icon={<DollarSign size={18} color="#555" />} label="Default currency" value={selectedCurrencyDisplay} onPress={() => setCurrencyVisible(true)} />
          <SettingsRow icon={<Globe size={18} color="#555" />} label="Language" value={language} onPress={() => setLanguageVisible(true)} />
          <SettingsRow icon={<MapPin size={18} color="#555" />} label="Home country" value={homeCountry} onPress={() => setCountryVisible(true)} />
          <DistanceSegment value={distanceUnits} onChange={(v) => { setDistanceUnits(v); savePreference('distance_units', v); }} />
        </View>

        <SectionHeader label="TRAVEL PREFERENCES" />
        <View style={styles.card}>
          <SettingsRow icon={<Settings size={18} color="#555" />} label="Travel style" value={travelStyle} onPress={() => setTravelStyleVisible(true)} />
          <SettingsRow icon={<Armchair size={18} color="#555" />} label="Preferred flight seat" value={flightSeat} onPress={() => setSeatVisible(true)} />
          <SettingsRow icon={<Star size={18} color="#555" />} label="Frequent flyer programs" value="2 programs" onPress={() => setFlyerVisible(true)} />
          <SettingsRow icon={<Phone size={18} color="#555" />} label="Emergency contact" value="Set" onPress={() => setEmergencyVisible(true)} showDivider={false} />
        </View>

        <SectionHeader label="NOTIFICATIONS" />
        <View style={styles.card}>
          <SwitchRow icon={<Users size={18} color="#555" />} label="Partner activity" value={notifPartner} onToggle={setNotifPartner} />
          <SwitchRow icon={<Calendar size={18} color="#555" />} label="Activity reminders" value={notifActivity} onToggle={setNotifActivity} />
          <SwitchRow icon={<CreditCard size={18} color="#555" />} label="Price alerts" value={notifPrice} onToggle={setNotifPrice} />
          <SwitchRow icon={<Bell size={18} color="#555" />} label="Accommodation reminders" value={notifAccom} onToggle={setNotifAccom} />
          <SwitchRow icon={<FileText size={18} color="#555" />} label="Document expiration reminders" value={notifDoc} onToggle={setNotifDoc} showDivider={false} />
        </View>

        <SectionHeader label="SECURITY" />
        <View style={styles.card}>
          <SettingsRow icon={<Lock size={18} color="#555" />} label="Change password" onPress={() => setPasswordVisible(true)} />
          <SettingsRow icon={<Shield size={18} color="#555" />} label="Two-factor authentication" value="Enabled" onPress={() => {}} />
          <SettingsRow icon={<Download size={18} color="#555" />} label="Download my data" onPress={() => navigation.navigate('DownloadData')} />
          <SettingsRow icon={<FileText size={18} color="#555" />} label="Privacy policy" onPress={() => navigation.navigate('PrivacyPolicy')} />
          <SettingsRow icon={<Trash2 size={18} color="#EF4444" />} label="Delete account" onPress={() => {}} showDivider={false} destructive />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={async () => { await supabase.auth.signOut(); }}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Ultimate Travel Buddy v1.0.0</Text>
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Edit Profile */}
      <BottomSheet visible={editVisible} onClose={() => setEditVisible(false)} title="Edit Profile">
        <Text style={sheetStyles.label}>Full name</Text>
        <TextInput style={sheetStyles.input} value={editName} onChangeText={setEditName} placeholder="Your name" placeholderTextColor="#C0C0C0" />
        <Text style={sheetStyles.label}>Email address</Text>
        <TextInput style={sheetStyles.input} value={editEmail} onChangeText={setEditEmail} placeholder="your@email.com" placeholderTextColor="#C0C0C0" keyboardType="email-address" autoCapitalize="none" />
        <SheetButton label={savingProfile ? 'Saving...' : 'Save Changes'} onPress={handleSaveProfile} disabled={!editName.trim() || savingProfile} />
      </BottomSheet>

      {/* Change Password */}
      <BottomSheet visible={passwordVisible} onClose={() => setPasswordVisible(false)} title="Change Password">
        <Text style={sheetStyles.label}>New password</Text>
        <TextInput style={sheetStyles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="••••••••" placeholderTextColor="#C0C0C0" />
        <Text style={sheetStyles.label}>Confirm new password</Text>
        <TextInput style={sheetStyles.input} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder="••••••••" placeholderTextColor="#C0C0C0" />
        <SheetButton label="Update Password" onPress={handleChangePassword} disabled={!newPassword.trim() || newPassword !== confirmPassword} />
      </BottomSheet>

      {/* Emergency Contact */}
      <BottomSheet visible={emergencyVisible} onClose={() => setEmergencyVisible(false)} title="Emergency Contact">
        <Text style={sheetStyles.label}>Contact name</Text>
        <TextInput style={sheetStyles.input} placeholder="Full name" placeholderTextColor="#C0C0C0" />
        <Text style={sheetStyles.label}>Phone number</Text>
        <TextInput style={sheetStyles.input} placeholder="+40 700 000 000" placeholderTextColor="#C0C0C0" keyboardType="phone-pad" />
        <SheetButton label="Save Contact" onPress={() => setEmergencyVisible(false)} />
      </BottomSheet>

      {/* Frequent Flyer */}
      <BottomSheet visible={flyerVisible} onClose={() => setFlyerVisible(false)} title="Frequent Flyer Programs">
        <Text style={sheetStyles.label}>Airline / program</Text>
        <TextInput style={sheetStyles.input} placeholder="e.g. Miles & More" placeholderTextColor="#C0C0C0" />
        <Text style={sheetStyles.label}>Membership number</Text>
        <TextInput style={sheetStyles.input} placeholder="e.g. LH-123456789" placeholderTextColor="#C0C0C0" />
        <SheetButton label="Add Program" onPress={() => setFlyerVisible(false)} />
      </BottomSheet>

      {/* Searchable pickers */}
      <SearchablePickerSheet
        visible={currencyVisible}
        onClose={() => setCurrencyVisible(false)}
        title="Default Currency"
        options={currencyOptions}
        selected={selectedCurrencyDisplay}
        onSelect={(val) => { const code = val.split(' ')[0]; setCurrency(code); savePreference('default_currency', code); }}
      />
      <SearchablePickerSheet
        visible={languageVisible}
        onClose={() => setLanguageVisible(false)}
        title="Language"
        options={LANGUAGES}
        selected={language}
        onSelect={(val) => { setLanguage(val); savePreference('language', val); }}
      />
      <SearchablePickerSheet
        visible={countryVisible}
        onClose={() => setCountryVisible(false)}
        title="Home Country"
        options={COUNTRIES}
        selected={homeCountry}
        onSelect={(val) => { setHomeCountry(val); savePreference('home_country', val); }}
      />
      <PickerSheet visible={travelStyleVisible} onClose={() => setTravelStyleVisible(false)} title="Travel Style" options={TRAVEL_STYLES} selected={travelStyle} onSelect={setTravelStyle} />
      <PickerSheet visible={seatVisible} onClose={() => setSeatVisible(false)} title="Preferred Flight Seat" options={SEAT_OPTIONS} selected={flightSeat} onSelect={setFlightSeat} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F7F7' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
  editText: { fontSize: 15, fontWeight: '600', color: '#4CAF50' },
  scroll: { flex: 1 },
  card: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 14, marginBottom: 8, paddingHorizontal: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#999', letterSpacing: 0.8 },
  sectionAction: { fontSize: 13, fontWeight: '600', color: '#4CAF50' },
  profileRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 14 },
  avatarCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#A5D6A7' },
  avatarInitials: { fontSize: 20, fontWeight: '800', color: '#2E7D32' },
  profileName: { fontSize: 17, fontWeight: '700', color: '#1A1A1A', marginBottom: 2 },
  profileBadge: { fontSize: 13, color: '#4CAF50', fontWeight: '600', marginBottom: 4 },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  profileEmail: { fontSize: 13, color: '#888' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, minHeight: 50 },
  rowIcon: { width: 28, alignItems: 'center', marginRight: 12 },
  rowLabel: { flex: 1, fontSize: 15, color: '#1A1A1A', fontWeight: '400' },
  rowValue: { fontSize: 14, color: '#888', marginRight: 8 },
  rowDivider: { height: 1, backgroundColor: '#F5F5F5', marginLeft: 40 },
  destructiveText: { color: '#EF4444' },
  connectedStatus: { fontSize: 12, marginTop: 1 },
  connectBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: '#4CAF50' },
  disconnectBtn: { borderColor: '#E0E0E0', backgroundColor: '#F7F7F7' },
  connectBtnText: { fontSize: 13, fontWeight: '600', color: '#4CAF50' },
  disconnectBtnText: { color: '#888' },
  comingSoonBadge: { backgroundColor: '#FFF8E1', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  comingSoonText: { fontSize: 10, fontWeight: '700', color: '#F59E0B' },
  segmentControl: { flexDirection: 'row', backgroundColor: '#F0F0F0', borderRadius: 8, padding: 2 },
  segmentBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6 },
  segmentBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 },
  segmentText: { fontSize: 13, fontWeight: '600', color: '#888' },
  segmentTextActive: { color: '#1A1A1A', fontWeight: '700' },
  logoutBtn: { alignItems: 'center', paddingVertical: 18, marginTop: 8 },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#EF4444' },
  version: { textAlign: 'center', fontSize: 12, color: '#BBBBBB', marginBottom: 8 },
});
