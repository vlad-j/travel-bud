import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ActivityStatus } from '../data/sampleData';

interface Props {
  status: ActivityStatus | 'COMPLETED';
  small?: boolean;
}

const BADGE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  DONE: { bg: '#4CAF50', text: '#fff', label: 'DONE' },
  NOW: { bg: '#FF9800', text: '#fff', label: 'NOW' },
  UPCOMING: { bg: '#EDE7F6', text: '#9C27B0', label: 'UPCOMING' },
  COMPLETED: { bg: '#4CAF50', text: '#fff', label: 'COMPLETED' },
};

export default function StatusBadge({ status, small }: Props) {
  const config = BADGE_COLORS[status] ?? BADGE_COLORS.UPCOMING;
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, small && styles.small]}>
      <Text style={[styles.text, { color: config.text }, small && styles.smallText]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  small: {
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  smallText: {
    fontSize: 10,
  },
});
