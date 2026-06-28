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
import { useNavigation, useRoute } from '@react-navigation/native';
import { Sparkle, Cloud, Dot, TravelStamp, DottedLine } from '../components/TravelDecorations';

const { width } = Dimensions.get('window');

const STATS = [
  { icon: '📅', value: '28', label: 'Days traveled' },
  { icon: '🌍', value: '1', label: 'Country' },
  { icon: '📍', value: '4', label: 'Destinations' },
  { icon: '✈️', value: '7', label: 'Flights' },
  { icon: '📸', value: '142', label: 'Photos' },
  { icon: '📓', value: '18', label: 'Journal entries' },
];

const TIMELINE = [
  { date: 'May 9', icon: '✈️', title: 'Istanbul → Jakarta', detail: 'Turkish Airlines · 13h flight', color: '#E3F2FD' },
  { date: 'May 12', icon: '🏙️', title: 'Jakarta city tour', detail: 'Monas + Old Town', color: '#E8F5E9' },
  { date: 'May 16', icon: '🛕', title: 'Yogyakarta arrival', detail: 'Borobudur at sunrise', color: '#FFF3E0' },
  { date: 'May 20', icon: '🌴', title: 'Bali arrival', detail: 'Villa Padi Ubud check-in', color: '#E8F5E9' },
  { date: 'May 28', icon: '🏖️', title: 'Lombok', detail: 'Gili Islands & beaches', color: '#F3E5F5' },
  { date: 'Jun 5', icon: '🏠', title: 'Fly home', detail: 'Lombok → Istanbul', color: '#FCE4EC' },
];

const CONFETTI_ITEMS = ['🎉', '🎊', '⭐', '🎈', '🌟', '💛', '🎉', '🎊', '⭐', '🎈', '🌟', '💛'];

export default function MemoriesRecapScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Memories</Text>
        <TouchableOpacity><Text style={{ fontSize: 22 }}>📤</Text></TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Celebratory hero */}
        <View style={styles.heroCard}>
          {/* Confetti */}
          {CONFETTI_ITEMS.map((item, index) => (
            <Text
              key={index}
              style={[
                styles.confetti,
                {
                  left: `${(index * 8.2) % 100}%`,
                  top: `${10 + (index * 7.3) % 60}%`,
                  fontSize: 14 + (index % 3) * 4,
                  transform: [{ rotate: `${(index * 30) % 360}deg` }],
                },
              ]}
            >
              {item}
            </Text>
          ))}

          {/* Sky and scene */}
          <View style={styles.heroScene}>
            <View style={styles.sky} />
            <View style={styles.ground} />
            <View style={[styles.hill, { left: -10, bottom: 0, backgroundColor: '#66BB6A' }]} />
            <View style={[styles.hill, { right: -10, bottom: 0, backgroundColor: '#81C784', width: 160 }]} />
            <View style={styles.mainEmoji}>
              <Text style={{ fontSize: 80 }}>🎉</Text>
            </View>
            <Text style={[styles.decor, { left: 16, bottom: 20 }]}>🌴</Text>
            <Text style={[styles.decor, { right: 16, bottom: 20 }]}>🌴</Text>
            <Text style={[styles.decor, { left: 52, top: 18 }]}>☁️</Text>
            <Text style={[styles.decor, { right: 56, top: 22 }]}>☀️</Text>
            <Sparkle color="#FFD700" size={14} style={{ position: 'absolute', left: 32, top: 36 }} />
            <Sparkle color="#FFD700" size={12} style={{ position: 'absolute', right: 40, top: 28 }} />
            <TravelStamp label="MEMORIES" color="#FF9800" style={{ position: 'absolute', bottom: 16, right: 16 }} />
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.congrats}>Trip Complete! 🥳</Text>
            <Text style={styles.tripName}>Java → Bali → Lombok</Text>
            <Text style={styles.tripDates}>May 9 – Jun 5, 2025</Text>
          </View>
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {STATS.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Spending recap */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleWrap}>
              <Text style={{ fontSize: 16, marginRight: 6 }}>💰</Text>
              <Text style={styles.sectionTitle}>Spending recap</Text>
            </View>
          </View>
          <View style={styles.spendCard}>
            <View style={styles.spendRow}>
              <View style={styles.spendLeft}>
                <Text style={styles.spendLabel}>Total budget</Text>
                <Text style={styles.spendAmount}>€2,000</Text>
              </View>
              <View style={styles.spendDivider} />
              <View style={styles.spendLeft}>
                <Text style={styles.spendLabel}>Total spent</Text>
                <Text style={[styles.spendAmount, { color: '#4CAF50' }]}>€1,240</Text>
              </View>
              <View style={styles.spendDivider} />
              <View style={styles.spendLeft}>
                <Text style={styles.spendLabel}>Saved!</Text>
                <Text style={[styles.spendAmount, { color: '#FF9800' }]}>€760</Text>
              </View>
            </View>
            <View style={styles.budgetBarBg}>
              <View style={[styles.budgetBarFill, { width: '62%' }]} />
            </View>
            <Text style={styles.budgetBarLabel}>62% of budget used — Great job! 🎯</Text>
          </View>
        </View>

        {/* Favorite destination */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleWrap}>
              <Sparkle color="#FFD700" size={12} style={{ position: 'relative', marginRight: 4 }} />
              <Text style={styles.sectionTitle}>Favorite destination</Text>
            </View>
          </View>
          <View style={styles.favoriteCard}>
            <Text style={styles.favoriteEmoji}>🌴</Text>
            <View style={styles.favoriteInfo}>
              <Text style={styles.favoriteName}>Bali</Text>
              <Text style={styles.favoriteDetail}>8 nights · 14 activities · €580 spent</Text>
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Text key={s} style={styles.star}>⭐</Text>
                ))}
              </View>
            </View>
            <TravelStamp label="FAV" color="#FF9800" style={{ position: 'relative' }} />
          </View>
        </View>

        {/* Trip timeline */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleWrap}>
              <Cloud size={16} style={{ position: 'relative', marginRight: 4 }} />
              <Text style={styles.sectionTitle}>Trip timeline</Text>
            </View>
          </View>
          <View style={styles.card}>
            {TIMELINE.map((item, index) => (
              <View key={item.date}>
                <View style={[styles.timelineRow, { backgroundColor: item.color }]}>
                  <View style={styles.timelineDateCol}>
                    <Text style={styles.timelineDate}>{item.date}</Text>
                    {index < TIMELINE.length - 1 && <View style={styles.timelineConnector} />}
                  </View>
                  <View style={styles.timelineIconBg}>
                    <Text style={{ fontSize: 22 }}>{item.icon}</Text>
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>{item.title}</Text>
                    <Text style={styles.timelineDetail}>{item.detail}</Text>
                  </View>
                </View>
                {index < TIMELINE.length - 1 && (
                  <View style={styles.timelineDivider}>
                    <DottedLine color="#E0E0E0" />
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Share button */}
        <TouchableOpacity style={styles.shareBtn}>
          <Text style={{ fontSize: 18 }}>📤</Text>
          <Text style={styles.shareBtnText}>Share your travel story</Text>
        </TouchableOpacity>

        {/* Footer */}
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
  scroll: { flex: 1 },

  heroCard: {
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 0,
  },
  confetti: { position: 'absolute', zIndex: 10 },
  heroScene: { height: 200, position: 'relative', overflow: 'hidden' },
  sky: { ...StyleSheet.absoluteFillObject, backgroundColor: '#87CEEB' },
  ground: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, backgroundColor: '#A5D6A7' },
  hill: { position: 'absolute', width: 140, height: 80, borderRadius: 70, bottom: 0 },
  mainEmoji: { position: 'absolute', bottom: 20, left: 0, right: 0, alignItems: 'center' },
  decor: { position: 'absolute', fontSize: 26 },
  heroContent: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  congrats: { fontSize: 26, fontWeight: '900', color: '#1A1A1A', marginBottom: 4 },
  tripName: { fontSize: 16, fontWeight: '700', color: '#444', marginBottom: 4 },
  tripDates: { fontSize: 13, color: '#888' },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    width: '31%',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '900', color: '#1A1A1A' },
  statLabel: { fontSize: 10, color: '#888', marginTop: 2, textAlign: 'center' },

  section: { paddingHorizontal: 16, marginBottom: 8 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitleWrap: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },

  spendCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  spendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  spendLeft: { flex: 1, alignItems: 'center' },
  spendLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  spendAmount: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  spendDivider: { width: 1, height: 40, backgroundColor: '#F0F0F0' },
  budgetBarBg: { height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  budgetBarFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 4 },
  budgetBarLabel: { fontSize: 12, color: '#4CAF50', fontWeight: '600', textAlign: 'center' },

  favoriteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFF8E1',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  favoriteEmoji: { fontSize: 48 },
  favoriteInfo: { flex: 1 },
  favoriteName: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  favoriteDetail: { fontSize: 12, color: '#666', marginTop: 4 },
  starRow: { flexDirection: 'row', marginTop: 6, gap: 2 },
  star: { fontSize: 14 },

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
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginVertical: 2,
  },
  timelineDateCol: { width: 46, alignItems: 'center', paddingTop: 4 },
  timelineDate: { fontSize: 11, fontWeight: '700', color: '#555', textAlign: 'center' },
  timelineConnector: { width: 2, height: 20, backgroundColor: '#E0E0E0', marginTop: 4 },
  timelineIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  timelineContent: { flex: 1, paddingTop: 4 },
  timelineTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  timelineDetail: { fontSize: 12, color: '#888', marginTop: 2 },
  timelineDivider: { paddingVertical: 4, paddingLeft: 14 },

  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#4CAF50',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  shareBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  footerDecor: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
});
