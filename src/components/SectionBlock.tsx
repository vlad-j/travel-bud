import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SectionBlock({ title, headerColor, textColor, icon, children }: any) {
  return (
    <View style={[styles.sectionBlock, { backgroundColor: headerColor, borderColor: headerColor }]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleWrap}>
          <Text style={{ fontSize: 14, marginRight: 6 }}>{icon}</Text>
          <Text style={[styles.sectionTitle, { color: textColor }]}>{title}</Text>
        </View>
      </View>
      <View style={styles.sectionCard} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionBlock: { marginBottom: 16, borderRadius: 20, overflow: 'hidden', borderWidth: 3 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 24 },
  sectionTitleWrap: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  sectionCard: { backgroundColor: '#fff', borderRadius: 16, margin: 4, marginTop: -16, paddingHorizontal: 10, paddingVertical: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: -2 }, elevation: 3 },
});