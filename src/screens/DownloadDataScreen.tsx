import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Map, BookOpen, FileText, DollarSign, Settings } from 'lucide-react-native';

// Travel archive illustration
function ArchiveIllustration() {
  return (
    <View style={illustrationStyles.container}>
      {/* Background sky */}
      <View style={illustrationStyles.bg}>
        <View style={[illustrationStyles.hill, { left: -10, width: 140, backgroundColor: '#C8E6C9' }]} />
        <View style={[illustrationStyles.hill, { right: -10, width: 110, backgroundColor: '#A5D6A7' }]} />
      </View>
      {/* Folder */}
      <View style={illustrationStyles.folder}>
        <View style={illustrationStyles.folderTab} />
        <View style={illustrationStyles.folderBody}>
          {/* Download arrow */}
          <View style={illustrationStyles.arrowContainer}>
            <View style={illustrationStyles.arrowShaft} />
            <View style={illustrationStyles.arrowHead} />
          </View>
        </View>
      </View>
      {/* Flying docs */}
      <View style={[illustrationStyles.doc, { top: 10, right: 28 }]}>
        <Text style={illustrationStyles.docEmoji}>📋</Text>
      </View>
      <View style={[illustrationStyles.doc, { top: 24, left: 24 }]}>
        <Text style={illustrationStyles.docEmoji}>📘</Text>
      </View>
      <View style={[illustrationStyles.doc, { top: 4, left: 56 }]}>
        <Text style={illustrationStyles.docEmoji}>🗺️</Text>
      </View>
    </View>
  );
}

// Success illustration
function SuccessIllustration() {
  return (
    <View style={successStyles.container}>
      <View style={successStyles.bg}>
        <View style={[successStyles.hill, { left: -10, width: 140, backgroundColor: '#C8E6C9' }]} />
        <View style={[successStyles.hill, { right: -10, width: 110, backgroundColor: '#A5D6A7' }]} />
      </View>
      {/* Green circle with checkmark */}
      <View style={successStyles.circle}>
        <View style={successStyles.checkWrap}>
          <Text style={successStyles.check}>✓</Text>
        </View>
      </View>
      {/* Floating birds */}
      <View style={[successStyles.bird, { top: 12, left: 36 }]}>
        <Text style={{ fontSize: 14 }}>✈</Text>
      </View>
      <View style={[successStyles.bird, { top: 26, right: 32 }]}>
        <Text style={{ fontSize: 10 }}>✈</Text>
      </View>
    </View>
  );
}

const illustrationStyles = StyleSheet.create({
  container: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  bg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    overflow: 'hidden',
  },
  hill: {
    position: 'absolute',
    bottom: 0,
    height: 40,
    borderRadius: 60,
  },
  folder: {
    position: 'absolute',
    bottom: 20,
    alignItems: 'center',
  },
  folderTab: {
    width: 48,
    height: 14,
    backgroundColor: '#388E3C',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 14,
    alignSelf: 'flex-start',
    marginLeft: 4,
  },
  folderBody: {
    width: 100,
    height: 72,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    borderTopLeftRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2E7D32',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  arrowContainer: { alignItems: 'center' },
  arrowShaft: { width: 4, height: 22, backgroundColor: '#fff', borderRadius: 2 },
  arrowHead: {
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#fff',
    marginTop: -1,
  },
  doc: { position: 'absolute' },
  docEmoji: { fontSize: 28 },
});

const successStyles = StyleSheet.create({
  container: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  bg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    overflow: 'hidden',
  },
  hill: {
    position: 'absolute',
    bottom: 0,
    height: 40,
    borderRadius: 60,
  },
  circle: {
    position: 'absolute',
    bottom: 18,
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2E7D32',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 4,
    borderColor: '#fff',
  },
  checkWrap: { alignItems: 'center', justifyContent: 'center' },
  check: { fontSize: 38, color: '#fff', fontWeight: '900', lineHeight: 44 },
  bird: { position: 'absolute' },
});

const INCLUDES = [
  { icon: <Map size={18} color="#4CAF50" />, label: 'Trips & itineraries' },
  { icon: <BookOpen size={18} color="#4CAF50" />, label: 'Journal entries & photos' },
  { icon: <FileText size={18} color="#4CAF50" />, label: 'Documents' },
  { icon: <DollarSign size={18} color="#4CAF50" />, label: 'Budgets & expenses' },
  { icon: <Settings size={18} color="#4CAF50" />, label: 'App settings & preferences' },
];

export default function DownloadDataScreen() {
  const navigation = useNavigation<any>();
  const [success, setSuccess] = useState(false);

  if (success) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('ProfileSettings')}>
            <ChevronLeft size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Download My Data</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.successContent} showsVerticalScrollIndicator={false}>
          <SuccessIllustration />

          <Text style={styles.successTitle}>Export Requested!</Text>
          <Text style={styles.successBody}>
            {"We're preparing your archive.\nYou'll receive an email when it's ready\nat vlad.popescu@email.com."}
          </Text>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('ProfileSettings')}
          >
            <Text style={styles.primaryBtnText}>Back to Profile</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Download My Data</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ArchiveIllustration />

        <Text style={styles.title}>Download Your Travel Data</Text>
        <Text style={styles.description}>
          {"We'll create an archive of your trips, journal entries, documents, preferences and settings and send it to your email address."}
        </Text>

        {/* Includes card */}
        <View style={styles.includesCard}>
          <Text style={styles.includesLabel}>This includes:</Text>
          {INCLUDES.map((item, index) => (
            <View key={item.label} style={[styles.includesRow, index < INCLUDES.length - 1 && styles.includesRowBorder]}>
              <View style={styles.includesIcon}>{item.icon}</View>
              <Text style={styles.includesText}>{item.label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={() => setSuccess(true)}>
          <Text style={styles.primaryBtnText}>Download Data</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F7F7' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },

  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: 'center',
  },
  successContent: {
    paddingHorizontal: 24,
    paddingTop: 48,
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
  },

  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },

  includesCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    width: '100%',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  includesLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888',
    marginBottom: 12,
  },
  includesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  includesRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  includesIcon: {
    width: 28,
    alignItems: 'center',
  },
  includesText: { fontSize: 15, color: '#1A1A1A', fontWeight: '500' },

  primaryBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#4CAF50',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 12,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  cancelBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  cancelBtnText: { fontSize: 16, fontWeight: '600', color: '#4CAF50' },

  // Success state
  successTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  successBody: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
  },
});
