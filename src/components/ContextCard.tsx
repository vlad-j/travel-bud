import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { ContextCard as ContextCardType } from '../lib/contextCardProvider';

interface Props {
  card: ContextCardType;
  currency?: string;
  onAction?: (screen: string, params?: Record<string, any>) => void;
}

const URGENCY_COLORS = {
  high: { bg: '#FFF3E0', border: '#FFB74D', text: '#E65100' },
  medium: { bg: '#E8F5E9', border: '#81C784', text: '#2E7D32' },
  low: { bg: '#F3E5F5', border: '#CE93D8', text: '#6A1B9A' },
};

export default function ContextCard({ card, currency, onAction }: Props) {
  if (!card) return null;

  const colors = URGENCY_COLORS[card.urgency];

  // Inject currency into budget title if needed
  const title = currency && card.type === 'budget_warning'
    ? card.title.replace(/\s+$/, ` ${currency}`)
    : card.title;

  return (
    <View style={[styles.card, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <View style={styles.cardLeft}>
        <Text style={styles.emoji}>{card.emoji}</Text>
        <View style={styles.textWrap}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {card.subtitle}
          </Text>
        </View>
      </View>

      {card.action && onAction && (
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: colors.border }]}
          onPress={() => onAction(card.action!.screen, card.action!.params)}
          activeOpacity={0.75}
        >
          <Text style={[styles.actionText, { color: colors.text }]}>
            {card.action.label}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  emoji: { fontSize: 24, flexShrink: 0 },
  textWrap: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  subtitle: { fontSize: 12, color: '#666', lineHeight: 16 },
  actionBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexShrink: 0,
  },
  actionText: { fontSize: 12, fontWeight: '700' },
});
