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
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ChevronRight, Globe, DollarSign, MapPin, Ruler,
  Armchair, Star, Phone, Bell, Users, Calendar, FileText,
  CreditCard, Lock, Shield, Download, Trash2, Settings, Mail,
  Plane, Moon, Search, X,
} from 'lucide-react-native';
import BottomSheet, { SheetButton } from '../components/BottomSheet';
import { supabase } from '../lib/supabase';
import { COUNTRIES, CURRENCIES, LANGUAGES } from '../data/staticData';

// ─── Country flags map ────────────────────────────────────────────────────────
const COUNTRY_FLAGS: Record<string, string> = {
  'Romania': '🇷🇴', 'United States of America': '🇺🇸', 'United Kingdom': '🇬🇧',
  'Germany': '🇩🇪', 'France': '🇫🇷', 'Italy': '🇮🇹', 'Spain': '🇪🇸',
  'Japan': '🇯🇵', 'China': '🇨🇳', 'India': '🇮🇳', 'Brazil': '🇧🇷',
  'Australia': '🇦🇺', 'Canada': '🇨🇦', 'Mexico': '🇲🇽', 'Netherlands': '🇳🇱',
  'Sweden': '🇸🇪', 'Norway': '🇳🇴', 'Denmark': '🇩🇰', 'Finland': '🇫🇮',
  'Switzerland': '🇨🇭', 'Austria': '🇦🇹', 'Belgium': '🇧🇪', 'Portugal': '🇵🇹',
  'Greece': '🇬🇷', 'Poland': '🇵🇱', 'Czech Republic': '🇨🇿', 'Hungary': '🇭🇺',
  'Turkey': '🇹🇷', 'Indonesia': '🇮🇩', 'Thailand': '🇹🇭', 'Vietnam': '🇻🇳',
  'Malaysia': '🇲🇾', 'Singapore': '🇸🇬', 'Philippines': '🇵🇭', 'South Korea': '🇰🇷',
  'Argentina': '🇦🇷', 'Chile': '🇨🇱', 'Colombia': '🇨🇴', 'Peru': '🇵🇪',
  'Egypt': '🇪🇬', 'South Africa': '🇿🇦', 'Morocco': '🇲🇦', 'Nigeria': '🇳🇬',
  'Kenya': '🇰🇪', 'United Arab Emirates': '🇦🇪', 'Saudi Arabia': '🇸🇦',
  'Israel': '🇮🇱', 'Russia': '🇷🇺', 'Ukraine': '🇺🇦', 'Croatia': '🇭🇷',
  'Serbia': '🇷🇸', 'Bulgaria': '🇧🇬', 'Slovakia': '🇸🇰', 'Slovenia': '🇸🇮',
  'Estonia': '🇪🇪', 'Latvia': '🇱🇻', 'Lithuania': '🇱🇹', 'Ireland': '🇮🇪',
  'New Zealand': '🇳🇿', 'Iceland': '🇮🇸', 'Luxembourg': '🇱🇺',
};

// ─── Language native names ────────────────────────────────────────────────────
const LANGUAGE_NATIVE: Record<string, string> = {
  'Afrikaans': 'Afrikaans', 'Albanian': 'Shqip', 'Arabic': 'العربية',
  'Armenian': 'Հայերեն', 'Azerbaijani': 'Azərbaycan', 'Basque': 'Euskara',
  'Belarusian': 'Беларуская', 'Bengali': 'বাংলা', 'Bosnian': 'Bosanski',
  'Bulgarian': 'Български', 'Catalan': 'Català', 'Chinese (Simplified)': '中文(简体)',
  'Chinese (Traditional)': '中文(繁體)', 'Croatian': 'Hrvatski', 'Czech': 'Čeština',
  'Danish': 'Dansk', 'Dutch': 'Nederlands', 'English': 'English',
  'Estonian': 'Eesti', 'Finnish': 'Suomi', 'French': 'Français',
  'Galician': 'Galego', 'Georgian': 'ქართული', 'German': 'Deutsch',
  'Greek': 'Ελληνικά', 'Gujarati': 'ગુજરાતી', 'Haitian Creole': 'Kreyòl ayisyen',
  'Hebrew': 'עברית', 'Hindi': 'हिन्दी', 'Hungarian': 'Magyar',
  'Icelandic': 'Íslenska', 'Indonesian': 'Bahasa Indonesia', 'Irish': 'Gaeilge',
  'Italian': 'Italiano', 'Japanese': '日本語', 'Kannada': 'ಕನ್ನಡ',
  'Kazakh': 'Қазақша', 'Korean': '한국어', 'Latvian': 'Latviešu',
  'Lithuanian': 'Lietuvių', 'Macedonian': 'Македонски', 'Malay': 'Bahasa Melayu',
  'Maltese': 'Malti', 'Marathi': 'मराठी', 'Mongolian': 'Монгол',
  'Nepali': 'नेपाली', 'Norwegian': 'Norsk', 'Persian': 'فارسی',
  'Polish': 'Polski', 'Portuguese': 'Português', 'Romanian': 'Română',
  'Russian': 'Русский', 'Serbian': 'Српски', 'Slovak': 'Slovenčina',
  'Slovenian': 'Slovenščina', 'Spanish': 'Español', 'Swahili': 'Kiswahili',
  'Swedish': 'Svenska', 'Tamil': 'தமிழ்', 'Telugu': 'తెలుగు',
  'Thai': 'ภาษาไทย', 'Turkish': 'Türkçe', 'Ukrainian': 'Українська',
  'Urdu': 'اردو', 'Uzbek': 'Oʻzbek', 'Vietnamese': 'Tiếng Việt', 'Welsh': 'Cymraeg',
};

// ─── Currency flags ───────────────────────────────────────────────────────────
const CURRENCY_FLAGS: Record<string, string> = {
  EUR: '🇪🇺', USD: '🇺🇸', GBP: '🇬🇧', JPY: '🇯🇵', IDR: '🇮🇩',
  CHF: '🇨🇭', AUD: '🇦🇺', CAD: '🇨🇦', CNY: '🇨🇳', INR: '🇮🇳',
  KRW: '🇰🇷', SGD: '🇸🇬', THB: '🇹🇭', MYR: '🇲🇾', PHP: '🇵🇭',
  VND: '🇻🇳', HKD: '🇭🇰', NZD: '🇳🇿', SEK: '🇸🇪', NOK: '🇳🇴',
  DKK: '🇩🇰', PLN: '🇵🇱', CZK: '🇨🇿', HUF: '🇭🇺', RON: '🇷🇴',
  TRY: '🇹🇷', AED: '🇦🇪', SAR: '🇸🇦', ZAR: '🇿🇦', BRL: '🇧🇷',
  MXN: '🇲🇽', ARS: '🇦🇷', RUB: '🇷🇺', UAH: '🇺🇦', EGP: '🇪🇬',
  RON: '🇷🇴',
};

const POPULAR_CURRENCIES = ['EUR', 'USD', 'GBP', 'RON', 'JPY', 'CHF', 'AUD', 'CAD'];

// ─── Travel Style options ─────────────────────────────────────────────────────
const TRAVEL_STYLES = [
  { value: 'Budget', icon: '💰', desc: 'Affordable travel, smart spending' },
  { value: 'Mid-range', icon: '🌟', desc: 'Comfort without breaking the bank' },
  { value: 'Luxury', icon: '✨', desc: 'Premium hotels, comfort first' },
  { value: 'Backpacker', icon: '🎒', desc: 'Adventure first, pack light' },
  { value: 'Business', icon: '💼', desc: 'Efficiency and productivity' },
];

// ─── Flight Seat options ──────────────────────────────────────────────────────
const SEAT_OPTIONS = [
  { value: 'Window', icon: '🪟', desc: 'Views & lean against the wall' },
  { value: 'Aisle', icon: '🚶', desc: 'Easy access, stretch your legs' },
  { value: 'Middle', icon: '💺', desc: 'Between two passengers' },
  { value: 'No preference', icon: '○', desc: 'Any seat works for me' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
        <View style={styles.rowIconCircle}>{icon}</View>
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
        <View style={styles.rowIconCircle}>{icon}</View>
        <Text style={[styles.rowLabel, { flex: 1 }]}>{label}</Text>
        <Switch value={value} onValueChange={onToggle} trackColor={{ false: '#E5E5E5', true: '#4CAF50' }} thumbColor="#fff" />
      </View>
      {showDivider && <View style={styles.rowDivider} />}
    </>
  );
}

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
            {comingSoon && <View style={styles.comingSoonBadge}><Text style={styles.comingSoonText}>Soon</Text></View>}
          </View>
          {connected ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#4CAF50' }} />
              <Text style={{ fontSize: 12, color: '#4CAF50', fontWeight: '600' }}>Connected</Text>
            </View>
          ) : (
            <Text style={{ fontSize: 12, color: '#999', marginTop: 2 }}>Not connected</Text>
          )}
        </View>
        {!comingSoon && (
          <TouchableOpacity
            style={[styles.connectBtn, connected && styles.connectedBtn]}
            onPress={onToggle}
          >
            {connected ? (
              <Text style={styles.connectedBtnText}>✓ Connected</Text>
            ) : (
              <Text style={styles.connectBtnText}>Connect →</Text>
            )}
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
      <View style={styles.rowIconCircle}><Ruler size={18} color="#555" /></View>
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

// ─── Main Screen ──────────────────────────────────────────────────────────────
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
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  const [flyerVisible, setFlyerVisible] = useState(false);
  const [flyerPrograms, setFlyerPrograms] = useState<{ airline: string; number: string }[]>([]);
  const [newFlyerAirline, setNewFlyerAirline] = useState('');
  const [newFlyerNumber, setNewFlyerNumber] = useState('');

  const [travelStyleVisible, setTravelStyleVisible] = useState(false);
  const [seatVisible, setSeatVisible] = useState(false);
  const [currencyVisible, setCurrencyVisible] = useState(false);
  const [languageVisible, setLanguageVisible] = useState(false);
  const [countryVisible, setCountryVisible] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);

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

  const [profileVisibility, setProfileVisibility] = useState('partners');
  const [locationSharing, setLocationSharing] = useState('partners');
  const [invitePermission, setInvitePermission] = useState('everyone');
  const [shareActivity, setShareActivity] = useState(true);

  const [currencySearch, setCurrencySearch] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const [languageSearch, setLanguageSearch] = useState('');

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
      setTravelStyle(profileData.travel_style ?? 'Mid-range');
      setFlightSeat(profileData.flight_seat ?? 'Window');
      setProfileVisibility(profileData.profile_visibility ?? 'partners');
      setLocationSharing(profileData.location_sharing ?? 'partners');
      setInvitePermission(profileData.invite_permission ?? 'everyone');
      setShareActivity(profileData.share_activity ?? true);
      setEmergencyName(profileData.emergency_contact_name ?? '');
      setEmergencyPhone(profileData.emergency_contact_phone ?? '');
      if (profileData.frequent_flyer) {
        setFlyerPrograms(profileData.frequent_flyer);
      }
    } else {
      setName(user.user_metadata?.full_name ?? '');
    }

    const { data: memberships } = await supabase.from('trip_members').select('trip_id').eq('user_id', user.id);
    setTripCount(memberships?.length ?? 0);
    setLoading(false);
  }

  async function savePreference(key: string, value: any) {
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

  async function handleSaveEmergency() {
    await savePreference('emergency_contact_name', emergencyName);
    await savePreference('emergency_contact_phone', emergencyPhone);
    setEmergencyVisible(false);
    Alert.alert('✅ Saved', 'Emergency contact saved.');
  }

  async function handleAddFlyer() {
    if (!newFlyerAirline.trim()) return;
    const updated = [...flyerPrograms, { airline: newFlyerAirline.trim(), number: newFlyerNumber.trim() }];
    setFlyerPrograms(updated);
    await savePreference('frequent_flyer', updated);
    setNewFlyerAirline('');
    setNewFlyerNumber('');
  }

  async function handleRemoveFlyer(index: number) {
    const updated = flyerPrograms.filter((_, i) => i !== index);
    setFlyerPrograms(updated);
    await savePreference('frequent_flyer', updated);
  }

  const initials = name.split(' ').map((w) => w[0]).join('').toUpperCase() || '?';

  const filteredCurrencies = CURRENCIES.filter(c =>
    c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
    c.name.toLowerCase().includes(currencySearch.toLowerCase())
  );

  const filteredCountries = COUNTRIES.filter(c =>
    c.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const filteredLanguages = LANGUAGES.filter(l =>
    l.toLowerCase().includes(languageSearch.toLowerCase()) ||
    (LANGUAGE_NATIVE[l] ?? '').toLowerCase().includes(languageSearch.toLowerCase())
  );

  const emergencySet = emergencyName || emergencyPhone;

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

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          <Text style={styles.profileName}>{name || 'Your Name'}</Text>
          <View style={styles.profileBadgesRow}>
            <View style={styles.explorerBadge}>
              <Text style={styles.explorerBadgeText}>✈️ Travel Explorer</Text>
            </View>
            <View style={styles.tripsBadge}>
              <Text style={styles.tripsBadgeText}>{tripCount} trips</Text>
            </View>
          </View>
          <View style={styles.emailRow}>
            <Mail size={13} color="#999" />
            <Text style={styles.profileEmail}>{email}</Text>
          </View>
        </View>

        {/* Travel Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>TRAVEL STATS</Text>
          <View style={styles.statsGrid}>
            <StatItem icon="✈️" label="Trips" value={String(tripCount)} />
            <StatItem icon="🌍" label="Countries" value="—" />
            <StatItem icon="🛫" label="Flights" value="—" />
            <StatItem icon="🏨" label="Nights" value="—" />
          </View>
        </View>

        {/* Connected Services */}
        <SectionHeader label="CONNECTED SERVICES" action="Manage" />
        <View style={styles.card}>
          <ConnectedServiceRow logo={<GmailLogo />} name="Gmail" connected={services.gmail} comingSoon onToggle={() => {}} />
          <ConnectedServiceRow logo={<AirbnbLogo />} name="Airbnb" connected={services.airbnb} onToggle={() => setServices((p) => ({ ...p, airbnb: !p.airbnb }))} />
          <ConnectedServiceRow logo={<BookingLogo />} name="Booking.com" connected={services.booking} onToggle={() => setServices((p) => ({ ...p, booking: !p.booking }))} />
          <ConnectedServiceRow logo={<AgodaLogo />} name="Agoda" connected={services.agoda} onToggle={() => setServices((p) => ({ ...p, agoda: !p.agoda }))} />
          <ConnectedServiceRow logo={<SkyscannerLogo />} name="Skyscanner" connected={services.skyscanner} onToggle={() => setServices((p) => ({ ...p, skyscanner: !p.skyscanner }))} showDivider={false} />
        </View>

        {/* Preferences */}
        <SectionHeader label="PREFERENCES" />
        <View style={styles.card}>
          <SettingsRow icon={<DollarSign size={18} color="#555" />} label="Default currency" value={`${CURRENCY_FLAGS[currency] ?? ''} ${currency}`} onPress={() => setCurrencyVisible(true)} />
          <SettingsRow icon={<Globe size={18} color="#555" />} label="Language" value={LANGUAGE_NATIVE[language] ?? language} onPress={() => setLanguageVisible(true)} />
          <SettingsRow icon={<MapPin size={18} color="#555" />} label="Home country" value={`${COUNTRY_FLAGS[homeCountry] ?? ''} ${homeCountry}`} onPress={() => setCountryVisible(true)} />
          <DistanceSegment value={distanceUnits} onChange={(v) => { setDistanceUnits(v); savePreference('distance_units', v); }} />
        </View>

        {/* Travel Preferences */}
        <SectionHeader label="TRAVEL PREFERENCES" />
        <View style={styles.card}>
          <SettingsRow icon={<Settings size={18} color="#555" />} label="Travel style" value={`${TRAVEL_STYLES.find(s => s.value === travelStyle)?.icon ?? ''} ${travelStyle}`} onPress={() => setTravelStyleVisible(true)} />
          <SettingsRow icon={<Armchair size={18} color="#555" />} label="Preferred flight seat" value={`${SEAT_OPTIONS.find(s => s.value === flightSeat)?.icon ?? ''} ${flightSeat}`} onPress={() => setSeatVisible(true)} />
          <SettingsRow icon={<Star size={18} color="#555" />} label="Frequent flyer programs" value={flyerPrograms.length > 0 ? `${flyerPrograms.length} program${flyerPrograms.length > 1 ? 's' : ''}` : 'None'} onPress={() => setFlyerVisible(true)} />
          <SettingsRow icon={<Phone size={18} color="#555" />} label="Emergency contact" value={emergencySet ? emergencyName : 'Not set'} onPress={() => setEmergencyVisible(true)} showDivider={false} />
        </View>

        {/* Notifications */}
        <SectionHeader label="NOTIFICATIONS" />
        <View style={styles.card}>
          <SwitchRow icon={<Users size={18} color="#555" />} label="Partner activity" value={notifPartner} onToggle={(v) => { setNotifPartner(v); savePreference('notif_partner', v); }} />
          <SwitchRow icon={<Calendar size={18} color="#555" />} label="Activity reminders" value={notifActivity} onToggle={(v) => { setNotifActivity(v); savePreference('notif_activity', v); }} />
          <SwitchRow icon={<CreditCard size={18} color="#555" />} label="Price alerts" value={notifPrice} onToggle={(v) => { setNotifPrice(v); savePreference('notif_price', v); }} />
          <SwitchRow icon={<Bell size={18} color="#555" />} label="Accommodation reminders" value={notifAccom} onToggle={(v) => { setNotifAccom(v); savePreference('notif_accom', v); }} />
          <SwitchRow icon={<FileText size={18} color="#555" />} label="Document expiration" value={notifDoc} onToggle={(v) => { setNotifDoc(v); savePreference('notif_doc', v); }} showDivider={false} />
        </View>

        {/* Privacy */}
        <SectionHeader label="PRIVACY" />
        <View style={styles.card}>
          <SettingsRow
            icon={<Shield size={18} color="#555" />}
            label="Profile visibility"
            value={profileVisibility === 'everyone' ? '🌍 Everyone' : profileVisibility === 'partners' ? '👥 Partners' : '🔒 Only me'}
            onPress={() => setPrivacyVisible(true)}
          />
          <SettingsRow
            icon={<MapPin size={18} color="#555" />}
            label="Location sharing"
            value={locationSharing === 'everyone' ? '🌍 Everyone' : locationSharing === 'partners' ? '👥 Partners' : '🔒 Off'}
            onPress={() => {
              const opts = ['partners', 'everyone', 'off'];
              const next = opts[(opts.indexOf(locationSharing) + 1) % opts.length];
              setLocationSharing(next);
              savePreference('location_sharing', next);
            }}
          />
          <SettingsRow
            icon={<Users size={18} color="#555" />}
            label="Who can invite me"
            value={invitePermission === 'everyone' ? '🌍 Everyone' : '👥 Partners only'}
            onPress={() => {
              const next = invitePermission === 'everyone' ? 'partners' : 'everyone';
              setInvitePermission(next);
              savePreference('invite_permission', next);
            }}
          />
          <SwitchRow
            icon={<Bell size={18} color="#555" />}
            label="Share activity with partner"
            value={shareActivity}
            onToggle={(v) => { setShareActivity(v); savePreference('share_activity', v); }}
            showDivider={false}
          />
        </View>

        {/* Security */}
        <SectionHeader label="SECURITY" />
        <View style={styles.card}>
          <SettingsRow icon={<Lock size={18} color="#555" />} label="Change password" onPress={() => setPasswordVisible(true)} />
          <SettingsRow icon={<Shield size={18} color="#555" />} label="Two-factor authentication" value="Enabled" onPress={() => {}} />
          <SettingsRow icon={<Download size={18} color="#555" />} label="Download my data" onPress={() => navigation.navigate('DownloadData')} />
          <SettingsRow icon={<FileText size={18} color="#555" />} label="Privacy policy" onPress={() => navigation.navigate('PrivacyPolicy')} />
          <SettingsRow icon={<Trash2 size={18} color="#EF4444" />} label="Delete account" onPress={() => Alert.alert('Delete Account', 'This action is permanent. Contact support to proceed.') } showDivider={false} destructive />
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
        <Text style={sheetStyles.desc}>Choose a strong password for your account.</Text>
        <Text style={sheetStyles.label}>New password</Text>
        <TextInput style={sheetStyles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="••••••••" placeholderTextColor="#C0C0C0" />
        <Text style={sheetStyles.label}>Confirm new password</Text>
        <TextInput style={sheetStyles.input} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder="••••••••" placeholderTextColor="#C0C0C0" />
        <SheetButton label="Update Password" onPress={handleChangePassword} disabled={!newPassword.trim() || newPassword !== confirmPassword} />
      </BottomSheet>

      {/* Emergency Contact */}
      <BottomSheet visible={emergencyVisible} onClose={() => setEmergencyVisible(false)} title="Emergency Contact">
        <Text style={sheetStyles.desc}>This person will be contacted in case of emergency.</Text>
        {emergencySet && (
          <View style={sheetStyles.existingContact}>
            <Text style={{ fontSize: 24 }}>👤</Text>
            <View style={{ flex: 1 }}>
              <Text style={sheetStyles.existingName}>{emergencyName}</Text>
              <Text style={sheetStyles.existingPhone}>{emergencyPhone}</Text>
            </View>
          </View>
        )}
        <Text style={sheetStyles.label}>Contact name</Text>
        <TextInput style={sheetStyles.input} placeholder="Full name" placeholderTextColor="#C0C0C0" value={emergencyName} onChangeText={setEmergencyName} />
        <Text style={sheetStyles.label}>Phone number</Text>
        <TextInput style={sheetStyles.input} placeholder="+40 700 000 000" placeholderTextColor="#C0C0C0" keyboardType="phone-pad" value={emergencyPhone} onChangeText={setEmergencyPhone} />
        <SheetButton label="Save Contact" onPress={handleSaveEmergency} />
      </BottomSheet>

      {/* Frequent Flyer */}
      <BottomSheet visible={flyerVisible} onClose={() => setFlyerVisible(false)} title="Frequent Flyer Programs">
        <Text style={sheetStyles.desc}>Track your airline memberships and miles.</Text>
        {flyerPrograms.map((p, i) => (
          <View key={i} style={sheetStyles.flyerRow}>
            <Text style={{ fontSize: 20 }}>✈️</Text>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={sheetStyles.flyerAirline}>{p.airline}</Text>
              <Text style={sheetStyles.flyerNumber}>{p.number}</Text>
            </View>
            <TouchableOpacity onPress={() => handleRemoveFlyer(i)}>
              <Text style={{ color: '#F44336', fontSize: 13, fontWeight: '600' }}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}
        <View style={sheetStyles.divider} />
        <Text style={sheetStyles.label}>Airline / program</Text>
        <TextInput style={sheetStyles.input} placeholder="e.g. Miles & More" placeholderTextColor="#C0C0C0" value={newFlyerAirline} onChangeText={setNewFlyerAirline} />
        <Text style={sheetStyles.label}>Membership number</Text>
        <TextInput style={sheetStyles.input} placeholder="e.g. LH-123456789" placeholderTextColor="#C0C0C0" value={newFlyerNumber} onChangeText={setNewFlyerNumber} />
        <SheetButton label="Add Program" onPress={handleAddFlyer} disabled={!newFlyerAirline.trim()} />
      </BottomSheet>

      {/* Travel Style */}
      <BottomSheet visible={travelStyleVisible} onClose={() => setTravelStyleVisible(false)} title="Travel Style">
        <Text style={sheetStyles.desc}>How do you prefer to travel?</Text>
        {TRAVEL_STYLES.map((s) => (
          <TouchableOpacity
            key={s.value}
            style={[sheetStyles.styleCard, travelStyle === s.value && sheetStyles.styleCardActive]}
            onPress={() => { setTravelStyle(s.value); savePreference('travel_style', s.value); setTravelStyleVisible(false); }}
          >
            <Text style={{ fontSize: 28 }}>{s.icon}</Text>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[sheetStyles.styleTitle, travelStyle === s.value && { color: '#4CAF50' }]}>{s.value}</Text>
              <Text style={sheetStyles.styleDesc}>{s.desc}</Text>
            </View>
            {travelStyle === s.value && <View style={sheetStyles.check}><Text style={{ color: '#fff', fontSize: 12 }}>✓</Text></View>}
          </TouchableOpacity>
        ))}
      </BottomSheet>

      {/* Flight Seat */}
      <BottomSheet visible={seatVisible} onClose={() => setSeatVisible(false)} title="Preferred Flight Seat">
        <Text style={sheetStyles.desc}>Pick your favorite seat type.</Text>
        {SEAT_OPTIONS.map((s) => (
          <TouchableOpacity
            key={s.value}
            style={[sheetStyles.styleCard, flightSeat === s.value && sheetStyles.styleCardActive]}
            onPress={() => { setFlightSeat(s.value); savePreference('flight_seat', s.value); setSeatVisible(false); }}
          >
            <Text style={{ fontSize: 26 }}>{s.icon}</Text>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[sheetStyles.styleTitle, flightSeat === s.value && { color: '#4CAF50' }]}>{s.value}</Text>
              <Text style={sheetStyles.styleDesc}>{s.desc}</Text>
            </View>
            {flightSeat === s.value && <View style={sheetStyles.check}><Text style={{ color: '#fff', fontSize: 12 }}>✓</Text></View>}
          </TouchableOpacity>
        ))}
      </BottomSheet>

      {/* Currency Selector */}
      <BottomSheet visible={currencyVisible} onClose={() => { setCurrencyVisible(false); setCurrencySearch(''); }} title="Default Currency">
        <Text style={sheetStyles.desc}>Used for new trips and budgets.</Text>
        <View style={sheetStyles.searchBar}>
          <Search size={16} color="#999" />
          <TextInput
            style={sheetStyles.searchInput}
            placeholder="Search currency..."
            placeholderTextColor="#C0C0C0"
            value={currencySearch}
            onChangeText={setCurrencySearch}
          />
          {currencySearch ? <TouchableOpacity onPress={() => setCurrencySearch('')}><X size={16} color="#999" /></TouchableOpacity> : null}
        </View>

        <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
          {!currencySearch && (
            <>
              <Text style={sheetStyles.sectionLabel}>Current</Text>
              <TouchableOpacity style={sheetStyles.currencyRow}>
                <Text style={{ fontSize: 22, width: 32 }}>{CURRENCY_FLAGS[currency] ?? '💱'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={sheetStyles.currencyCode}>{currency}</Text>
                  <Text style={sheetStyles.currencyName}>{CURRENCIES.find(c => c.code === currency)?.name ?? ''}</Text>
                </View>
                <View style={sheetStyles.check}><Text style={{ color: '#fff', fontSize: 12 }}>✓</Text></View>
              </TouchableOpacity>

              <Text style={sheetStyles.sectionLabel}>Popular</Text>
              {POPULAR_CURRENCIES.filter(c => c !== currency).map(code => {
                const cur = CURRENCIES.find(c => c.code === code);
                return (
                  <TouchableOpacity key={code} style={sheetStyles.currencyRow} onPress={() => { setCurrency(code); savePreference('default_currency', code); setCurrencyVisible(false); setCurrencySearch(''); }}>
                    <Text style={{ fontSize: 22, width: 32 }}>{CURRENCY_FLAGS[code] ?? '💱'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={sheetStyles.currencyCode}>{code}</Text>
                      <Text style={sheetStyles.currencyName}>{cur?.name ?? ''}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              <Text style={sheetStyles.sectionLabel}>All currencies</Text>
            </>
          )}

          {filteredCurrencies.map(cur => (
            <TouchableOpacity key={cur.code} style={sheetStyles.currencyRow} onPress={() => { setCurrency(cur.code); savePreference('default_currency', cur.code); setCurrencyVisible(false); setCurrencySearch(''); }}>
              <Text style={{ fontSize: 22, width: 32 }}>{CURRENCY_FLAGS[cur.code] ?? '💱'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={sheetStyles.currencyCode}>{cur.code}</Text>
                <Text style={sheetStyles.currencyName}>{cur.name}</Text>
              </View>
              {currency === cur.code && <View style={sheetStyles.check}><Text style={{ color: '#fff', fontSize: 12 }}>✓</Text></View>}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </BottomSheet>

      {/* Country Selector */}
      <BottomSheet visible={countryVisible} onClose={() => { setCountryVisible(false); setCountrySearch(''); }} title="Home Country">
        <Text style={sheetStyles.desc}>Your home country for travel context.</Text>
        <View style={sheetStyles.searchBar}>
          <Search size={16} color="#999" />
          <TextInput
            style={sheetStyles.searchInput}
            placeholder="Search country..."
            placeholderTextColor="#C0C0C0"
            value={countrySearch}
            onChangeText={setCountrySearch}
          />
          {countrySearch ? <TouchableOpacity onPress={() => setCountrySearch('')}><X size={16} color="#999" /></TouchableOpacity> : null}
        </View>
        <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
          {filteredCountries.map(country => (
            <TouchableOpacity key={country} style={sheetStyles.currencyRow} onPress={() => { setHomeCountry(country); savePreference('home_country', country); setCountryVisible(false); setCountrySearch(''); }}>
              <Text style={{ fontSize: 22, width: 32 }}>{COUNTRY_FLAGS[country] ?? '🌍'}</Text>
              <Text style={[sheetStyles.currencyCode, { flex: 1 }]}>{country}</Text>
              {homeCountry === country && <View style={sheetStyles.check}><Text style={{ color: '#fff', fontSize: 12 }}>✓</Text></View>}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </BottomSheet>

      {/* Language Selector */}
      <BottomSheet visible={languageVisible} onClose={() => { setLanguageVisible(false); setLanguageSearch(''); }} title="Language">
        <Text style={sheetStyles.desc}>Your preferred app language.</Text>
        <View style={sheetStyles.searchBar}>
          <Search size={16} color="#999" />
          <TextInput
            style={sheetStyles.searchInput}
            placeholder="Search language..."
            placeholderTextColor="#C0C0C0"
            value={languageSearch}
            onChangeText={setLanguageSearch}
          />
          {languageSearch ? <TouchableOpacity onPress={() => setLanguageSearch('')}><X size={16} color="#999" /></TouchableOpacity> : null}
        </View>
        <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
          {filteredLanguages.map(lang => (
            <TouchableOpacity key={lang} style={sheetStyles.currencyRow} onPress={() => { setLanguage(lang); savePreference('language', lang); setLanguageVisible(false); setLanguageSearch(''); }}>
              <View style={{ flex: 1 }}>
                <Text style={sheetStyles.currencyCode}>{LANGUAGE_NATIVE[lang] ?? lang}</Text>
                <Text style={sheetStyles.currencyName}>{lang}</Text>
              </View>
              {language === lang && <View style={sheetStyles.check}><Text style={{ color: '#fff', fontSize: 12 }}>✓</Text></View>}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </BottomSheet>

      {/* Privacy Visibility */}
      <BottomSheet visible={privacyVisible} onClose={() => setPrivacyVisible(false)} title="Profile Visibility">
        <Text style={sheetStyles.desc}>Who can see your travel profile.</Text>
        {[
          { value: 'everyone', label: '🌍 Everyone', desc: 'Visible to all users' },
          { value: 'partners', label: '👥 Partners only', desc: 'Only your travel partners' },
          { value: 'only_me', label: '🔒 Only me', desc: 'Completely private' },
        ].map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[sheetStyles.styleCard, profileVisibility === opt.value && sheetStyles.styleCardActive]}
            onPress={() => { setProfileVisibility(opt.value); savePreference('profile_visibility', opt.value); setPrivacyVisible(false); }}
          >
            <View style={{ flex: 1 }}>
              <Text style={[sheetStyles.styleTitle, profileVisibility === opt.value && { color: '#4CAF50' }]}>{opt.label}</Text>
              <Text style={sheetStyles.styleDesc}>{opt.desc}</Text>
            </View>
            {profileVisibility === opt.value && <View style={sheetStyles.check}><Text style={{ color: '#fff', fontSize: 12 }}>✓</Text></View>}
          </TouchableOpacity>
        ))}
      </BottomSheet>

    </SafeAreaView>
  );
}

function StatItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={statStyles.item}>
      <Text style={statStyles.icon}>{icon}</Text>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  item: { flex: 1, alignItems: 'center', gap: 4 },
  icon: { fontSize: 22 },
  value: { fontSize: 20, fontWeight: '900', color: '#1A1A1A' },
  label: { fontSize: 11, color: '#888', fontWeight: '600' },
});

const sheetStyles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 6, marginTop: 14, letterSpacing: 0.3 },
  desc: { fontSize: 13, color: '#888', marginBottom: 12, lineHeight: 18 },
  input: { backgroundColor: '#F7F7F7', borderRadius: 12, borderWidth: 1, borderColor: '#EBEBEB', paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1A1A1A' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F5F5F5', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10, borderWidth: 1, borderColor: '#EBEBEB' },
  searchInput: { flex: 1, fontSize: 14, color: '#1A1A1A' },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 0.8, marginTop: 12, marginBottom: 4 },
  currencyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  currencyCode: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  currencyName: { fontSize: 12, color: '#888', marginTop: 1 },
  check: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#4CAF50', alignItems: 'center', justifyContent: 'center' },
  styleCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#EBEBEB', backgroundColor: '#FAFAFA', marginBottom: 8 },
  styleCardActive: { borderColor: '#4CAF50', backgroundColor: '#F1F8E9' },
  styleTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  styleDesc: { fontSize: 12, color: '#888', marginTop: 2 },
  existingContact: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F1F8E9', borderRadius: 12, padding: 12, marginBottom: 14 },
  existingName: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  existingPhone: { fontSize: 13, color: '#888', marginTop: 2 },
  flyerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  flyerAirline: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  flyerNumber: { fontSize: 12, color: '#888', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 12 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F7F7' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
  editText: { fontSize: 15, fontWeight: '600', color: '#4CAF50' },
  scroll: { flex: 1 },

  profileCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, marginBottom: 8, borderRadius: 20, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#A5D6A7', marginBottom: 12 },
  avatarInitials: { fontSize: 28, fontWeight: '900', color: '#2E7D32' },
  profileName: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', marginBottom: 8 },
  profileBadgesRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  explorerBadge: { backgroundColor: '#E8F5E9', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  explorerBadgeText: { fontSize: 12, fontWeight: '700', color: '#2E7D32' },
  tripsBadge: { backgroundColor: '#E3F2FD', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  tripsBadgeText: { fontSize: 12, fontWeight: '700', color: '#1565C0' },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  profileEmail: { fontSize: 13, color: '#999' },

  statsCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  statsTitle: { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 0.8, marginBottom: 14 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around' },

  card: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 14, marginBottom: 6, paddingHorizontal: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 6 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#999', letterSpacing: 0.8 },
  sectionAction: { fontSize: 13, fontWeight: '600', color: '#4CAF50' },

  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, minHeight: 50 },
  rowIconCircle: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rowLabel: { flex: 1, fontSize: 15, color: '#1A1A1A', fontWeight: '400' },
  rowValue: { fontSize: 13, color: '#888', marginRight: 6 },
  rowDivider: { height: 1, backgroundColor: '#F5F5F5', marginLeft: 44 },
  destructiveText: { color: '#EF4444' },

  connectBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: '#4CAF50' },
  connectedBtn: { borderColor: '#E0E0E0', backgroundColor: '#F1F8E9' },
  connectBtnText: { fontSize: 13, fontWeight: '600', color: '#4CAF50' },
  connectedBtnText: { fontSize: 13, fontWeight: '600', color: '#4CAF50' },
  comingSoonBadge: { backgroundColor: '#FFF8E1', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  comingSoonText: { fontSize: 10, fontWeight: '700', color: '#F59E0B' },

  segmentControl: { flexDirection: 'row', backgroundColor: '#F0F0F0', borderRadius: 10, padding: 3 },
  segmentBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 8 },
  segmentBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 },
  segmentText: { fontSize: 13, fontWeight: '600', color: '#888' },
  segmentTextActive: { color: '#1A1A1A', fontWeight: '700' },

  logoutBtn: { alignItems: 'center', paddingVertical: 18, marginTop: 8 },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#EF4444' },
  version: { textAlign: 'center', fontSize: 12, color: '#BBBBBB', marginBottom: 8 },
});