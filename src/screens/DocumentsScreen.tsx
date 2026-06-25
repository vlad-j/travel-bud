import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import { Sparkle, Dot } from '../components/TravelDecorations';
import {
  ArrowLeftIcon, CloseIcon, PlusIcon, CheckIcon,
  PdfIcon, ImportEmailIcon, AddManualIcon,
  WarningIcon, ExpiredIcon, DocumentIcon,
  getDocumentTypeIcon, LockIcon,
} from '../components/TravelBuddyIcons';
import { supabase } from '../lib/supabase';
import { useCurrentTrip, currentTripIdRef } from '../context/TripContext';

const { width } = Dimensions.get('window');

function F({ label, placeholder, value, onChangeText, optional }: {
  label: string; placeholder: string; value: string;
  onChangeText: (t: string) => void; optional?: boolean;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={fStyles.label}>
        {label}{optional ? <Text style={fStyles.optional}> (optional)</Text> : null}
      </Text>
      <TextInput
        style={fStyles.input}
        placeholder={placeholder}
        placeholderTextColor="#C0C0C0"
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

const fStyles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 6 },
  optional: { fontWeight: '400', color: '#BBB' },
  input: { backgroundColor: '#F5F5F5', borderRadius: 12, borderWidth: 1, borderColor: '#EBEBEB', paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#1A1A1A' },
});

function getExpiryWarning(expiryDate: string): { state: 'safe' | 'warning' | 'expired'; daysLeft: number } {
  if (!expiryDate) return { state: 'safe', daysLeft: 999 };
  const now = new Date();
  const exp = new Date(expiryDate);
  const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { state: 'expired', daysLeft: diffDays };
  if (diffDays <= 90) return { state: 'warning', daysLeft: diffDays };
  return { state: 'safe', daysLeft: diffDays };
}

function SummaryCard({ label, value, icon, color, bgColor }: {
  label: string; value: string | number; icon: React.ReactNode; color: string; bgColor: string;
}) {
  return (
    <View style={[summaryStyles.card, { backgroundColor: bgColor }]}>
      <View style={summaryStyles.iconWrap}>{icon}</View>
      <Text style={[summaryStyles.value, { color }]}>{value}</Text>
      <Text style={summaryStyles.label}>{label}</Text>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  card: { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#F0F0F0' },
  iconWrap: { marginBottom: 8 },
  value: { fontSize: 24, fontWeight: '900', marginBottom: 2 },
  label: { fontSize: 12, color: '#888', fontWeight: '600' },
});

function DocumentCard({ doc, onPress }: { doc: any; onPress: () => void }) {
  const warning = getExpiryWarning(doc.expires_at ?? '');
  const isWarning = warning.state === 'warning';
  const isExpired = warning.state === 'expired';

  return (
    <TouchableOpacity style={docCardStyles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={docCardStyles.topRow}>
        {getDocumentTypeIcon(doc.type ?? 'Other')}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={docCardStyles.type}>{doc.title}</Text>
          <Text style={docCardStyles.holder}>{doc.details}</Text>
        </View>
        <Text style={{ fontSize: 18, color: '#CCC' }}>›</Text>
      </View>
      <View style={docCardStyles.bottomRow}>
        <View style={docCardStyles.expiryWrap}>
          {isExpired ? (
            <ExpiredIcon size={16} color="#F44336" />
          ) : isWarning ? (
            <WarningIcon size={16} color="#FF9800" />
          ) : (
            <CheckIcon size={16} color="#4CAF50" />
          )}
          <Text style={[docCardStyles.expiryText, isExpired && { color: '#F44336' }, isWarning && { color: '#FF9800' }]}>
            {doc.expires_at ? `Expires ${doc.expires_at}` : 'No expiry'}
          </Text>
        </View>
        {doc.saved_offline && (
          <View style={docCardStyles.offlineBadge}>
            <Text style={docCardStyles.offlineText}>Offline</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const docCardStyles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#F0F0F0', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  type: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  holder: { fontSize: 12, color: '#888', marginTop: 1 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  expiryWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  expiryText: { fontSize: 12, color: '#4CAF50', fontWeight: '600' },
  offlineBadge: { backgroundColor: '#E8F5E9', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  offlineText: { fontSize: 10, fontWeight: '700', color: '#4CAF50' },
});

function HubOption({ icon, title, subtitle, onPress, color }: {
  icon: React.ReactNode; title: string; subtitle: string; onPress: () => void; color: string;
}) {
  return (
    <TouchableOpacity style={hubOptionStyles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={[hubOptionStyles.iconBg, { backgroundColor: `${color}15` }]}>{icon}</View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={hubOptionStyles.title}>{title}</Text>
        <Text style={hubOptionStyles.subtitle}>{subtitle}</Text>
      </View>
      <Text style={{ fontSize: 18, color: '#CCC' }}>›</Text>
    </TouchableOpacity>
  );
}

const hubOptionStyles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#F0F0F0', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  iconBg: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  subtitle: { fontSize: 12, color: '#888', marginTop: 2 },
});

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function DocumentsScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { currentTripId } = useCurrentTrip();
  const [trip, setTrip] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [screen, setScreen] = useState<'dashboard' | 'addHub' | 'uploadPdf' | 'emailIntro' | 'manual' | 'detail' | 'success'>('dashboard');
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  const [manualType, setManualType] = useState('Passport');
  const [manualTitle, setManualTitle] = useState('');
  const [manualDetails, setManualDetails] = useState('');
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; uri: string } | null>(null);

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

    const { data: docsData } = await supabase.from('documents').select('*').eq('trip_id', tripData.id).order('created_at', { ascending: false });
    setDocuments(docsData ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadData(currentTripIdRef.current ?? route.params?.tripId);
    }, [])
  );

  async function handlePickFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true });
      if (!result.canceled && result.assets?.[0]) {
        setUploadedFile({ name: result.assets[0].name, uri: result.assets[0].uri });
        setScreen('manual');
      }
    } catch { Alert.alert('Error', 'Could not pick file'); }
  }

  async function handleSaveManual() {
    if (!manualTitle.trim() || !trip) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase.from('documents').insert({
      trip_id: trip.id,
      user_id: user.id,
      title: manualTitle.trim(),
      type: manualType,
      details: manualDetails || manualType,
      expires_at: expiryDate ? expiryDate.toISOString().split('T')[0] : null,
      saved_offline: false,
    }).select().single();

    if (error) { Alert.alert('Error', error.message); }
    else { setDocuments((prev) => [data, ...prev]); setScreen('success'); }
    setSaving(false);
  }

  async function handleDelete(doc: any) {
    Alert.alert('Delete document', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await supabase.from('documents').delete().eq('id', doc.id);
        setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
        setScreen('dashboard');
      }},
    ]);
  }

  const expiringSoon = useMemo(() => {
    return documents.filter((d) => {
      const w = getExpiryWarning(d.expires_at ?? '');
      return w.state === 'warning' || w.state === 'expired';
    });
  }, [documents]);

  const resetForm = () => {
    setManualType('Passport'); setManualTitle(''); setManualDetails('');
    setExpiryDate(null); setUploadedFile(null);
  };

  const goToDashboard = () => { setScreen('dashboard'); setSelectedDoc(null); resetForm(); };

  const DOC_TYPES = ['Passport', 'Insurance', 'Flight Ticket', 'Hotel Confirmation', 'Visa', 'Other'];

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      </SafeAreaView>
    );
  }

  // ─── DASHBOARD ──
  if (screen === 'dashboard') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeftIcon size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Documents</Text>
          <TouchableOpacity onPress={() => setScreen('addHub')}>
            <PlusIcon size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={dashStyles.summaryRow}>
            <SummaryCard label="Documents" value={documents.length} icon={<DocumentIcon size={24} color="#2196F3" />} color="#2196F3" bgColor="#E3F2FD" />
            <SummaryCard label="Expiring soon" value={expiringSoon.length} icon={<WarningIcon size={24} color="#FF9800" />} color="#FF9800" bgColor="#FFF8E1" />
          </View>

          <View style={dashStyles.sectionHeader}>
            <Text style={dashStyles.sectionTitle}>YOUR DOCUMENTS</Text>
          </View>

          {documents.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>📄</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1A1A' }}>No documents yet</Text>
              <Text style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Tap + to add your first document</Text>
            </View>
          ) : (
            <View style={dashStyles.docsList}>
              {documents.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} onPress={() => { setSelectedDoc(doc); setScreen('detail'); }} />
              ))}
            </View>
          )}

          <TouchableOpacity style={dashStyles.addBtn} onPress={() => setScreen('addHub')}>
            <PlusIcon size={20} color="#4CAF50" />
            <Text style={dashStyles.addBtnText}>Add document</Text>
          </TouchableOpacity>

          <View style={dashStyles.securityNote}>
            <LockIcon size={18} color="#4CAF50" />
            <Text style={dashStyles.securityText}>Keep your important documents safe and accessible anywhere.</Text>
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

  // ─── ADD HUB ──
  if (screen === 'addHub') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={goToDashboard}>
            <CloseIcon size={22} />
          </TouchableOpacity>
          <Text style={styles.title}>Add Document</Text>
          <View style={{ width: 32 }} />
        </View>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={hubStyles.subtitle}>How would you like to add it?</Text>
          <HubOption icon={<PdfIcon size={24} color="#F44336" />} title="Upload PDF" subtitle="Upload from your device" onPress={() => setScreen('uploadPdf')} color="#F44336" />
          <HubOption icon={<ImportEmailIcon size={24} color="#EA4335" />} title="Import from email" subtitle="Coming soon" onPress={() => {}} color="#EA4335" />
          <HubOption icon={<AddManualIcon size={24} color="#FF9800" />} title="Add manually" subtitle="Enter details yourself" onPress={() => setScreen('manual')} color="#FF9800" />
          <View style={hubStyles.securityNote}>
            <LockIcon size={18} color="#4CAF50" />
            <Text style={hubStyles.securityText}>We keep your documents private and secure.</Text>
          </View>
          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── UPLOAD PDF ──
  if (screen === 'uploadPdf') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setScreen('addHub')}>
            <ArrowLeftIcon size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Upload PDF</Text>
          <View style={{ width: 32 }} />
        </View>
        <ScrollView contentContainerStyle={pdfStyles.content} showsVerticalScrollIndicator={false}>
          <View style={pdfStyles.uploadBox}>
            <PdfIcon size={56} color="#F44336" />
            <Text style={pdfStyles.uploadText}>Tap to upload your PDF</Text>
            <Text style={pdfStyles.uploadSub}>Browse files from your device</Text>
            <TouchableOpacity style={pdfStyles.chooseBtn} onPress={handlePickFile}>
              <Text style={pdfStyles.chooseBtnText}>Choose file</Text>
            </TouchableOpacity>
          </View>
          <Text style={pdfStyles.hint}>Works with passports, visas, insurance and more</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── EMAIL INTRO ──
  if (screen === 'emailIntro') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setScreen('addHub')}>
            <ArrowLeftIcon size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Import from Email</Text>
          <View style={{ width: 32 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'center' }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>📧</Text>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#1A1A1A', textAlign: 'center' }}>Coming Soon</Text>
          <Text style={{ fontSize: 14, color: '#888', textAlign: 'center', marginTop: 8 }}>Gmail integration is coming in a future update.</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── MANUAL ADD ──
  if (screen === 'manual') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setScreen('addHub')}>
            <CloseIcon size={22} />
          </TouchableOpacity>
          <Text style={styles.title}>{uploadedFile ? 'Review Details' : 'Add Manually'}</Text>
          <View style={{ width: 32 }} />
        </View>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {uploadedFile && (
            <View style={{ backgroundColor: '#E8F5E9', borderRadius: 12, padding: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <PdfIcon size={20} color="#4CAF50" />
              <Text style={{ fontSize: 13, color: '#2E7D32', fontWeight: '600', flex: 1 }} numberOfLines={1}>{uploadedFile.name}</Text>
            </View>
          )}

          <Text style={fStyles.label}>Document type</Text>
          <View style={manualScreenStyles.typeRow}>
            {DOC_TYPES.map((t) => (
              <TouchableOpacity key={t} style={[manualScreenStyles.typeChip, manualType === t && manualScreenStyles.typeChipActive]} onPress={() => setManualType(t)}>
                {getDocumentTypeIcon(t, 18)}
                <Text style={[manualScreenStyles.typeText, manualType === t && manualScreenStyles.typeTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <F label="Title" placeholder="e.g. Vlad Popescu — Passport" value={manualTitle} onChangeText={setManualTitle} />
          <F label="Details / notes" placeholder="e.g. Policy #12345678" value={manualDetails} onChangeText={setManualDetails} optional />

          <Text style={fStyles.label}>Expiry date <Text style={fStyles.optional}>(optional)</Text></Text>
          <TouchableOpacity
            style={[fStyles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }]}
            onPress={() => setShowExpiryPicker(true)}
          >
            <Text style={{ fontSize: 15, color: expiryDate ? '#1A1A1A' : '#C0C0C0' }}>
              {expiryDate ? formatDate(expiryDate) : 'Pick expiry date'}
            </Text>
            <Text style={{ fontSize: 16 }}>📅</Text>
          </TouchableOpacity>
          {showExpiryPicker && (
            <DateTimePicker
              value={expiryDate ?? new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, date) => { setShowExpiryPicker(Platform.OS === 'ios'); if (date) setExpiryDate(date); }}
            />
          )}

          <TouchableOpacity
            style={[manualScreenStyles.saveBtn, (!manualTitle.trim() || saving) && manualScreenStyles.saveBtnDisabled]}
            onPress={handleSaveManual}
            disabled={!manualTitle.trim() || saving}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={manualScreenStyles.saveBtnText}>Save Document</Text>}
          </TouchableOpacity>
          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── DETAIL ──
  if (screen === 'detail' && selectedDoc) {
    const warning = getExpiryWarning(selectedDoc.expires_at ?? '');
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={goToDashboard}>
            <ArrowLeftIcon size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>{selectedDoc.type}</Text>
          <TouchableOpacity onPress={() => handleDelete(selectedDoc)}>
            <Text style={{ fontSize: 15, color: '#F44336', fontWeight: '600' }}>Delete</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={detailStyles.previewBox}>
            <View style={detailStyles.previewPlaceholder}>
              {getDocumentTypeIcon(selectedDoc.type ?? 'Other', 64)}
              <Text style={detailStyles.previewLabel}>{selectedDoc.title}</Text>
            </View>
          </View>
          <View style={detailStyles.detailsCard}>
            <DetailRow label="Document type" value={selectedDoc.type ?? '-'} />
            <DetailRow label="Details" value={selectedDoc.details ?? '-'} />
            <DetailRow label="Expiry date" value={selectedDoc.expires_at ?? 'No expiry'} warning={warning.state !== 'safe'} last />
          </View>
          <View style={detailStyles.actionsRow}>
            <TouchableOpacity style={[detailStyles.actionBtn, { backgroundColor: '#E8F5E9' }]}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#4CAF50' }}>Download</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[detailStyles.actionBtn, { backgroundColor: '#E3F2FD' }]}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#2196F3' }}>Share</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── SUCCESS ──
  if (screen === 'success') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={successStyles.content} showsVerticalScrollIndicator={false}>
          <Text style={{ fontSize: 80, marginBottom: 16 }}>📄</Text>
          <Text style={successStyles.heading}>All set!</Text>
          <Text style={successStyles.sub}>Your document has been added{'\n'}to your collection.</Text>
          <TouchableOpacity style={successStyles.viewBtn} onPress={goToDashboard}>
            <Text style={successStyles.viewBtnText}>View Documents</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

function DetailRow({ label, value, warning, last }: { label: string; value: string; warning?: boolean; last?: boolean }) {
  return (
    <View style={[detailRowStyles.row, !last && detailRowStyles.rowBorder]}>
      <Text style={detailRowStyles.label}>{label}</Text>
      <Text style={[detailRowStyles.value, warning && { color: '#FF9800' }]}>{value}</Text>
    </View>
  );
}

const detailRowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  label: { fontSize: 13, color: '#888', flex: 1 },
  value: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', textAlign: 'right', maxWidth: '55%' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  footerDecor: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
});

const dashStyles = StyleSheet.create({
  summaryRow: { flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 8 },
  sectionHeader: { marginTop: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#888', letterSpacing: 0.8 },
  docsList: { marginBottom: 8 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#E0E0E0', borderStyle: 'dashed', marginBottom: 16 },
  addBtnText: { fontSize: 15, fontWeight: '600', color: '#4CAF50' },
  securityNote: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#E8F5E9', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#A5D6A7' },
  securityText: { flex: 1, fontSize: 13, color: '#555', lineHeight: 18 },
});

const hubStyles = StyleSheet.create({
  subtitle: { fontSize: 14, color: '#888', marginBottom: 16, marginTop: 8 },
  securityNote: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#E8F5E9', borderRadius: 12, padding: 12, marginTop: 16, borderWidth: 1, borderColor: '#A5D6A7' },
  securityText: { flex: 1, fontSize: 13, color: '#555', lineHeight: 18 },
});

const pdfStyles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 24, alignItems: 'center' },
  uploadBox: { width: '100%', borderWidth: 2, borderColor: '#FFCDD2', borderStyle: 'dashed', borderRadius: 16, paddingVertical: 40, alignItems: 'center', backgroundColor: '#FFF5F5' },
  uploadText: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginTop: 12 },
  uploadSub: { fontSize: 13, color: '#888', marginTop: 4, marginBottom: 16 },
  chooseBtn: { backgroundColor: '#4CAF50', borderRadius: 12, paddingHorizontal: 28, paddingVertical: 12 },
  chooseBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  hint: { fontSize: 12, color: '#888', marginTop: 16, textAlign: 'center' },
});

const manualScreenStyles = StyleSheet.create({
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#EBEBEB', backgroundColor: '#F5F5F5' },
  typeChipActive: { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' },
  typeText: { fontSize: 12, fontWeight: '600', color: '#666' },
  typeTextActive: { color: '#4CAF50' },
  saveBtn: { backgroundColor: '#4CAF50', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8, shadowColor: '#4CAF50', shadowOpacity: 0.25, shadowRadius: 8, elevation: 3 },
  saveBtnDisabled: { backgroundColor: '#C8E6C9', shadowOpacity: 0, elevation: 0 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

const detailStyles = StyleSheet.create({
  previewBox: { marginHorizontal: 0, marginBottom: 16, marginTop: 8 },
  previewPlaceholder: { backgroundColor: '#F5F5F5', borderRadius: 16, paddingVertical: 40, alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0', borderStyle: 'dashed' },
  previewLabel: { fontSize: 14, color: '#888', marginTop: 8, fontWeight: '600' },
  detailsCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#F0F0F0', paddingHorizontal: 16, paddingVertical: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1, marginBottom: 16 },
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  actionBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14 },
});

const successStyles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 60, alignItems: 'center' },
  heading: { fontSize: 26, fontWeight: '900', color: '#1A1A1A', marginTop: 12, textAlign: 'center' },
  sub: { fontSize: 15, color: '#888', textAlign: 'center', marginTop: 6, marginBottom: 24, lineHeight: 22 },
  viewBtn: { backgroundColor: '#4CAF50', borderRadius: 14, paddingVertical: 16, alignItems: 'center', width: '100%', shadowColor: '#4CAF50', shadowOpacity: 0.25, shadowRadius: 8, elevation: 3 },
  viewBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
