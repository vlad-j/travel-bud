import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Linking, Dimensions, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import { Sparkle, Dot } from '../components/TravelDecorations';
import {
  SuitcaseIcon, PdfIcon, GmailIcon, EditPencilIcon, ReuseIcon,
  UploadCloudIcon, CalendarIcon, ClockIcon, MapPinIcon,
  CheckIcon, ChevronRightIcon, LockIcon, ControlIcon, LightningIcon,
  getAmenityIcon, getPlatformIcon, HouseIcon,
  ArrowLeftIcon, CloseIcon, PlusIcon, DownloadIcon,
} from '../components/TravelBuddyIcons';
import { supabase } from '../lib/supabase';
import { useCurrentTrip, currentTripIdRef } from '../context/TripContext';
import { createActivitiesFromAccommodation, deleteActivitiesBySource } from '../lib/itineraryAutoCreate';
import { parseBookingPDF, ParsedAccommodation } from '../lib/pdfParser';

const { width } = Dimensions.get('window');

const PLATFORMS = ['Airbnb', 'Booking.com', 'Agoda', 'Other'];
const PLATFORM_URLS: Record<string, string> = {
  Airbnb: 'https://www.airbnb.com',
  'Booking.com': 'https://www.booking.com',
  Agoda: 'https://www.agoda.com',
};

const ALL_AMENITIES = [
  { name: 'WiFi' }, { name: 'Breakfast' }, { name: 'Pool' },
  { name: 'AC' }, { name: 'Parking' }, { name: 'Kitchen' },
  { name: 'Workspace' }, { name: 'Gym' }, { name: 'Hot tub' },
];

function F({ label, placeholder, value, onChangeText, optional, keyboardType }: {
  label: string; placeholder: string; value: string;
  onChangeText: (t: string) => void; optional?: boolean; keyboardType?: any;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={fStyles.label}>{label}{optional ? <Text style={fStyles.optional}> (optional)</Text> : null}</Text>
      <TextInput style={fStyles.input} placeholder={placeholder} placeholderTextColor="#C0C0C0" value={value} onChangeText={onChangeText} keyboardType={keyboardType} />
    </View>
  );
}

const fStyles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 6 },
  optional: { fontWeight: '400', color: '#BBB' },
  input: { backgroundColor: '#F5F5F5', borderRadius: 12, borderWidth: 1, borderColor: '#EBEBEB', paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#1A1A1A' },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
});

function StepIndicator({ current, total }: { current: number; total: number }) {
  const labels = ['Stay Details', 'Dates', 'Amenities', 'Review'];
  return (
    <View style={stepStyles.container}>
      {Array.from({ length: total }).map((_, i) => {
        const step = i + 1;
        const isActive = step === current;
        const isDone = step < current;
        return (
          <React.Fragment key={step}>
            <View style={stepStyles.stepCol}>
              <View style={[stepStyles.dot, isActive && stepStyles.dotActive, isDone && stepStyles.dotDone]}>
                {isDone ? <CheckIcon size={14} color="#fff" /> : <Text style={[stepStyles.dotText, (isActive || isDone) && stepStyles.dotTextActive]}>{step}</Text>}
              </View>
              <Text style={[stepStyles.label, isActive && stepStyles.labelActive]}>{labels[i]}</Text>
            </View>
            {step < total && (
              <View style={stepStyles.lineWrap}>
                <View style={[stepStyles.line, isDone && stepStyles.lineDone]} />
              </View>
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const stepStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', marginBottom: 24, paddingHorizontal: 16 },
  stepCol: { alignItems: 'center', flex: 1 },
  dot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  dotActive: { backgroundColor: '#4CAF50' },
  dotDone: { backgroundColor: '#A5D6A7' },
  dotText: { fontSize: 12, fontWeight: '700', color: '#999' },
  dotTextActive: { color: '#fff' },
  label: { fontSize: 10, color: '#999', marginTop: 6, fontWeight: '600', textAlign: 'center' },
  labelActive: { color: '#4CAF50' },
  lineWrap: { position: 'absolute', top: 14, left: 0, right: 0, paddingHorizontal: 50, flexDirection: 'row' },
  line: { flex: 1, height: 2, backgroundColor: '#E0E0E0', marginHorizontal: 8 },
  lineDone: { backgroundColor: '#A5D6A7' },
});

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function AccommodationScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { currentTripId } = useCurrentTrip();

  const [trip, setTrip] = useState<any>(null);
  const [accommodations, setAccommodations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);

  const [screen, setScreen] = useState<'overview' | 'hub' | 'pdfUpload' | 'pdfReview' | 'gmailIntro' | 'manual1' | 'manual2' | 'manual3' | 'manual4' | 'success' | 'reuse'>('overview');

  const [name, setName] = useState('');
  const [platform, setPlatform] = useState('Airbnb');
  const [address, setAddress] = useState('');
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<Date | null>(null);
  const [bookingRef, setBookingRef] = useState('');
  const [priceForStay, setPriceForStay] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; uri: string } | null>(null);

  const [showCheckInDatePicker, setShowCheckInDatePicker] = useState(false);
  const [showCheckInTimePicker, setShowCheckInTimePicker] = useState(false);
  const [showCheckOutDatePicker, setShowCheckOutDatePicker] = useState(false);
  const [showCheckOutTimePicker, setShowCheckOutTimePicker] = useState(false);

  const loadData = React.useCallback(async (tripId?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: memberships } = await supabase.from('trip_members').select('trip_id').eq('user_id', user.id);
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

    const { data: accData } = await supabase.from('accommodations').select('*').eq('trip_id', tripData.id).order('check_in', { ascending: true });
    setAccommodations(accData ?? []);
    setLoading(false);
  }, []);

useFocusEffect(
  React.useCallback(() => {
    console.log('Accommodation focused, ref:', currentTripIdRef.current, 'params:', route.params?.tripId);
    loadData(currentTripIdRef.current ?? route.params?.tripId);
  }, [])
);

async function handlePickFile() {
  try {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true });
    if (!result.canceled && result.assets?.[0]) {
      const file = result.assets[0];
      setUploadedFile({ name: file.name, uri: file.uri });
      setScreen('pdfReview');
      setParsing(true);
      const parsed = await parseBookingPDF(file.uri);
      if (parsed.name) setName(parsed.name);
      if (parsed.platform && PLATFORMS.includes(parsed.platform)) setPlatform(parsed.platform);
      if (parsed.address) setAddress(parsed.address);
      if (parsed.bookingReference) setBookingRef(parsed.bookingReference);
      if (parsed.price) setPriceForStay(parsed.price);
      setParsing(false);
    }
  } catch (e: any) { Alert.alert('Error', e?.message ?? 'Could not pick file'); }
}

  async function handleSave() {
    if (!name.trim() || !trip) return;
    setSaving(true);

    const { data, error } = await supabase.from('accommodations').insert({
      trip_id: trip.id,
      name: name.trim(),
      address: address.trim(),
      check_in: checkInDate ? checkInDate.toISOString() : null,
      check_out: checkOutDate ? checkOutDate.toISOString() : null,
      booking_reference: bookingRef || null,
      platform: platform,
      price: priceForStay ? parseFloat(priceForStay.replace(/[^0-9.]/g, '')) : null,
    }).select().single();

    if (error) { Alert.alert('Error', error.message); setSaving(false); return; }
    setAccommodations((prev) => [...prev, data]);

    // Auto-create check-in / check-out itinerary activities
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && data) {
        await createActivitiesFromAccommodation(data.id, trip.id, {
          name: name.trim(),
          check_in: checkInDate ? checkInDate.toISOString() : null,
          check_out: checkOutDate ? checkOutDate.toISOString() : null,
          address: address.trim() || null,
        }, user.id);
      }
    } catch (e) {
      console.warn('Could not auto-create itinerary activities:', e);
    }

    setSaving(false);
    setScreen('success');
  }

  const toggleAmenity = (a: string) => {
    setSelectedAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  };

  const resetForm = useCallback(() => {
    setName(''); setPlatform('Airbnb'); setAddress('');
    setCheckInDate(null); setCheckInTime(null);
    setCheckOutDate(null); setCheckOutTime(null);
    setBookingRef(''); setPriceForStay('');
    setSelectedAmenities([]); setUploadedFile(null);
  }, []);

  const goToOverview = () => { setScreen('overview'); resetForm(); };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      </SafeAreaView>
    );
  }

  // ── OVERVIEW ──
  if (screen === 'overview') {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeftIcon size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Accommodation</Text>
          <TouchableOpacity onPress={() => setScreen('hub')}>
            <PlusIcon size={24} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {accommodations.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 60 }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🏡</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1A1A' }}>No accommodations yet</Text>
              <Text style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Tap + to add your first stay</Text>
            </View>
          ) : (
            accommodations.map((acc) => <AccommodationCard key={acc.id} acc={acc} />)
          )}
          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── HUB ──
  if (screen === 'hub') {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={goToOverview}>
            <ArrowLeftIcon size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Accommodation</Text>
          <View style={{ width: 32 }} />
        </View>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={hubStyles.illustration}>
            <View style={hubStyles.illBg}>
              <View style={[hubStyles.illHill, { left: -10, backgroundColor: '#C8E6C9' }]} />
              <View style={[hubStyles.illHill, { right: -10, backgroundColor: '#A5D6A7', width: 100 }]} />
            </View>
            <SuitcaseIcon size={72} color="#4CAF50" />
            <Sparkle color="#FFD700" size={14} style={{ position: 'absolute', left: 30, top: 20 }} />
            <Sparkle color="#4CAF50" size={10} style={{ position: 'absolute', right: 40, top: 16 }} />
          </View>
          <Text style={hubStyles.heading}>Add Accommodation</Text>
          <Text style={hubStyles.sub}>Choose how you want to add your stay</Text>
          <View style={hubStyles.optionsCard}>
            <HubOption icon={<PdfIcon size={22} />} title="Import booking confirmation" subtitle="Upload PDF from Airbnb, Booking, Agoda and more" onPress={() => setScreen('pdfUpload')} />
            <HubOption icon={<GmailIcon size={22} />} title="Import from Gmail" subtitle="Coming soon" onPress={() => setScreen('gmailIntro')} />
            <HubOption icon={<EditPencilIcon size={22} />} title="Add manually" subtitle="Enter accommodation details yourself" onPress={() => setScreen('manual1')} />
            <HubOption icon={<ReuseIcon size={22} />} title="Reuse from previous trips" subtitle="Add a place you've stayed before" onPress={() => setScreen('reuse')} last />
          </View>
          <View style={styles.footerDecor}>
            <Dot color="#DDD" size={5} style={{ position: 'relative' }} />
            <Dot color="#DDD" size={4} style={{ position: 'relative', marginLeft: 8 }} />
            <Sparkle color="#FF9800" size={10} style={{ position: 'relative', marginLeft: 6 }} />
          </View>
          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── PDF UPLOAD ──
  if (screen === 'pdfUpload') {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setScreen('hub')}>
            <ArrowLeftIcon size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Import from PDF</Text>
          <View style={{ width: 32 }} />
        </View>
        <ScrollView contentContainerStyle={pdfStyles.content} showsVerticalScrollIndicator={false}>
          <View style={pdfStyles.illustration}>
            <View style={pdfStyles.illBg}>
              <View style={[pdfStyles.illHill, { left: -10, backgroundColor: '#C8E6C9' }]} />
              <View style={[pdfStyles.illHill, { right: -10, backgroundColor: '#A5D6A7', width: 100 }]} />
            </View>
            <PdfIcon size={72} color="#F44336" />
            <Sparkle color="#FFD700" size={14} style={{ position: 'absolute', left: 30, top: 20 }} />
          </View>
          <Text style={pdfStyles.heading}>Upload booking confirmation</Text>
          <Text style={pdfStyles.sub}>We'll extract the details for you</Text>
          <TouchableOpacity style={pdfStyles.uploadBox} onPress={handlePickFile} activeOpacity={0.8}>
            <UploadCloudIcon size={48} color="#4CAF50" />
            <Text style={pdfStyles.uploadText}>Tap to upload your PDF</Text>
            <Text style={pdfStyles.uploadSub}>Browse files from your device</Text>
            <View style={pdfStyles.chooseBtn}><Text style={pdfStyles.chooseBtnText}>Choose file</Text></View>
          </TouchableOpacity>
          <Text style={pdfStyles.hint}>Works with Airbnb, Booking.com, Agoda and more</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── PDF REVIEW ──
  if (screen === 'pdfReview') {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setScreen('pdfUpload')}>
            <ArrowLeftIcon size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Review & Confirm</Text>
          <View style={{ width: 32 }} />
        </View>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={reviewStyles.hero}>
            <View style={reviewStyles.heroBg}>
              <View style={[reviewStyles.heroHill, { left: -10, backgroundColor: '#C8E6C9' }]} />
              <View style={[reviewStyles.heroHill, { right: -10, backgroundColor: '#A5D6A7', width: 100 }]} />
            </View>
            <HouseIcon size={72} color="#4CAF50" />
          </View>
          <Text style={reviewStyles.foundText}>We found these details in your PDF</Text>
          <View style={reviewStyles.detailsCard}>
            <ReviewRow label="Property name" value={name || 'Villa Padi Ubud'} />
            <ReviewRow label="Platform" value={platform} icon={getPlatformIcon(platform, 16)} />
            <ReviewRow label="Address" value={address || 'Jl. Monkey Forest, Ubud'} />
            <ReviewRow label="Check-in" value={checkInDate ? formatDate(checkInDate) : '—'} />
            <ReviewRow label="Check-out" value={checkOutDate ? formatDate(checkOutDate) : '—'} />
            <ReviewRow label="Price (for stay)" value={priceForStay || '—'} />
            <ReviewRow label="Booking reference" value={bookingRef || '—'} last />
          </View>
<TouchableOpacity style={reviewStyles.confirmBtn} onPress={handleSave} disabled={saving}>
  {saving ? <ActivityIndicator color="#fff" /> : <Text style={reviewStyles.confirmBtnText}>Confirm Import</Text>}
</TouchableOpacity>
<TouchableOpacity style={reviewStyles.editBtn} onPress={() => setScreen('manual1')}>
  <Text style={reviewStyles.editBtnText}>Looks wrong? Edit details</Text>
</TouchableOpacity>
          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── GMAIL INTRO ──
  if (screen === 'gmailIntro') {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setScreen('hub')}>
            <ArrowLeftIcon size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Import from Gmail</Text>
          <View style={{ width: 32 }} />
        </View>
        <ScrollView contentContainerStyle={gmailIntroStyles.content}>
          <View style={gmailIntroStyles.illustration}>
            <View style={gmailIntroStyles.illBg}>
              <View style={[gmailIntroStyles.illHill, { left: -10, backgroundColor: '#C8E6C9' }]} />
              <View style={[gmailIntroStyles.illHill, { right: -10, backgroundColor: '#A5D6A7', width: 100 }]} />
            </View>
            <GmailIcon size={72} color="#EA4335" />
            <Sparkle color="#FFD700" size={14} style={{ position: 'absolute', left: 30, top: 20 }} />
          </View>
          <Text style={gmailIntroStyles.heading}>Find accommodations{'\n'}in your inbox</Text>
          <Text style={gmailIntroStyles.sub}>We'll look for booking confirmations and add them to your trip</Text>
          <View style={gmailIntroStyles.benefitsCard}>
            <BenefitItem icon={<LockIcon size={22} color="#4CAF50" />} title="Secure & private" desc="We only read booking emails" />
            <BenefitItem icon={<ControlIcon size={22} color="#FF9800" />} title="You're in control" desc="Choose what to import" />
            <BenefitItem icon={<LightningIcon size={22} color="#FFEB3B" />} title="Fast & easy" desc="Save time and stay organized" last />
          </View>
          <View style={{ backgroundColor: '#FFF8E1', borderRadius: 12, padding: 14, width: '100%', marginBottom: 16 }}>
            <Text style={{ fontSize: 14, color: '#E65100', fontWeight: '600', textAlign: 'center' }}>Coming Soon</Text>
            <Text style={{ fontSize: 13, color: '#888', textAlign: 'center', marginTop: 4 }}>Gmail integration is coming in a future update.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── REUSE ──
  if (screen === 'reuse') {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setScreen('hub')}>
            <ArrowLeftIcon size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Reuse Previous Stays</Text>
          <View style={{ width: 32 }} />
        </View>
        <ScrollView style={styles.scroll}>
          {accommodations.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ fontSize: 14, color: '#888' }}>No previous stays found.</Text>
            </View>
          ) : (
            <View style={reuseStyles.card}>
              {accommodations.map((acc, index) => (
                <View key={acc.id}>
                  <TouchableOpacity style={reuseStyles.row} onPress={() => { setName(acc.name); setAddress(acc.address ?? ''); setPlatform(acc.platform ?? 'Airbnb'); setBookingRef(acc.booking_reference ?? ''); setScreen('manual1'); }} activeOpacity={0.7}>
                    <View style={reuseStyles.iconBg}>{getPlatformIcon(acc.platform ?? 'Other', 28)}</View>
                    <View style={reuseStyles.info}>
                      <Text style={reuseStyles.name}>{acc.name}</Text>
                      <Text style={reuseStyles.location}>{acc.address}</Text>
                    </View>
                    <ChevronRightIcon size={20} />
                  </TouchableOpacity>
                  {index < accommodations.length - 1 && <View style={reuseStyles.divider} />}
                </View>
              ))}
            </View>
          )}
          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── MANUAL STEP 1 ──
  if (screen === 'manual1') {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setScreen('hub')}><CloseIcon size={22} /></TouchableOpacity>
          <Text style={styles.title}>Add Manually</Text>
          <View style={{ width: 32 }} />
        </View>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <StepIndicator current={1} total={4} />
          <Text style={manualStyles.sectionTitle}>Stay Details</Text>
          <F label="Property name" placeholder="e.g. Villa Padi Ubud" value={name} onChangeText={setName} />
          <Text style={fStyles.label}>Platform</Text>
          <View style={manualStyles.platformRow}>
            {PLATFORMS.map((p) => (
              <TouchableOpacity key={p} style={[manualStyles.platformChip, platform === p && manualStyles.platformChipActive]} onPress={() => setPlatform(p)}>
                {getPlatformIcon(p, 18)}
                <Text style={[manualStyles.platformText, platform === p && manualStyles.platformTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <F label="Address" placeholder="Enter full address" value={address} onChangeText={setAddress} />
          <TouchableOpacity style={[manualStyles.continueBtn, !name.trim() && manualStyles.continueBtnDisabled]} onPress={() => setScreen('manual2')} disabled={!name.trim()}>
            <Text style={manualStyles.continueBtnText}>Continue</Text>
          </TouchableOpacity>
          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── MANUAL STEP 2 ──
  if (screen === 'manual2') {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setScreen('manual1')}><ArrowLeftIcon size={24} /></TouchableOpacity>
          <Text style={styles.title}>Add Manually</Text>
          <View style={{ width: 32 }} />
        </View>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <StepIndicator current={2} total={4} />
          <Text style={manualStyles.sectionTitle}>Dates</Text>

          {/* Check-in */}
          <View style={fStyles.row}>
            <View style={fStyles.half}>
              <Text style={fStyles.label}>Check-in date</Text>
              <TouchableOpacity style={dtStyles.inputWrap} onPress={() => setShowCheckInDatePicker(true)}>
                <CalendarIcon size={18} color="#666" />
                <Text style={[{ flex: 1, fontSize: 15, paddingVertical: 3 }, !checkInDate && { color: '#C0C0C0' }]}>
                  {checkInDate ? formatDate(checkInDate) : 'Pick date'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={fStyles.half}>
              <Text style={fStyles.label}>Check-in time</Text>
              <TouchableOpacity style={dtStyles.inputWrap} onPress={() => setShowCheckInTimePicker(true)}>
                <ClockIcon size={18} color="#666" />
                <Text style={[{ flex: 1, fontSize: 15, paddingVertical: 3 }, !checkInTime && { color: '#C0C0C0' }]}>
                  {checkInTime ? formatTime(checkInTime) : '00:00'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Check-out */}
          <View style={fStyles.row}>
            <View style={fStyles.half}>
              <Text style={fStyles.label}>Check-out date</Text>
              <TouchableOpacity style={dtStyles.inputWrap} onPress={() => setShowCheckOutDatePicker(true)}>
                <CalendarIcon size={18} color="#666" />
                <Text style={[{ flex: 1, fontSize: 15, paddingVertical: 3 }, !checkOutDate && { color: '#C0C0C0' }]}>
                  {checkOutDate ? formatDate(checkOutDate) : 'Pick date'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={fStyles.half}>
              <Text style={fStyles.label}>Check-out time</Text>
              <TouchableOpacity style={dtStyles.inputWrap} onPress={() => setShowCheckOutTimePicker(true)}>
                <ClockIcon size={18} color="#666" />
                <Text style={[{ flex: 1, fontSize: 15, paddingVertical: 3 }, !checkOutTime && { color: '#C0C0C0' }]}>
                  {checkOutTime ? formatTime(checkOutTime) : '00:00'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {showCheckInDatePicker && <DateTimePicker value={checkInDate ?? new Date()} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(_, d) => { setShowCheckInDatePicker(Platform.OS === 'ios'); if (d) setCheckInDate(d); }} />}
          {showCheckInTimePicker && <DateTimePicker value={checkInTime ?? new Date()} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'} is24Hour onChange={(_, d) => { setShowCheckInTimePicker(Platform.OS === 'ios'); if (d) setCheckInTime(d); }} />}
          {showCheckOutDatePicker && <DateTimePicker value={checkOutDate ?? new Date()} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(_, d) => { setShowCheckOutDatePicker(Platform.OS === 'ios'); if (d) setCheckOutDate(d); }} />}
          {showCheckOutTimePicker && <DateTimePicker value={checkOutTime ?? new Date()} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'} is24Hour onChange={(_, d) => { setShowCheckOutTimePicker(Platform.OS === 'ios'); if (d) setCheckOutTime(d); }} />}

          <View style={manualStyles.btnRow}>
            <TouchableOpacity style={manualStyles.backBtn2} onPress={() => setScreen('manual1')}><Text style={manualStyles.backBtn2Text}>Back</Text></TouchableOpacity>
            <TouchableOpacity style={manualStyles.continueBtn2} onPress={() => setScreen('manual3')}><Text style={manualStyles.continueBtn2Text}>Continue</Text></TouchableOpacity>
          </View>
          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── MANUAL STEP 3 ──
  if (screen === 'manual3') {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setScreen('manual2')}><ArrowLeftIcon size={24} /></TouchableOpacity>
          <Text style={styles.title}>Add Manually</Text>
          <View style={{ width: 32 }} />
        </View>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <StepIndicator current={3} total={4} />
          <Text style={manualStyles.sectionTitle}>Extras & Amenities</Text>
          <Text style={manualStyles.sectionSub}>Select what's included</Text>
          <View style={manualStyles.amenitiesGrid}>
            {ALL_AMENITIES.map((a) => (
              <TouchableOpacity key={a.name} style={[manualStyles.amenityChip, selectedAmenities.includes(a.name) && manualStyles.amenityChipActive]} onPress={() => toggleAmenity(a.name)}>
                {getAmenityIcon(a.name, 22)}
                <Text style={[manualStyles.amenityText, selectedAmenities.includes(a.name) && manualStyles.amenityTextActive]}>{a.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <F label="Booking reference" placeholder="e.g. #VPU123456" value={bookingRef} onChangeText={setBookingRef} optional />
          <F label="Price (for stay)" placeholder="e.g. €480" value={priceForStay} onChangeText={setPriceForStay} optional />
          <View style={manualStyles.btnRow}>
            <TouchableOpacity style={manualStyles.backBtn2} onPress={() => setScreen('manual2')}><Text style={manualStyles.backBtn2Text}>Back</Text></TouchableOpacity>
            <TouchableOpacity style={manualStyles.continueBtn2} onPress={() => setScreen('manual4')}><Text style={manualStyles.continueBtn2Text}>Continue</Text></TouchableOpacity>
          </View>
          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── MANUAL STEP 4 ──
  if (screen === 'manual4') {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setScreen('manual3')}><ArrowLeftIcon size={24} /></TouchableOpacity>
          <Text style={styles.title}>Add Manually</Text>
          <View style={{ width: 32 }} />
        </View>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <StepIndicator current={4} total={4} />
          <Text style={manualStyles.sectionTitle}>Review</Text>
          <View style={reviewStyles.detailsCard}>
            <ReviewRow label="Property name" value={name} />
            <ReviewRow label="Platform" value={platform} icon={getPlatformIcon(platform, 16)} />
            <ReviewRow label="Address" value={address || '—'} />
            <ReviewRow label="Check-in" value={checkInDate ? `${formatDate(checkInDate)} ${checkInTime ? '· ' + formatTime(checkInTime) : ''}` : '—'} />
            <ReviewRow label="Check-out" value={checkOutDate ? `${formatDate(checkOutDate)} ${checkOutTime ? '· ' + formatTime(checkOutTime) : ''}` : '—'} />
            {selectedAmenities.length > 0 && <ReviewRow label="Amenities" value={selectedAmenities.join(', ')} />}
            {bookingRef ? <ReviewRow label="Booking reference" value={bookingRef} /> : null}
            <ReviewRow label="Price" value={priceForStay || '—'} last />
          </View>
          <TouchableOpacity style={[reviewStyles.confirmBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={reviewStyles.confirmBtnText}>Save Accommodation</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={reviewStyles.editBtn} onPress={() => setScreen('manual1')}>
            <Text style={reviewStyles.editBtnText}>Edit details</Text>
          </TouchableOpacity>
          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── SUCCESS ──
  if (screen === 'success') {
    const lastAdded = accommodations[accommodations.length - 1];
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <ScrollView contentContainerStyle={successStyles.content} showsVerticalScrollIndicator={false}>
          <View style={successStyles.illustration}>
            <View style={successStyles.illBg}>
              <View style={[successStyles.illHill, { left: -10, backgroundColor: '#C8E6C9' }]} />
              <View style={[successStyles.illHill, { right: -10, backgroundColor: '#A5D6A7', width: 100 }]} />
            </View>
            <HouseIcon size={80} color="#4CAF50" />
            <View style={successStyles.checkCircle}><CheckIcon size={20} color="#fff" /></View>
            <Sparkle color="#FFD700" size={14} style={{ position: 'absolute', left: 30, top: 20 }} />
          </View>
          <Text style={successStyles.heading}>All set!</Text>
          <Text style={successStyles.sub}>Your accommodation has been added{'\n'}to your trip.</Text>
          {lastAdded && (
            <View style={successStyles.previewCard}>
              <View style={successStyles.previewHeader}>
                <Text style={successStyles.previewName}>{lastAdded.name}</Text>
                <View style={successStyles.previewBadge}><Text style={successStyles.previewBadgeText}>UPCOMING</Text></View>
              </View>
              {lastAdded.address && (
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 8 }}>
                  <MapPinIcon size={16} color="#F44336" />
                  <Text style={{ flex: 1, fontSize: 13, color: '#555' }} numberOfLines={2}>{lastAdded.address}</Text>
                </View>
              )}
            </View>
          )}
          <TouchableOpacity style={successStyles.viewBtn} onPress={goToOverview}>
            <Text style={successStyles.viewBtnText}>View in Accommodation</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

function AccommodationCard({ acc }: { acc: any }) {
  const openMaps = () => {
    if (acc.address) Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(acc.address)}`);
  };

  const checkIn = acc.check_in ? new Date(acc.check_in) : null;
  const checkOut = acc.check_out ? new Date(acc.check_out) : null;

  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.heroScene}>
        <View style={cardStyles.sky} />
        <View style={cardStyles.ground} />
        <View style={[cardStyles.hill, { left: -10, backgroundColor: '#81C784' }]} />
        <View style={[cardStyles.hill, { right: -10, backgroundColor: '#66BB6A', width: 120 }]} />
        <HouseIcon size={64} color="#fff" />
        <Sparkle color="#FFD700" size={12} style={{ position: 'absolute', right: 30, top: 18 }} />
      </View>
      <View style={cardStyles.nameRow}>
        <Text style={cardStyles.propertyName}>{acc.name}</Text>
        <View style={cardStyles.statusBadge}><Text style={cardStyles.statusText}>UPCOMING</Text></View>
      </View>
      {(checkIn || checkOut) && (
        <View style={cardStyles.checkCard}>
          <View style={cardStyles.checkRow}>
            <View style={cardStyles.checkItem}>
              <Text style={cardStyles.checkLabel}>Check-in</Text>
              <Text style={cardStyles.checkTime}>{checkIn ? checkIn.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'}</Text>
              <Text style={cardStyles.checkDay}>{checkIn ? checkIn.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}</Text>
            </View>
            <View style={cardStyles.checkDivider} />
            <View style={cardStyles.checkItem}>
              <Text style={cardStyles.checkLabel}>Check-out</Text>
              <Text style={cardStyles.checkTime}>{checkOut ? checkOut.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'}</Text>
              <Text style={cardStyles.checkDay}>{checkOut ? checkOut.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}</Text>
            </View>
          </View>
        </View>
      )}
      {acc.address && (
        <View style={cardStyles.addressRow}>
          <View style={cardStyles.addressIconBg}><MapPinIcon size={20} color="#F44336" /></View>
          <Text style={cardStyles.addressText} numberOfLines={2}>{acc.address}</Text>
        </View>
      )}
      <TouchableOpacity style={cardStyles.mapsButton} onPress={openMaps}>
        <Text style={cardStyles.mapsButtonText}>Open in Maps</Text>
      </TouchableOpacity>
      {acc.booking_reference && (
        <View style={cardStyles.bookingRow}>
          <View>
            <Text style={cardStyles.bookingLabel}>Booking confirmation</Text>
            <Text style={cardStyles.bookingRef}>{acc.booking_reference}</Text>
          </View>
          <TouchableOpacity style={cardStyles.downloadBtn}><DownloadIcon size={20} color="#666" /></TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function HubOption({ icon, title, subtitle, onPress, last }: { icon: React.ReactNode; title: string; subtitle: string; onPress: () => void; last?: boolean }) {
  return (
    <TouchableOpacity style={[hubStyles.option, !last && hubStyles.optionBorder]} onPress={onPress} activeOpacity={0.7}>
      <View style={hubStyles.optionIconBg}>{icon}</View>
      <View style={hubStyles.optionTextWrap}>
        <Text style={hubStyles.optionTitle}>{title}</Text>
        <Text style={hubStyles.optionSubtitle}>{subtitle}</Text>
      </View>
      <ChevronRightIcon size={20} />
    </TouchableOpacity>
  );
}

function ReviewRow({ label, value, icon, last }: { label: string; value: string; icon?: React.ReactNode; last?: boolean }) {
  return (
    <View style={[reviewStyles.row, !last && reviewStyles.rowBorder]}>
      <Text style={reviewStyles.rowLabel}>{label}</Text>
      <View style={reviewStyles.rowValueWrap}>
        {icon}
        <Text style={reviewStyles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

function BenefitItem({ icon, title, desc, last }: { icon: React.ReactNode; title: string; desc: string; last?: boolean }) {
  return (
    <View style={[gmailIntroStyles.benefitRow, !last && gmailIntroStyles.benefitBorder]}>
      {icon}
      <View style={{ marginLeft: 12 }}>
        <Text style={gmailIntroStyles.benefitTitle}>{title}</Text>
        <Text style={gmailIntroStyles.benefitDesc}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  footerDecor: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
});

const dtStyles = StyleSheet.create({
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, borderWidth: 1, borderColor: '#EBEBEB', paddingHorizontal: 12, paddingVertical: 10, gap: 8, marginBottom: 14 },
  input: { flex: 1, fontSize: 15, color: '#1A1A1A', paddingVertical: 3 },
});

const cardStyles = StyleSheet.create({
  card: { backgroundColor: '#fff', marginTop: 16, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#F0F0F0', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, marginBottom: 8 },
  heroScene: { height: 180, position: 'relative', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  sky: { ...StyleSheet.absoluteFillObject, backgroundColor: '#81D4FA' },
  ground: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, backgroundColor: '#A5D6A7' },
  hill: { position: 'absolute', bottom: 0, width: 140, height: 70, borderRadius: 50 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  propertyName: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', flex: 1, marginRight: 10 },
  statusBadge: { backgroundColor: '#F3E5F5', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 10, fontWeight: '800', color: '#9C27B0', letterSpacing: 0.3 },
  checkCard: { marginHorizontal: 16, marginBottom: 12 },
  checkRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 14, padding: 14 },
  checkItem: { flex: 1, alignItems: 'center' },
  checkLabel: { fontSize: 11, color: '#888', marginBottom: 4 },
  checkTime: { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
  checkDay: { fontSize: 12, color: '#666', marginTop: 2 },
  checkDivider: { width: 1, height: 50, backgroundColor: '#E0E0E0', marginHorizontal: 16 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginBottom: 10 },
  addressIconBg: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#E3F2FD', alignItems: 'center', justifyContent: 'center' },
  addressText: { flex: 1, fontSize: 13, color: '#333', lineHeight: 19 },
  mapsButton: { backgroundColor: '#4CAF50', borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginHorizontal: 16, marginBottom: 12 },
  mapsButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  bookingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginBottom: 16 },
  bookingLabel: { fontSize: 11, color: '#888', marginBottom: 4 },
  bookingRef: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  downloadBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
});

const hubStyles = StyleSheet.create({
  illustration: { height: 160, alignItems: 'center', justifyContent: 'center', position: 'relative', marginTop: 8 },
  illBg: { position: 'absolute', bottom: 0, left: 16, right: 16, height: 80, backgroundColor: '#E8F5E9', borderRadius: 16, overflow: 'hidden' },
  illHill: { position: 'absolute', bottom: 0, width: 140, height: 50, borderRadius: 60 },
  heading: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', textAlign: 'center', marginTop: 8 },
  sub: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 4, marginBottom: 16 },
  optionsCard: { backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 16, borderWidth: 1, borderColor: '#F0F0F0', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 14 },
  optionBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  optionIconBg: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  optionTextWrap: { flex: 1 },
  optionTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  optionSubtitle: { fontSize: 12, color: '#888', marginTop: 2 },
});

const pdfStyles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 8, alignItems: 'center' },
  illustration: { height: 160, alignItems: 'center', justifyContent: 'center', position: 'relative', marginTop: 8, width: '100%' },
  illBg: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: '#E8F5E9', borderRadius: 16, overflow: 'hidden' },
  illHill: { position: 'absolute', bottom: 0, width: 140, height: 50, borderRadius: 60 },
  heading: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', textAlign: 'center', marginTop: 8 },
  sub: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 4, marginBottom: 20 },
  uploadBox: { width: '100%', borderWidth: 2, borderColor: '#A5D6A7', borderStyle: 'dashed', borderRadius: 16, paddingVertical: 32, alignItems: 'center', backgroundColor: '#FAFFF8' },
  uploadText: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginTop: 12 },
  uploadSub: { fontSize: 13, color: '#888', marginTop: 4, marginBottom: 16 },
  chooseBtn: { backgroundColor: '#4CAF50', borderRadius: 12, paddingHorizontal: 28, paddingVertical: 12 },
  chooseBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  hint: { fontSize: 12, color: '#888', marginTop: 16, textAlign: 'center' },
});

const reviewStyles = StyleSheet.create({
  hero: { height: 160, alignItems: 'center', justifyContent: 'center', position: 'relative', marginTop: 8, marginHorizontal: 16 },
  heroBg: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: '#E8F5E9', borderRadius: 16, overflow: 'hidden' },
  heroHill: { position: 'absolute', bottom: 0, width: 140, height: 50, borderRadius: 60 },
  foundText: { fontSize: 14, color: '#4CAF50', fontWeight: '600', textAlign: 'center', marginBottom: 16 },
  detailsCard: { backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 16, borderWidth: 1, borderColor: '#F0F0F0', paddingHorizontal: 16, paddingVertical: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  rowLabel: { fontSize: 13, color: '#888', flex: 1 },
  rowValueWrap: { flexDirection: 'row', alignItems: 'center', maxWidth: '55%', gap: 6 },
  rowValue: { fontSize: 13, fontWeight: '600', color: '#1A1A1A', textAlign: 'right' },
  confirmBtn: { backgroundColor: '#4CAF50', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginHorizontal: 16, marginTop: 20, shadowColor: '#4CAF50', shadowOpacity: 0.25, shadowRadius: 8, elevation: 3 },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  editBtn: { alignItems: 'center', marginTop: 12, paddingVertical: 8 },
  editBtnText: { fontSize: 14, fontWeight: '600', color: '#4CAF50' },
});

const gmailIntroStyles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 8, alignItems: 'center' },
  illustration: { height: 160, alignItems: 'center', justifyContent: 'center', position: 'relative', marginTop: 8, width: '100%' },
  illBg: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: '#E8F5E9', borderRadius: 16, overflow: 'hidden' },
  illHill: { position: 'absolute', bottom: 0, width: 140, height: 50, borderRadius: 60 },
  heading: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', textAlign: 'center', marginTop: 8 },
  sub: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 4, marginBottom: 20, lineHeight: 20 },
  benefitsCard: { backgroundColor: '#fff', borderRadius: 16, width: '100%', borderWidth: 1, borderColor: '#F0F0F0', paddingHorizontal: 16, paddingVertical: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1, marginBottom: 20 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  benefitBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  benefitTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  benefitDesc: { fontSize: 13, color: '#888', marginTop: 2 },
});

const reuseStyles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 16, borderWidth: 1, borderColor: '#F0F0F0', paddingHorizontal: 14, paddingVertical: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  iconBg: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  location: { fontSize: 13, color: '#666', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F5F5F5' },
});

const manualStyles = StyleSheet.create({
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 4, textAlign: 'center' },
  sectionSub: { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 16 },
  platformRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  platformChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#EBEBEB', backgroundColor: '#F5F5F5' },
  platformChipActive: { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' },
  platformText: { fontSize: 13, fontWeight: '600', color: '#666' },
  platformTextActive: { color: '#4CAF50' },
  continueBtn: { backgroundColor: '#4CAF50', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8, shadowColor: '#4CAF50', shadowOpacity: 0.25, shadowRadius: 8, elevation: 3 },
  continueBtnDisabled: { backgroundColor: '#C8E6C9', shadowOpacity: 0, elevation: 0 },
  continueBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  backBtn2: { flex: 1, borderRadius: 14, paddingVertical: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#E0E0E0', backgroundColor: '#fff' },
  backBtn2Text: { fontSize: 16, fontWeight: '600', color: '#666' },
  continueBtn2: { flex: 1, backgroundColor: '#4CAF50', borderRadius: 14, paddingVertical: 16, alignItems: 'center', shadowColor: '#4CAF50', shadowOpacity: 0.25, shadowRadius: 8, elevation: 3 },
  continueBtn2Text: { color: '#fff', fontSize: 16, fontWeight: '700' },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16, justifyContent: 'space-between' },
  amenityChip: { width: (width - 32 - 20) / 3, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5', borderRadius: 14, borderWidth: 1.5, borderColor: 'transparent', gap: 4 },
  amenityChipActive: { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' },
  amenityText: { fontSize: 11, fontWeight: '600', color: '#666', marginTop: 2 },
  amenityTextActive: { color: '#4CAF50' },
});

const successStyles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 24, alignItems: 'center' },
  illustration: { height: 180, alignItems: 'center', justifyContent: 'center', position: 'relative', width: '100%', marginBottom: 8 },
  illBg: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: '#E8F5E9', borderRadius: 16, overflow: 'hidden' },
  illHill: { position: 'absolute', bottom: 0, width: 140, height: 50, borderRadius: 60 },
  checkCircle: { position: 'absolute', bottom: 20, right: '30%', width: 36, height: 36, borderRadius: 18, backgroundColor: '#4CAF50', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
  heading: { fontSize: 26, fontWeight: '900', color: '#1A1A1A', marginTop: 12, textAlign: 'center' },
  sub: { fontSize: 15, color: '#888', textAlign: 'center', marginTop: 6, marginBottom: 24, lineHeight: 22 },
  previewCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, width: '100%', borderWidth: 1, borderColor: '#F0F0F0', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1, marginBottom: 20 },
  previewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  previewName: { fontSize: 17, fontWeight: '800', color: '#1A1A1A', flex: 1 },
  previewBadge: { backgroundColor: '#F3E5F5', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  previewBadgeText: { fontSize: 10, fontWeight: '800', color: '#9C27B0', letterSpacing: 0.3 },
  viewBtn: { backgroundColor: '#4CAF50', borderRadius: 14, paddingVertical: 16, alignItems: 'center', width: '100%', shadowColor: '#4CAF50', shadowOpacity: 0.25, shadowRadius: 8, elevation: 3 },
  viewBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
