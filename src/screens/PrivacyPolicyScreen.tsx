import React, { useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronRight, ChevronLeft } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const SECTIONS = [
  {
    num: 1,
    title: 'Information We Collect',
    content: `We collect information you provide directly to us, such as your name, email address, and trip details.\n\nThis includes information you add to your trips, journal entries, documents, and preferences.`,
  },
  {
    num: 2,
    title: 'How We Use Data',
    content: `We use the information we collect to provide, maintain, and improve our services, personalize your experience, and send you important updates about your trips.\n\nWe also use your data to send you notifications about upcoming flights, check-ins, and budget alerts that you have enabled.`,
  },
  {
    num: 3,
    title: 'Data Sharing',
    content: `We do not sell your personal data to third parties.\n\nWe may share data with trusted service providers who assist us in delivering our services, such as cloud storage providers and analytics tools. All such providers are bound by strict data protection agreements.\n\nWhen you connect third-party services such as Airbnb or Booking.com, relevant booking data may be shared with those platforms in accordance with their own privacy policies.`,
  },
  {
    num: 4,
    title: 'Security',
    content: `We take reasonable and appropriate measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction.\n\nYour data is encrypted in transit using TLS and at rest using AES-256 encryption. We recommend enabling two-factor authentication for additional account protection.`,
  },
  {
    num: 5,
    title: 'Your Rights',
    content: `You have the right to access, correct, export, or delete your personal data at any time.\n\nYou can download a full export of your data from Profile > Security > Download My Data.\n\nTo request permanent deletion of your account and all associated data, visit Profile > Security > Delete Account. Deletion requests are processed within 30 days.`,
  },
  {
    num: 6,
    title: 'Contact',
    content: `If you have questions or concerns about this Privacy Policy or our data practices, please contact us at:\n\nsupport@ultimatetravelbuddy.app\n\nWe respond to all privacy-related inquiries within 5 business days.`,
  },
];

// Shield illustration using shapes
function ShieldIllustration() {
  return (
    <View style={illustrationStyles.container}>
      {/* Sky background */}
      <View style={illustrationStyles.bg}>
        {/* Trees */}
        <View style={[illustrationStyles.tree, { left: 18, bottom: 0 }]}>
          <View style={illustrationStyles.treeTop} />
          <View style={illustrationStyles.treeTrunk} />
        </View>
        <View style={[illustrationStyles.tree, { right: 18, bottom: 0 }]}>
          <View style={illustrationStyles.treeTop} />
          <View style={illustrationStyles.treeTrunk} />
        </View>
        <View style={[illustrationStyles.tree, { left: 54, bottom: 0 }, { transform: [{ scaleX: 0.75 }] }]}>
          <View style={illustrationStyles.treeTop} />
          <View style={illustrationStyles.treeTrunk} />
        </View>
        <View style={[illustrationStyles.tree, { right: 54, bottom: 0 }, { transform: [{ scaleX: 0.75 }] }]}>
          <View style={illustrationStyles.treeTop} />
          <View style={illustrationStyles.treeTrunk} />
        </View>
        {/* Hills */}
        <View style={[illustrationStyles.hill, { left: -20, bottom: 0, width: 130, height: 50, backgroundColor: '#C8E6C9' }]} />
        <View style={[illustrationStyles.hill, { right: -20, bottom: 0, width: 110, height: 40, backgroundColor: '#A5D6A7' }]} />
      </View>
      {/* Shield */}
      <View style={illustrationStyles.shieldWrap}>
        <View style={illustrationStyles.shield}>
          <View style={illustrationStyles.lockBody}>
            <View style={illustrationStyles.lockShackle} />
            <View style={illustrationStyles.lockFace}>
              <View style={illustrationStyles.keyhole} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const illustrationStyles = StyleSheet.create({
  container: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    overflow: 'hidden',
  },
  hill: {
    position: 'absolute',
    borderRadius: 60,
  },
  tree: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 2,
  },
  treeTop: {
    width: 28,
    height: 44,
    backgroundColor: '#66BB6A',
    borderRadius: 14,
    marginBottom: 0,
  },
  treeTrunk: {
    width: 8,
    height: 14,
    backgroundColor: '#8D6E63',
    borderRadius: 2,
  },
  shieldWrap: {
    position: 'absolute',
    bottom: 28,
    alignSelf: 'center',
  },
  shield: {
    width: 90,
    height: 106,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    borderBottomLeftRadius: 45,
    borderBottomRightRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2E7D32',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    borderWidth: 4,
    borderColor: '#fff',
  },
  lockBody: { alignItems: 'center' },
  lockShackle: {
    width: 26,
    height: 20,
    borderWidth: 4,
    borderColor: '#fff',
    borderRadius: 13,
    borderBottomWidth: 0,
    marginBottom: -2,
  },
  lockFace: {
    width: 34,
    height: 28,
    backgroundColor: '#fff',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyhole: {
    width: 10,
    height: 14,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
});

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();
  const scrollRef = useRef<ScrollView>(null);
  const sectionRefs = useRef<Record<number, number>>({});

  const scrollToSection = (num: number) => {
    const y = sectionRefs.current[num];
    if (y !== undefined && scrollRef.current) {
      scrollRef.current.scrollTo({ y, animated: true });
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView ref={scrollRef} style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Illustration */}
        <View style={styles.illustrationWrap}>
          <ShieldIllustration />
          <Text style={styles.pageTitle}>Privacy Policy</Text>
          <Text style={styles.lastUpdated}>Last updated: June 2025</Text>
        </View>

        {/* Table of contents */}
        <View style={styles.card}>
          <Text style={styles.contentsLabel}>CONTENTS</Text>
          {SECTIONS.map((s, index) => (
            <TouchableOpacity
              key={s.num}
              style={[styles.tocRow, index < SECTIONS.length - 1 && styles.tocRowBorder]}
              onPress={() => scrollToSection(s.num)}
              activeOpacity={0.7}
            >
              <View style={styles.tocNum}>
                <Text style={styles.tocNumText}>{s.num}</Text>
              </View>
              <Text style={styles.tocTitle}>{s.title}</Text>
              <ChevronRight size={16} color="#C0C0C0" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sections */}
        <View style={{ paddingHorizontal: 16 }}>
          {SECTIONS.map((s) => (
            <View
              key={s.num}
              style={styles.section}
              onLayout={(e) => {
                sectionRefs.current[s.num] = e.nativeEvent.layout.y + 380;
              }}
            >
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionNum}>
                  <Text style={styles.sectionNumText}>{s.num}</Text>
                </View>
                <Text style={styles.sectionTitle}>{s.title}</Text>
              </View>
              <Text style={styles.sectionBody}>{s.content}</Text>
            </View>
          ))}
        </View>

        {/* Footer button */}
        <TouchableOpacity style={styles.backToProfileBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backToProfileText}>Back to Profile</Text>
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

  scroll: { flex: 1 },

  illustrationWrap: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1A1A',
    marginTop: 12,
    marginBottom: 4,
  },
  lastUpdated: { fontSize: 13, color: '#888' },

  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 14,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  contentsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  tocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  tocRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  tocNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tocNumText: { fontSize: 13, fontWeight: '700', color: '#4CAF50' },
  tocTitle: { flex: 1, fontSize: 15, color: '#1A1A1A', fontWeight: '500' },

  section: {
    marginBottom: 28,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionNum: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionNumText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  sectionBody: {
    fontSize: 15,
    color: '#444',
    lineHeight: 24,
  },

  backToProfileBtn: {
    backgroundColor: '#4CAF50',
    marginHorizontal: 16,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 8,
  },
  backToProfileText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
