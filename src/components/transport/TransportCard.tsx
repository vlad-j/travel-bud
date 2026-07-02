import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// ─── Type visuals ───────────────────────────────────────────────────────────
export interface TransportTypeMeta {
  icon: string;
  bg: string;
  accent: string;
}

export const TRANSPORT_TYPE_META: Record<string, TransportTypeMeta> = {
  Flight: { icon: '✈️', bg: '#E3F2FD', accent: '#1976D2' },
  Taxi: { icon: '🚕', bg: '#FFE0B2', accent: '#F57C00' },
  Grab: { icon: '🚕', bg: '#FFE0B2', accent: '#F57C00' },
  Bolt: { icon: '🚕', bg: '#FFE0B2', accent: '#F57C00' },
  'Rental Car': { icon: '🚙', bg: '#FFE0B2', accent: '#F57C00' },
  Scooter: { icon: '🛵', bg: '#FFE0B2', accent: '#F57C00' },
  Motorbike: { icon: '🏍️', bg: '#FFE0B2', accent: '#F57C00' },
  Bicycle: { icon: '🚲', bg: '#FFE0B2', accent: '#F57C00' },
  Walk: { icon: '🚶', bg: '#FFE0B2', accent: '#F57C00' },
  Train: { icon: '🚆', bg: '#EDE7F6', accent: '#7E57C2' },
  Metro: { icon: '🚇', bg: '#EDE7F6', accent: '#7E57C2' },
  Bus: { icon: '🚌', bg: '#E1F5FE', accent: '#0288D1' },
  Boat: { icon: '⛴️', bg: '#E0F7FA', accent: '#00838F' },
  Ferry: { icon: '⛴️', bg: '#E0F7FA', accent: '#00838F' },
  Other: { icon: '🚐', bg: '#F5F5F5', accent: '#757575' },
};

export function getTransportTypeMeta(type: string): TransportTypeMeta {
  return TRANSPORT_TYPE_META[type] ?? TRANSPORT_TYPE_META.Other;
}

// ─── Booking status (Confirmed / Pending / Imported) ───────────────────────
// The underlying `status` column historically only ever held 'UPCOMING'
// (set by the old forms) — that value, or anything unrecognized, is treated
// as 'Confirmed' since the user entered it themselves.
const STATUS_META: Record<string, { label: string; bg: string; text: string }> = {
  Confirmed: { label: 'Confirmed', bg: '#E8F5E9', text: '#2E7D32' },
  Pending: { label: 'Pending', bg: '#FFF3E0', text: '#E65100' },
  Imported: { label: 'Imported', bg: '#E3F2FD', text: '#1565C0' },
};

export function getBookingStatusMeta(status: string | null | undefined) {
  if (status && STATUS_META[status]) return STATUS_META[status];
  return STATUS_META.Confirmed;
}

// ─── Time helpers ───────────────────────────────────────────────────────────
export function formatClockTime(ts: string | null): string {
  if (!ts) return '—';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function formatDayMonth(ts: string | null): { day: string; month: string } | null {
  if (!ts) return null;
  const d = new Date(ts);
  if (isNaN(d.getTime())) return null;
  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return { day: String(d.getDate()), month: MONTHS[d.getMonth()] };
}

export function formatDuration(departure: string | null, arrival: string | null): string | null {
  if (!departure || !arrival) return null;
  const dep = new Date(departure);
  const arr = new Date(arrival);
  if (isNaN(dep.getTime()) || isNaN(arr.getTime())) return null;
  let mins = Math.round((arr.getTime() - dep.getTime()) / 60000);
  if (mins <= 0) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function providerLine(item: any): string {
  if (item.type === 'Flight') {
    return [item.airline, item.flight_number].filter(Boolean).join(' • ') || 'Flight';
  }
  if (item.type === 'Train' && item.booking_reference) {
    return `Train No. ${item.booking_reference}`;
  }
  return item.airline || item.type;
}

// ─── Card ───────────────────────────────────────────────────────────────────
interface Props {
  item: any;
  onPress?: () => void;
  onLongPress?: () => void;
}

export default function TransportCard({ item, onPress, onLongPress }: Props) {
  const meta = getTransportTypeMeta(item.type);
  const statusMeta = getBookingStatusMeta(item.status);
  const duration = formatDuration(item.departure_time, item.arrival_time);
  const isFlight = item.type === 'Flight';
  const hasFlightChips = isFlight && (item.terminal || item.gate || item.seat);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} onLongPress={onLongPress} activeOpacity={0.8}>
      <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
        <Text style={{ fontSize: 20 }}>{meta.icon}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <View style={styles.topRow}>
          <Text style={styles.route} numberOfLines={1}>
            {item.departure_location} → {item.arrival_location}
          </Text>
          <View style={[styles.statusPill, { backgroundColor: statusMeta.bg }]}>
            <Text style={[styles.statusText, { color: statusMeta.text }]}>{statusMeta.label}</Text>
          </View>
        </View>

        <Text style={styles.provider} numberOfLines={1}>{providerLine(item)}</Text>

        <View style={styles.timeRow}>
          <Text style={styles.timeText}>
            {formatClockTime(item.departure_time)} – {formatClockTime(item.arrival_time)}
          </Text>
          {duration && <Text style={styles.durationText}>({duration})</Text>}
          {item.price ? <Text style={styles.priceText}>{item.price} {item.price_currency ?? ''}</Text> : null}
        </View>

        {hasFlightChips && (
          <View style={styles.chipsRow}>
            {item.terminal && <View style={styles.chip}><Text style={styles.chipText}>{item.terminal}</Text></View>}
            {item.gate && <View style={styles.chip}><Text style={styles.chipText}>{item.gate}</Text></View>}
            {item.seat && <View style={styles.chip}><Text style={styles.chipText}>{item.seat}</Text></View>}
          </View>
        )}
      </View>

      {onPress && <Text style={styles.chevron}>›</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#fff',
    borderRadius: 18, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  iconWrap: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  route: { flex: 1, fontSize: 14, fontWeight: '800', color: '#1A1A1A' },
  provider: { fontSize: 12, color: '#8A817A', marginTop: 3, fontWeight: '600' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  timeText: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
  durationText: { fontSize: 12, color: '#8A817A', fontWeight: '600' },
  priceText: { fontSize: 12, color: '#4CAF50', fontWeight: '800', marginLeft: 'auto' },
  chipsRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  chip: { backgroundColor: '#F5F1EB', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  chipText: { fontSize: 10, fontWeight: '800', color: '#5C5148' },
  statusPill: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: '800' },
  chevron: { fontSize: 20, color: '#C8BFB5', fontWeight: '300', marginTop: 8 },
});
