import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Sparkle, Cloud, Dot, TravelStamp, DottedLine } from '../components/TravelDecorations';
import CartoonIcon from '../components/CartoonIcon';
import StatusBadge from '../components/StatusBadge';

const { width } = Dimensions.get('window');

const PHOTO_GALLERY = [
  'https://images.pexels.com/photos/2474689/pexels-photo-2474689.jpeg?auto=compress&cs=tinysrgb&w=300',
  'https://images.pexels.com/photos/3225531/pexels-photo-3225531.jpeg?auto=compress&cs=tinysrgb&w=300',
  'https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=300',
  'https://images.pexels.com/photos/1007426/pexels-photo-1007426.jpeg?auto=compress&cs=tinysrgb&w=300',
  'https://images.pexels.com/photos/3491373/pexels-photo-3491373.jpeg?auto=compress&cs=tinysrgb&w=300',
  'https://images.pexels.com/photos/1321732/pexels-photo-1321732.jpeg?auto=compress&cs=tinysrgb&w=300',
];

const BALI_ACCOMMODATIONS = [
  { id: '1', name: 'Villa Padi Ubud', nights: 4, icon: '🏡', iconBg: '#FCE4EC', status: 'UPCOMING' as const },
  { id: '2', name: 'Seminyak Beach Resort', nights: 2, icon: '🏨', iconBg: '#E8F5E9', status: 'UPCOMING' as const },
  { id: '3', name: 'Kuta Hostel Bali', nights: 2, icon: '🏠', iconBg: '#E3F2FD', status: 'UPCOMING' as const },
];

const PLACES_VISITED = [
  { id: '1', name: 'Uluwatu Temple', icon: '🛕', iconBg: '#FFF3E0', done: true },
  { id: '2', name: 'Seminyak Beach', icon: '🏖️', iconBg: '#E3F2FD', done: true },
  { id: '3', name: 'Ubud Monkey Forest', icon: '🐒', iconBg: '#E8F5E9', done: false },
  { id: '4', name: 'Tanah Lot Temple', icon: '🌊', iconBg: '#E8F5E9', done: false },
  { id: '5', name: 'Mount Batur Hike', icon: '🌋', iconBg: '#FCE4EC', done: false },
];

const UPCOMING_ACTIVITIES = [
  { id: '1', time: '19:00', title: 'Check-in Villa Padi Ubud', icon: '🏡', iconBg: '#FCE4EC', status: 'UPCOMING' as const },
  { id: '2', time: '08:00', title: 'Sunrise at Mount Batur', icon: '🌅', iconBg: '#FFF3E0', status: 'UPCOMING' as const },
  { id: '3', time: '14:00', title: 'Ubud Cooking Class', icon: '🍳', iconBg: '#E8F5E9', status: 'UPCOMING' as const },
];

const BALI_JOURNAL = [
  {
    id: '1',
    location: 'Uluwatu Temple',
    note: 'Stunning cliffside temple! 🌊\nThe sunset was absolutely magical.',
    photoUrl: 'https://images.pexels.com/photos/2474689/pexels-photo-2474689.jpeg?auto=compress&cs=tinysrgb&w=200',
    emoji: '🛕',
    time: '17:30',
  },
];

const TABS = ['Overview', 'Activities', 'Photos', 'Journal'];

export default function DestinationDetailsScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('Overview');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Bali</Text>
        <TouchableOpacity><Text style={{ fontSize: 22 }}>⋯</Text></TouchableOpacity>
      </View>

      {/* Hero */}
      <View style={styles.heroContainer}>
        <View style={styles.heroScene}>
          <View style={styles.sky} />
          <View style={styles.ocean} />
          <View style={[styles.hill, { left: -10, bottom: 20, backgroundColor: '#66BB6A' }]} />
          <View style={[styles.hill, { right: -10, bottom: 30, backgroundColor: '#81C784', width: 160, height: 90 }]} />
          <View style={[styles.hill, { left: '25%', bottom: 10, backgroundColor: '#A5D6A7', width: 130, height: 70 }]} />
          <View style={styles.centerEmoji}>
            <Text style={{ fontSize: 72 }}>🌴</Text>
          </View>
          <Text style={[styles.decor, { left: 14, bottom: 20 }]}>🌊</Text>
          <Text style={[styles.decor, { right: 14, bottom: 28 }]}>🛕</Text>
          <Text style={[styles.decor, { left: 48, top: 18 }]}>☁️</Text>
          <Text style={[styles.decor, { right: 54, top: 26 }]}>☁️</Text>
          <Text style={[styles.decor, { right: 18, top: 14 }]}>☀️</Text>
          <Sparkle color="#FFD700" size={12} style={{ position: 'absolute', left: 36, top: 44 }} />
          <Sparkle color="#FFD700" size={10} style={{ position: 'absolute', right: 44, bottom: 64 }} />
          <TravelStamp label="BALI" color="#FF9800" style={{ position: 'absolute', bottom: 16, left: 16, transform: [{ rotate: '-8deg' }] }} />
        </View>
      </View>

      {/* Destination info bar */}
      <View style={styles.infoBar}>
        <View style={styles.infoItem}>
          <Text style={styles.infoValue}>8</Text>
          <Text style={styles.infoLabel}>nights</Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoItem}>
          <Text style={styles.infoValue}>14</Text>
          <Text style={styles.infoLabel}>activities</Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoItem}>
          <Text style={[styles.infoValue, { color: '#FF9800' }]}>€580</Text>
          <Text style={styles.infoLabel}>spent</Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoItem}>
          <Text style={styles.infoValue}>May 16</Text>
          <Text style={styles.infoLabel}>arrival</Text>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabContent}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {activeTab === 'Overview' && (
          <>
            {/* Accommodations */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleWrap}>
                  <Text style={styles.sectionEmoji}>🏨</Text>
                  <Text style={styles.sectionTitle}>Accommodation</Text>
                </View>
              </View>
              <View style={styles.card}>
                {BALI_ACCOMMODATIONS.map((acc, index) => (
                  <View key={acc.id}>
                    <View style={styles.accRow}>
                      <CartoonIcon emoji={acc.icon} bg={acc.iconBg} size={44} />
                      <View style={styles.accInfo}>
                        <Text style={styles.accName}>{acc.name}</Text>
                        <Text style={styles.accNights}>{acc.nights} nights</Text>
                      </View>
                      <StatusBadge status={acc.status} small />
                    </View>
                    {index < BALI_ACCOMMODATIONS.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            </View>

            {/* Places visited */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleWrap}>
                  <Sparkle color="#FF9800" size={12} style={{ position: 'relative', marginRight: 4 }} />
                  <Text style={styles.sectionTitle}>Places</Text>
                </View>
                <Text style={styles.placeCount}>{PLACES_VISITED.filter(p => p.done).length}/{PLACES_VISITED.length} visited</Text>
              </View>
              <View style={styles.card}>
                {PLACES_VISITED.map((place, index) => (
                  <View key={place.id}>
                    <View style={styles.placeRow}>
                      <CartoonIcon emoji={place.icon} bg={place.iconBg} size={40} />
                      <Text style={[styles.placeName, !place.done && { color: '#888' }]}>{place.name}</Text>
                      <View style={[styles.placeCheck, place.done && styles.placeCheckDone]}>
                        {place.done && <Text style={styles.checkMark}>✓</Text>}
                      </View>
                    </View>
                    {index < PLACES_VISITED.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            </View>

            {/* Upcoming activities */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleWrap}>
                  <Cloud size={16} style={{ position: 'relative', marginRight: 4 }} />
                  <Text style={styles.sectionTitle}>Upcoming</Text>
                </View>
              </View>
              <View style={styles.card}>
                {UPCOMING_ACTIVITIES.map((act, index) => (
                  <View key={act.id}>
                    <View style={styles.actRow}>
                      <Text style={styles.actTime}>{act.time}</Text>
                      <CartoonIcon emoji={act.icon} bg={act.iconBg} size={40} />
                      <Text style={styles.actTitle} numberOfLines={1}>{act.title}</Text>
                      <StatusBadge status={act.status} small />
                    </View>
                    {index < UPCOMING_ACTIVITIES.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {activeTab === 'Photos' && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleWrap}>
                <Text style={styles.sectionEmoji}>📸</Text>
                <Text style={styles.sectionTitle}>Photo Gallery</Text>
              </View>
              <Text style={styles.photoCount}>{PHOTO_GALLERY.length} photos</Text>
            </View>
            <View style={styles.photoGrid}>
              {PHOTO_GALLERY.map((uri, index) => (
                <TouchableOpacity key={index} style={styles.photoThumb} activeOpacity={0.85}>
                  <Image source={{ uri }} style={styles.photoImg} resizeMode="cover" />
                  {index === 0 && (
                    <View style={styles.featuredBadge}>
                      <Text style={styles.featuredText}>⭐ Featured</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'Journal' && (
          <View style={styles.section}>
            {BALI_JOURNAL.map((entry) => (
              <View key={entry.id} style={styles.journalCard}>
                {entry.photoUrl ? (
                  <Image source={{ uri: entry.photoUrl }} style={styles.journalPhoto} resizeMode="cover" />
                ) : null}
                <View style={styles.journalContent}>
                  <View style={styles.journalHeader}>
                    <View style={styles.locationChip}>
                      <Text style={styles.locationIcon}>📍</Text>
                      <Text style={styles.locationText}>{entry.location}</Text>
                    </View>
                    <Text style={styles.journalTime}>{entry.time}</Text>
                  </View>
                  <Text style={styles.journalNote}>{entry.note}</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.addButton}>
              <Text style={styles.addIcon}>＋</Text>
              <Text style={styles.addText}>Add journal entry</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'Activities' && (
          <View style={styles.section}>
            <View style={styles.card}>
              {UPCOMING_ACTIVITIES.map((act, index) => (
                <View key={act.id}>
                  <View style={styles.actRow}>
                    <Text style={styles.actTime}>{act.time}</Text>
                    <CartoonIcon emoji={act.icon} bg={act.iconBg} size={40} />
                    <Text style={styles.actTitle} numberOfLines={1}>{act.title}</Text>
                    <StatusBadge status={act.status} small />
                  </View>
                  {index < UPCOMING_ACTIVITIES.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        )}

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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: { padding: 4 },
  backIcon: { fontSize: 28, color: '#1A1A1A', fontWeight: '300' },
  title: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },

  heroContainer: { height: 200, overflow: 'hidden' },
  heroScene: { flex: 1, position: 'relative', overflow: 'hidden' },
  sky: { ...StyleSheet.absoluteFillObject, backgroundColor: '#81D4FA' },
  ocean: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 50, backgroundColor: '#29B6F6' },
  hill: { position: 'absolute', width: 140, height: 80, borderRadius: 70 },
  centerEmoji: { position: 'absolute', bottom: 14, left: 0, right: 0, alignItems: 'center' },
  decor: { position: 'absolute', fontSize: 26 },

  infoBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoItem: { flex: 1, alignItems: 'center' },
  infoValue: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  infoLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  infoDivider: { width: 1, backgroundColor: '#F0F0F0' },

  tabScroll: { backgroundColor: '#fff', maxHeight: 52 },
  tabContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 8, flexDirection: 'row' },
  tab: { paddingHorizontal: 18, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F5F5F5' },
  tabActive: { backgroundColor: '#4CAF50' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#666' },
  tabTextActive: { color: '#fff' },

  scroll: { flex: 1, padding: 16 },
  section: { marginBottom: 8 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitleWrap: { flexDirection: 'row', alignItems: 'center' },
  sectionEmoji: { fontSize: 16, marginRight: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  placeCount: { fontSize: 13, color: '#4CAF50', fontWeight: '600' },
  photoCount: { fontSize: 13, color: '#888', fontWeight: '600' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  divider: { height: 1, backgroundColor: '#F5F5F5' },

  accRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  accInfo: { flex: 1 },
  accName: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  accNights: { fontSize: 12, color: '#888', marginTop: 2 },

  placeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  placeName: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  placeCheck: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: '#E0E0E0',
    alignItems: 'center', justifyContent: 'center',
  },
  placeCheckDone: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  checkMark: { fontSize: 12, color: '#fff', fontWeight: '800' },

  actRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  actTime: { width: 44, fontSize: 12, fontWeight: '700', color: '#666' },
  actTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1A1A1A' },

  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoThumb: {
    width: (width - 48) / 2,
    height: 120,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImg: { width: '100%', height: '100%' },
  featuredBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  featuredText: { fontSize: 11, fontWeight: '700', color: '#1A1A1A' },

  journalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  journalPhoto: { width: '100%', height: 160 },
  journalContent: { padding: 14 },
  journalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  locationIcon: { fontSize: 12 },
  locationText: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
  journalTime: { fontSize: 12, color: '#888' },
  journalNote: { fontSize: 14, color: '#444', lineHeight: 21 },

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  addIcon: { fontSize: 20, color: '#4CAF50', fontWeight: '700' },
  addText: { fontSize: 15, fontWeight: '600', color: '#4CAF50' },

  footerDecor: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
});
