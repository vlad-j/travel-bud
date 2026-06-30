import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export interface WhatsNextItem {
  icon: string;
  label: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  accentColor: string;
  progressPercent?: number; // only used for budget card
}

interface Props {
  items: WhatsNextItem[];
}

export default function WhatsNextRow({ items }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {items.map((item, i) => (
        <TouchableOpacity
          key={i}
          style={styles.card}
          onPress={item.onPress}
          activeOpacity={0.85}
        >
          <View style={styles.topRow}>
            <Text style={styles.icon}>{item.icon}</Text>
            <Text style={styles.label} numberOfLines={1}>{item.label}</Text>
          </View>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{item.subtitle}</Text>
          {item.progressPercent !== undefined && (
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(item.progressPercent, 100)}%`, backgroundColor: item.accentColor },
                ]}
              />
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 16, gap: 10, paddingVertical: 4 },
  card: {
    width: 150, backgroundColor: '#fff', borderRadius: 18, padding: 12,
    borderWidth: 1, borderColor: '#F3EFEA',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  icon: { fontSize: 14 },
  label: { fontSize: 11, fontWeight: '700', color: '#8A817A', flex: 1 },
  title: { fontSize: 14, fontWeight: '900', color: '#1A1A1A' },
  subtitle: { fontSize: 11, color: '#8A817A', fontWeight: '600', marginTop: 2 },
  progressTrack: { height: 4, borderRadius: 2, backgroundColor: '#F2ECE6', marginTop: 8, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
});
