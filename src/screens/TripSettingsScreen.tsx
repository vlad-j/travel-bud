import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Sparkle, Dot } from '../components/TravelDecorations';

function SectionBlock({ title, headerColor, textColor, icon, children }: {
  title: string; headerColor: string; textColor: string; icon: string; children: React.ReactNode;
}) {
  return (
    <View style={[styles.sectionBlock, { backgroundColor: headerColor, borderColor: headerColor }]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleWrap}>
          <Text style={{ fontSize: 14, marginRight: 6 }}>{icon}</Text>
          <Text style={[styles.sectionTitle, { color: textColor }]}>{title}</Text>
        </View>
      </View>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

export default function TripSettingsScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const [notifFlight, setNotifFlight] = useState(true);
  const [notifCheckin, setNotifCheckin] = useState(true);
  const [notifBudget, setNotifBudget] = useState(true);
  const [notifPartner, setNotifPartner] = useState(true);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Trip Settings</Text>
        <TouchableOpacity><Text style={styles.saveBtn}>Save</Text></TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <SectionBlock title="TRIP DETAILS" headerColor="#FFE082" textColor="#E65100" icon="✏️">
          <SettingsRow icon="✏️" label="Trip name" value="Java → Bali → Lombok" tappable />
          <View style={styles.divider} />
          <SettingsRow icon="📅" label="Start date" value="May 9, 2025" tappable />
          <View style={styles.divider} />
          <SettingsRow icon="📅" label="End date" value="Jun 5, 2025" tappable />
          <View style={styles.divider} />
          <SettingsRow icon="💶" label="Currency" value="EUR (€)" tappable />
          <View style={styles.divider} />
          <SettingsRow icon="🏦" label="Budget" value="€2,000" tappable />
        </SectionBlock>

        <SectionBlock title="TRAVELERS" headerColor="#B39DDB" textColor="#311B92" icon="👥">
          <View style={styles.travelerRow}>
            <View style={[styles.travelerAvatar, { backgroundColor: '#FFF9C4', borderColor: '#FFD600' }]}>
              <Text style={{ fontSize: 20 }}>👨</Text>
            </View>
            <View style={styles.travelerInfo}>
              <Text style={styles.travelerName}>Vlad Popescu</Text>
              <Text style={styles.travelerRole}>Trip owner</Text>
            </View>
            <View style={styles.ownerBadge}><Text style={styles.ownerBadgeText}>OWNER</Text></View>
          </View>
          <View style={styles.divider} />
          <View style={styles.travelerRow}>
            <View style={[styles.travelerAvatar, { backgroundColor: '#E3F2FD', borderColor: '#42A5F5' }]}>
              <Text style={{ fontSize: 20 }}>🧑</Text>
            </View>
            <View style={styles.travelerInfo}>
              <Text style={styles.travelerName}>Raul Ionescu</Text>
              <Text style={styles.travelerRole}>Co-traveler</Text>
            </View>
            <TouchableOpacity style={styles.removeBtn}><Text style={styles.removeBtnText}>Remove</Text></TouchableOpacity>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.addTravelerRow}>
            <View style={styles.addIcon}><Text style={{ fontSize: 20, color: '#4CAF50' }}>＋</Text></View>
            <Text style={styles.addTravelerText}>Invite traveler</Text>
          </TouchableOpacity>
        </SectionBlock>

        <SectionBlock title="NOTIFICATIONS" headerColor="#90CAF9" textColor="#0D47A1" icon="🔔">
          <NotifRow icon="✈️" label="Flight reminders" value={notifFlight} onToggle={setNotifFlight} />
          <View style={styles.divider} />
          <NotifRow icon="🏨" label="Check-in reminders" value={notifCheckin} onToggle={setNotifCheckin} />
          <View style={styles.divider} />
          <NotifRow icon="💰" label="Budget alerts" value={notifBudget} onToggle={setNotifBudget} />
          <View style={styles.divider} />
          <NotifRow icon="👥" label="Partner activity" value={notifPartner} onToggle={setNotifPartner} />
        </SectionBlock>

        <SectionBlock title="ACTIONS" headerColor="#A5D6A7" textColor="#1B5E20" icon="⚙️">
          <SettingsRow icon="📤" label="Export trip" tappable />
          <View style={styles.divider} />
          <SettingsRow icon="🔗" label="Share trip" tappable />
          <View style={styles.divider} />
          <SettingsRow icon="📋" label="Duplicate trip" tappable />
        </SectionBlock>

        <TouchableOpacity style={styles.deleteCard}>
          <Text style={{ fontSize: 20 }}>🗑️</Text>
          <View style={styles.deleteInfo}>
            <Text style={styles.deleteTitle}>Delete trip</Text>
            <Text style={styles.deleteSubtitle}>This action cannot be undone</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <View style={styles.footerDecor}>
          <Dot color="#BBB" size={5} style={{ position: 'relative' }} />
          <Dot color="#BBB" size={4} style={{ position: 'relative', marginLeft: 8 }} />
          <Sparkle color="#FF9800" size={10} style={{ position: 'relative', marginLeft: 6 }} />
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsRow({ icon, label, value, tappable }: { icon: string; label: string; value?: string; tappable?: boolean }) {
  return (
    <TouchableOpacity style={styles.settingsRow} activeOpacity={tappable ? 0.7 : 1}>
      <Text style={styles.settingsIcon}>{icon}</Text>
      <View style={styles.settingsContent}>
        <Text style={styles.settingsLabel}>{label}</Text>
        {value ? <Text style={styles.settingsValue}>{value}</Text> : null}
      </View>
      {tappable && <Text style={styles.chevron}>›</Text>}
    </TouchableOpacity>
  );
}

function NotifRow({ icon, label, value, onToggle }: { icon: string; label: string; value: boolean; onToggle: (v: boolean) => void }) {
  return (
    <View style={styles.settingsRow}>
      <Text style={styles.settingsIcon}>{icon}</Text>
      <Text style={[styles.settingsLabel, { flex: 1 }]}>{label}</Text>
      <Switch value={value} onValueChange={onToggle} trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }} thumbColor={value ? '#4CAF50' : '#f4f3f4'} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#E8E8E8' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  backBtn: { padding: 4 },
  backIcon: { fontSize: 28, color: '#1A1A1A', fontWeight: '300' },
  title: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  saveBtn: { fontSize: 15, fontWeight: '700', color: '#4CAF50' },
  scroll: { flex: 1, padding: 16 },

  sectionBlock: { marginBottom: 14, borderRadius: 20, overflow: 'hidden', borderWidth: 3 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 24 },
  sectionTitleWrap: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  sectionCard: { backgroundColor: '#fff', borderRadius: 16, margin: 4, marginTop: -16, paddingHorizontal: 10, paddingVertical: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: -2 }, elevation: 3 },

  divider: { height: 1, backgroundColor: '#F5F5F5' },

  settingsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  settingsIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  settingsContent: { flex: 1 },
  settingsLabel: { fontSize: 15, color: '#1A1A1A', fontWeight: '500' },
  settingsValue: { fontSize: 13, color: '#888', marginTop: 2 },
  chevron: { fontSize: 22, color: '#CCC', fontWeight: '300' },

  travelerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  travelerAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  travelerInfo: { flex: 1 },
  travelerName: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  travelerRole: { fontSize: 12, color: '#888', marginTop: 2 },
  ownerBadge: { backgroundColor: '#E8F5E9', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  ownerBadgeText: { fontSize: 11, fontWeight: '800', color: '#4CAF50' },
  removeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#FFCDD2' },
  removeBtnText: { fontSize: 12, fontWeight: '600', color: '#F44336' },
  addTravelerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  addIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#A5D6A7', borderStyle: 'dashed' },
  addTravelerText: { fontSize: 14, fontWeight: '600', color: '#4CAF50' },

  deleteCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFF5F5', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1.5, borderColor: '#FFCDD2' },
  deleteInfo: { flex: 1 },
  deleteTitle: { fontSize: 15, fontWeight: '700', color: '#F44336' },
  deleteSubtitle: { fontSize: 12, color: '#888', marginTop: 2 },

  footerDecor: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
});
