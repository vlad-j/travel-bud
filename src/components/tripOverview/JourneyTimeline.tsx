import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import JourneyCard, { JourneyCardData } from './JourneyCard';

export type TransportMode = 'flight' | 'train' | 'bus' | 'boat' | 'car' | 'walk';

const TRANSPORT_ICONS: Record<TransportMode, string> = {
  flight: '✈️',
  train: '🚆',
  bus: '🚌',
  boat: '🚢',
  car: '🚗',
  walk: '🚶',
};

export interface TimelineItem {
  card: JourneyCardData;
  transportMode: TransportMode;
  accentColor: string;
  cardBg: string;
}

interface Props {
  items: TimelineItem[];
  onCardPress: (destinationId: string) => void;
}

export default function JourneyTimeline({ items, onCardPress }: Props) {
  return (
    <View style={styles.wrap}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <View key={item.card.id} style={styles.row}>
            <View style={styles.timelineCol}>
              <View style={[styles.iconCircle, { backgroundColor: item.accentColor }]}>
                <Text style={styles.iconEmoji}>{TRANSPORT_ICONS[item.transportMode]}</Text>
              </View>
              {!isLast && <View style={[styles.line, { backgroundColor: `${item.accentColor}55` }]} />}
            </View>

            <View style={styles.cardCol}>
              <JourneyCard
                data={item.card}
                accentColor={item.accentColor}
                cardBg={item.cardBg}
                onPress={() => onCardPress(item.card.id)}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16 },
  row: { flexDirection: 'row' },
  timelineCol: { width: 36, alignItems: 'center' },
  iconCircle: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 18,
  },
  iconEmoji: { fontSize: 15 },
  line: { width: 2, flex: 1, marginTop: 4, marginBottom: 4 },
  cardCol: { flex: 1, marginLeft: 8 },
});
