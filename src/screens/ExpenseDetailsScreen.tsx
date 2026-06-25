import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Sparkle, Dot, TravelStamp } from '../components/TravelDecorations';
import CartoonIcon from '../components/CartoonIcon';

const EXPENSE = {
  name: 'Lunch at Jejamuran',
  amount: 12,
  currency: '€',
  category: 'Food',
  categoryIcon: '🍜',
  categoryIconBg: '#FFF3E0',
  date: 'Today, May 16',
  time: '13:30',
  location: 'Yogyakarta',
  paidBy: 'Vlad',
  notes: 'Amazing mushroom noodles — best in Yogyakarta! 🤤 Definitely coming back.',
  receiptUrl: 'https://images.pexels.com/photos/1907228/pexels-photo-1907228.jpeg?auto=compress&cs=tinysrgb&w=400',
  relatedActivity: {
    title: 'Lunch at Jejamuran',
    time: '13:30',
    icon: '🍜',
    iconBg: '#FFF3E0',
    status: 'NOW',
  },
};

const TRAVELERS = [
  { name: 'Vlad', avatar: '👨', share: 6, emoji: '👨' },
  { name: 'Raul', avatar: '🧑', share: 6, emoji: '🧑' },
];

export default function ExpenseDetailsScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Expense Details</Text>
        <TouchableOpacity>
          <Text style={{ fontSize: 22 }}>✏️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero amount card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <CartoonIcon emoji={EXPENSE.categoryIcon} bg={EXPENSE.categoryIconBg} size={64} />
            <TravelStamp label="FOOD" color="#FF9800" style={{ position: 'relative', marginLeft: 'auto' }} />
          </View>
          <Text style={styles.expenseName}>{EXPENSE.name}</Text>
          <Text style={styles.expenseAmount}>
            {EXPENSE.currency}{EXPENSE.amount}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Text style={{ fontSize: 14 }}>📅</Text>
              <Text style={styles.metaText}>{EXPENSE.date}</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={{ fontSize: 14 }}>🕐</Text>
              <Text style={styles.metaText}>{EXPENSE.time}</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={{ fontSize: 14 }}>📍</Text>
              <Text style={styles.metaText}>{EXPENSE.location}</Text>
            </View>
          </View>
        </View>

        {/* Paid by */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Paid by</Text>
          <View style={styles.paidByRow}>
            <View style={styles.avatar}>
              <Text style={{ fontSize: 22 }}>👨</Text>
            </View>
            <View>
              <Text style={styles.paidByName}>Vlad</Text>
              <Text style={styles.paidByDetail}>Paid the full amount</Text>
            </View>
            <View style={styles.paidBadge}>
              <Text style={styles.paidBadgeText}>PAID</Text>
            </View>
          </View>
        </View>

        {/* Split */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardLabel}>Split between</Text>
            <Text style={styles.splitInfo}>50/50</Text>
          </View>
          {TRAVELERS.map((t, index) => (
            <View key={t.name}>
              <View style={styles.splitRow}>
                <View style={styles.splitAvatar}>
                  <Text style={{ fontSize: 20 }}>{t.emoji}</Text>
                </View>
                <View style={styles.splitInfo2}>
                  <Text style={styles.splitName}>{t.name}</Text>
                  <Text style={styles.splitOwes}>
                    {t.name === EXPENSE.paidBy ? 'Paid for both' : `Owes ${EXPENSE.currency}${t.share}`}
                  </Text>
                </View>
                <Text style={[styles.splitAmount, t.name !== EXPENSE.paidBy && { color: '#FF5252' }]}>
                  {t.name === EXPENSE.paidBy ? `+${EXPENSE.currency}${t.share}` : `-${EXPENSE.currency}${t.share}`}
                </Text>
              </View>
              {index < TRAVELERS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Notes */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Notes</Text>
          <View style={styles.notesBox}>
            <Text style={styles.notesText}>{EXPENSE.notes}</Text>
          </View>
        </View>

        {/* Receipt photo */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Receipt</Text>
          <TouchableOpacity activeOpacity={0.85} style={styles.receiptWrapper}>
            <Image
              source={{ uri: EXPENSE.receiptUrl }}
              style={styles.receiptImage}
              resizeMode="cover"
            />
            <View style={styles.receiptOverlay}>
              <Text style={styles.receiptOverlayText}>🔍 View full</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Related activity */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Related activity</Text>
          <View style={styles.relatedRow}>
            <CartoonIcon
              emoji={EXPENSE.relatedActivity.icon}
              bg={EXPENSE.relatedActivity.iconBg}
              size={44}
            />
            <View style={styles.relatedInfo}>
              <Text style={styles.relatedTitle}>{EXPENSE.relatedActivity.title}</Text>
              <Text style={styles.relatedTime}>{EXPENSE.relatedActivity.time}</Text>
            </View>
            <View style={styles.nowBadge}>
              <Text style={styles.nowBadgeText}>NOW</Text>
            </View>
          </View>
        </View>

        {/* Delete button */}
        <TouchableOpacity style={styles.deleteButton}>
          <Text style={styles.deleteText}>🗑 Delete expense</Text>
        </TouchableOpacity>

        {/* Decorative footer */}
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

  scroll: { flex: 1, padding: 16 },

  heroCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFE082',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  expenseName: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 6 },
  expenseAmount: { fontSize: 48, fontWeight: '900', color: '#FF9800', marginBottom: 14 },
  metaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  metaText: { fontSize: 12, fontWeight: '600', color: '#555' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardLabel: { fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 12, letterSpacing: 0.5 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  splitInfo: { fontSize: 13, fontWeight: '700', color: '#4CAF50' },
  divider: { height: 1, backgroundColor: '#F5F5F5' },

  paidByRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF9C4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFD600',
  },
  paidByName: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  paidByDetail: { fontSize: 12, color: '#888', marginTop: 2 },
  paidBadge: {
    marginLeft: 'auto',
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  paidBadgeText: { fontSize: 11, fontWeight: '800', color: '#4CAF50' },

  splitRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  splitAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitInfo2: { flex: 1 },
  splitName: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  splitOwes: { fontSize: 12, color: '#888', marginTop: 2 },
  splitAmount: { fontSize: 16, fontWeight: '800', color: '#4CAF50' },

  notesBox: {
    backgroundColor: '#FFFDE7',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FFF9C4',
  },
  notesText: { fontSize: 14, color: '#444', lineHeight: 21 },

  receiptWrapper: {
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  receiptImage: { width: '100%', height: '100%' },
  receiptOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingVertical: 10,
    alignItems: 'center',
  },
  receiptOverlayText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  relatedRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  relatedInfo: { flex: 1 },
  relatedTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  relatedTime: { fontSize: 12, color: '#888', marginTop: 2 },
  nowBadge: { backgroundColor: '#FF9800', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  nowBadgeText: { fontSize: 11, fontWeight: '800', color: '#fff' },

  deleteButton: {
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FFCDD2',
    backgroundColor: '#FFF5F5',
  },
  deleteText: { fontSize: 14, fontWeight: '600', color: '#F44336' },

  footerDecor: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
});
