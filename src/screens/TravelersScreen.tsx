import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Sparkle, Cloud, Dot, TravelStamp } from '../components/TravelDecorations';
import CartoonIcon from '../components/CartoonIcon';

const TRAVELERS_DATA = [
  {
    name: 'Vlad',
    emoji: '👨',
    avatarBg: '#FFF9C4',
    avatarBorder: '#FFD600',
    totalPaid: 820,
    share: 620,
    balance: 200,
    owes: false,
  },
  {
    name: 'Raul',
    emoji: '🧑',
    avatarBg: '#E3F2FD',
    avatarBorder: '#42A5F5',
    totalPaid: 420,
    share: 620,
    balance: -200,
    owes: true,
  },
];

const EXPENSES_LIST = [
  { id: '1', name: 'Lunch at Jejamuran', amount: 12, paidBy: 'Vlad', category: '🍜', iconBg: '#FFF3E0', date: 'Today', settled: false },
  { id: '2', name: 'Borobudur Tickets', amount: 50, paidBy: 'Vlad', category: '🛕', iconBg: '#E8F5E9', date: 'Today', settled: false },
  { id: '3', name: 'Taxi to Temple', amount: 8, paidBy: 'Raul', category: '🚗', iconBg: '#E3F2FD', date: 'Today', settled: false },
  { id: '4', name: 'Hotel Yogyakarta', amount: 65, paidBy: 'Vlad', category: '🏨', iconBg: '#EDE7F6', date: 'Yesterday', settled: true },
  { id: '5', name: 'Prambanan Tickets', amount: 40, paidBy: 'Raul', category: '🛕', iconBg: '#E8F5E9', date: 'Yesterday', settled: true },
  { id: '6', name: 'Turkish Airlines', amount: 340, paidBy: 'Vlad', category: '✈️', iconBg: '#F3E5F5', date: 'May 9', settled: true },
];

const TABS = ['Summary', 'Expenses'];

export default function TravelersScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('Summary');

  const pendingExpenses = EXPENSES_LIST.filter((e) => !e.settled);
  const settledExpenses = EXPENSES_LIST.filter((e) => e.settled);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Travelers</Text>
        <TouchableOpacity><Text style={{ fontSize: 22 }}>⋯</Text></TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {activeTab === 'Summary' && (
          <>
            {/* Balance banner */}
            <View style={styles.balanceBanner}>
              <Sparkle color="#FF9800" size={12} style={{ position: 'relative', marginRight: 6 }} />
              <View style={styles.balanceCenter}>
                <Text style={styles.balanceLabel}>Raul owes Vlad</Text>
                <Text style={styles.balanceAmount}>€200 💛</Text>
              </View>
              <Sparkle color="#FF9800" size={12} style={{ position: 'relative', marginLeft: 6 }} />
            </View>

            {/* Traveler cards */}
            {TRAVELERS_DATA.map((traveler) => (
              <View key={traveler.name} style={[styles.travelerCard, { borderColor: traveler.avatarBorder + '44' }]}>
                <View style={styles.travelerTop}>
                  <View style={[styles.travelerAvatar, { backgroundColor: traveler.avatarBg, borderColor: traveler.avatarBorder }]}>
                    <Text style={{ fontSize: 28 }}>{traveler.emoji}</Text>
                  </View>
                  <View style={styles.travelerInfo}>
                    <Text style={styles.travelerName}>{traveler.name}</Text>
                    <Text style={styles.travelerSub}>
                      {traveler.owes ? `Owes €${Math.abs(traveler.balance)}` : `Is owed €${traveler.balance}`}
                    </Text>
                  </View>
                  <View style={[styles.balanceBadge, { backgroundColor: traveler.owes ? '#FFEBEE' : '#E8F5E9' }]}>
                    <Text style={[styles.balanceBadgeText, { color: traveler.owes ? '#F44336' : '#4CAF50' }]}>
                      {traveler.owes ? `-€${Math.abs(traveler.balance)}` : `+€${traveler.balance}`}
                    </Text>
                  </View>
                </View>
                <View style={styles.travelerStats}>
                  <View style={styles.travelerStat}>
                    <Text style={styles.travelerStatValue}>€{traveler.totalPaid}</Text>
                    <Text style={styles.travelerStatLabel}>Total paid</Text>
                  </View>
                  <View style={styles.travelerStatDivider} />
                  <View style={styles.travelerStat}>
                    <Text style={styles.travelerStatValue}>€{traveler.share}</Text>
                    <Text style={styles.travelerStatLabel}>Fair share</Text>
                  </View>
                  <View style={styles.travelerStatDivider} />
                  <View style={styles.travelerStat}>
                    <Text style={[styles.travelerStatValue, { color: traveler.owes ? '#F44336' : '#4CAF50' }]}>
                      {traveler.owes ? `-€${Math.abs(traveler.balance)}` : `+€${traveler.balance}`}
                    </Text>
                    <Text style={styles.travelerStatLabel}>Balance</Text>
                  </View>
                </View>
              </View>
            ))}

            {/* Category breakdown */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleWrap}>
                  <Cloud size={16} style={{ position: 'relative', marginRight: 4 }} />
                  <Text style={styles.sectionTitle}>Spending by category</Text>
                </View>
              </View>
              <View style={styles.card}>
                {[
                  { icon: '🍽️', name: 'Food', vlad: 250, raul: 170, color: '#FF9800' },
                  { icon: '🚗', name: 'Transport', vlad: 200, raul: 120, color: '#2196F3' },
                  { icon: '🏡', name: 'Accommodation', vlad: 280, raul: 100, color: '#9C27B0' },
                  { icon: '🎯', name: 'Activities', vlad: 60, raul: 30, color: '#4CAF50' },
                ].map((cat, index, arr) => (
                  <View key={cat.name}>
                    <View style={styles.catRow}>
                      <CartoonIcon emoji={cat.icon} bg={`${cat.color}22`} size={36} />
                      <View style={styles.catInfo}>
                        <Text style={styles.catName}>{cat.name}</Text>
                        <View style={styles.catBarRow}>
                          <View style={[styles.catBar, { width: `${(cat.vlad / 280) * 50}%`, backgroundColor: '#FFD600' }]} />
                          <View style={[styles.catBar, { width: `${(cat.raul / 280) * 50}%`, backgroundColor: '#42A5F5', marginLeft: 2 }]} />
                        </View>
                      </View>
                      <View>
                        <Text style={styles.catTotal}>€{cat.vlad + cat.raul}</Text>
                        <Text style={styles.catSplit}>V:€{cat.vlad} R:€{cat.raul}</Text>
                      </View>
                    </View>
                    {index < arr.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            </View>

            {/* Settle up button */}
            <TouchableOpacity style={styles.settleBtn}>
              <Text style={{ fontSize: 18 }}>💸</Text>
              <Text style={styles.settleBtnText}>Settle up — Raul pays €200</Text>
            </TouchableOpacity>
          </>
        )}

        {activeTab === 'Expenses' && (
          <>
            {/* Pending */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleWrap}>
                  <Sparkle color="#FF9800" size={12} style={{ position: 'relative', marginRight: 4 }} />
                  <Text style={styles.sectionTitle}>Pending</Text>
                </View>
                <TravelStamp label={`${pendingExpenses.length} items`} color="#FF9800" style={{ position: 'relative' }} />
              </View>
              <View style={styles.card}>
                {pendingExpenses.map((expense, index) => (
                  <View key={expense.id}>
                    <View style={styles.expenseRow}>
                      <CartoonIcon emoji={expense.category} bg={expense.iconBg} size={40} />
                      <View style={styles.expenseInfo}>
                        <Text style={styles.expenseName}>{expense.name}</Text>
                        <Text style={styles.expenseMeta}>{expense.date} · by {expense.paidBy}</Text>
                      </View>
                      <Text style={styles.expenseAmount}>€{expense.amount}</Text>
                    </View>
                    {index < pendingExpenses.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            </View>

            {/* Settled */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleWrap}>
                  <Text style={{ fontSize: 14, marginRight: 6 }}>✅</Text>
                  <Text style={[styles.sectionTitle, { color: '#888' }]}>Settled</Text>
                </View>
              </View>
              <View style={styles.card}>
                {settledExpenses.map((expense, index) => (
                  <View key={expense.id}>
                    <View style={[styles.expenseRow, { opacity: 0.6 }]}>
                      <CartoonIcon emoji={expense.category} bg={expense.iconBg} size={40} />
                      <View style={styles.expenseInfo}>
                        <Text style={[styles.expenseName, { textDecorationLine: 'line-through' }]}>{expense.name}</Text>
                        <Text style={styles.expenseMeta}>{expense.date} · by {expense.paidBy}</Text>
                      </View>
                      <Text style={[styles.expenseAmount, { color: '#888' }]}>€{expense.amount}</Text>
                    </View>
                    {index < settledExpenses.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            </View>
          </>
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

  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tab: { paddingHorizontal: 24, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F0F0F0' },
  tabActive: { backgroundColor: '#4CAF50' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#666' },
  tabTextActive: { color: '#fff' },

  scroll: { flex: 1, padding: 16 },

  balanceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8E1',
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  balanceCenter: { alignItems: 'center' },
  balanceLabel: { fontSize: 13, color: '#888', fontWeight: '600' },
  balanceAmount: { fontSize: 22, fontWeight: '900', color: '#FF9800', marginTop: 2 },

  travelerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  travelerTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  travelerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  travelerInfo: { flex: 1 },
  travelerName: { fontSize: 17, fontWeight: '800', color: '#1A1A1A' },
  travelerSub: { fontSize: 12, color: '#888', marginTop: 2 },
  balanceBadge: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  balanceBadgeText: { fontSize: 14, fontWeight: '800' },

  travelerStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  travelerStat: { flex: 1, alignItems: 'center' },
  travelerStatValue: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  travelerStatLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  travelerStatDivider: { width: 1, backgroundColor: '#F0F0F0' },

  section: { marginBottom: 8 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitleWrap: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },

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

  catRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  catInfo: { flex: 1 },
  catName: { fontSize: 13, fontWeight: '600', color: '#1A1A1A', marginBottom: 6 },
  catBarRow: { flexDirection: 'row', height: 6 },
  catBar: { height: 6, borderRadius: 3 },
  catTotal: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', textAlign: 'right' },
  catSplit: { fontSize: 11, color: '#888', textAlign: 'right', marginTop: 2 },

  settleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 16,
    shadowColor: '#4CAF50',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  settleBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  expenseRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  expenseInfo: { flex: 1 },
  expenseName: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  expenseMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  expenseAmount: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },

  footerDecor: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
});
