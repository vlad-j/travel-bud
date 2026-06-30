import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

// ─── Category emoji mapping (reused convention from rest of app) ──────────────
const CATEGORY_EMOJI: Record<string, string> = {
  food: '🍜',
  transport: '🚗',
  accommodation: '🏡',
  activity: '🎯',
  flight: '✈️',
  hotel_checkin: '🏨',
  hotel_checkout: '🧳',
  shopping: '🛍️',
  other: '📍',
};

export interface JourneyCardData {
  id: string;
  index: number;
  name: string;
  country: string | null;
  arrivalDate: string | null; // ISO yyyy-mm-dd
  departureDate: string | null;
  nights: number | null;
  accommodation: { name: string; checkIn: string | null } | null;
  highlightCategories: string[]; // already deduped/capped upstream
  extraHighlightsCount: number;
  status: 'current' | 'next' | 'completed' | 'upcoming';
  heroImage: any | null; // require(...) result or null for placeholder
}

function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch { return dateStr; }
}

function formatTime(timeStr: string | null): string {
  if (!timeStr) return '—';
  try {
    if (timeStr.includes('T')) {
      return new Date(timeStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }
    return timeStr.slice(0, 5);
  } catch { return timeStr; }
}

interface Props {
  data: JourneyCardData;
  accentColor: string;
  cardBg: string;
  onPress: () => void;
}

export default function JourneyCard({ data, accentColor, cardBg, onPress }: Props) {
  const dateRange = data.arrivalDate && data.departureDate
    ? `${formatDateShort(data.arrivalDate)} – ${formatDateShort(data.departureDate)}`
    : '—';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: cardBg }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.row}>
        {/* Hero image / placeholder */}
        <View style={styles.imageWrap}>
          {data.heroImage ? (
            <Image source={data.heroImage} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: `${accentColor}22` }]}>
              <Text style={styles.imagePlaceholderEmoji}>🗺️</Text>
            </View>
          )}
        </View>

        <View style={styles.infoCol}>
          <View style={styles.topRow}>
            <View style={[styles.badge, { backgroundColor: accentColor }]}>
              <Text style={styles.badgeText}>{data.index + 1}</Text>
            </View>
            <Text style={styles.name} numberOfLines={1}>{data.name}</Text>
            {data.status === 'current' && (
              <View style={[styles.statusPill, { backgroundColor: `${accentColor}22` }]}>
                <Text style={[styles.statusPillText, { color: accentColor }]}>Current</Text>
              </View>
            )}
            {data.status === 'next' && (
              <View style={[styles.statusPill, { backgroundColor: '#E3F2FD' }]}>
                <Text style={[styles.statusPillText, { color: '#1976D2' }]}>Next</Text>
              </View>
            )}
          </View>

          <Text style={styles.meta}>
            {dateRange}{data.nights ? ` · ${data.nights} night${data.nights !== 1 ? 's' : ''}` : ''}
          </Text>

          {data.accommodation ? (
            <View style={styles.accRow}>
              <Text style={styles.accIcon}>🛏️</Text>
              <Text style={styles.accName} numberOfLines={1}>{data.accommodation.name}</Text>
              <Text style={styles.accDivider}>|</Text>
              <Text style={styles.accCheckin}>🕐 Check-in: {formatTime(data.accommodation.checkIn)}</Text>
            </View>
          ) : null}

          {data.highlightCategories.length > 0 && (
            <View style={styles.highlightsRow}>
              <Text style={[styles.highlightsLabel, { color: accentColor }]}>Highlights</Text>
              <View style={styles.highlightsIcons}>
                {data.highlightCategories.map((cat, i) => (
                  <View key={i} style={styles.highlightCircle}>
                    <Text style={styles.highlightEmoji}>{CATEGORY_EMOJI[cat] ?? '📍'}</Text>
                  </View>
                ))}
                {data.extraHighlightsCount > 0 && (
                  <View style={[styles.highlightCircle, styles.highlightMore]}>
                    <Text style={styles.highlightMoreText}>+{data.extraHighlightsCount}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  imageWrap: { width: 92, height: 92, borderRadius: 18, overflow: 'hidden', flexShrink: 0 },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  imagePlaceholderEmoji: { fontSize: 32 },
  infoCol: { flex: 1, paddingTop: 2 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  badge: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 11, fontWeight: '900', color: '#fff' },
  name: { fontSize: 17, fontWeight: '900', color: '#1A1A1A', flex: 1 },
  statusPill: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4 },
  statusPillText: { fontSize: 10, fontWeight: '800' },
  meta: { fontSize: 12, color: '#8A817A', fontWeight: '600', marginBottom: 6 },
  accRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  accIcon: { fontSize: 12 },
  accName: { fontSize: 12, fontWeight: '700', color: '#1A1A1A', maxWidth: 110 },
  accDivider: { fontSize: 12, color: '#D0C8C0' },
  accCheckin: { fontSize: 12, color: '#8A817A', fontWeight: '600' },
  highlightsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  highlightsLabel: { fontSize: 12, fontWeight: '800' },
  highlightsIcons: { flexDirection: 'row', gap: 4 },
  highlightCircle: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  highlightEmoji: { fontSize: 14 },
  highlightMore: { backgroundColor: '#F0EBE5' },
  highlightMoreText: { fontSize: 10, fontWeight: '800', color: '#8A817A' },
  chevron: { fontSize: 22, color: '#B8AEA5', fontWeight: '300', alignSelf: 'center' },
});
