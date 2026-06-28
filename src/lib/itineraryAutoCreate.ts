// ─── Itinerary Auto-Create Helper ────────────────────────────────────────────
// Called after Transport or Accommodation is saved.
// Creates linked itinerary activities with safe deduplication.
// Uses source_id + source_type + source_event_type for linking.

import { supabase } from './supabase';

function localDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function parseTimeStr(ts: string | null): { date: string | null; time: string | null } {
  if (!ts) return { date: null, time: null };
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return { date: null, time: null };
    return {
      date: localDateStr(d),
      time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
    };
  } catch {
    return { date: null, time: null };
  }
}

// ─── Transport → Itinerary ────────────────────────────────────────────────────

export async function createActivityFromTransport(
  transportId: string,
  tripId: string,
  transportData: {
    type: string;
    airline?: string | null;
    flight_number?: string | null;
    departure_location: string;
    arrival_location: string;
    departure_time?: string | null;
    arrival_time?: string | null;
  },
  userId: string,
): Promise<void> {
  // Dedup: check if activity already exists for this transport
  const { data: existing } = await supabase
    .from('activities')
    .select('id')
    .eq('source_id', transportId)
    .eq('source_type', 'transport')
    .limit(1);

  if (existing && existing.length > 0) {
    // Already exists — update it instead
    const { date, time } = parseTimeStr(transportData.departure_time ?? null);
    const title = buildTransportTitle(transportData);
    await supabase
      .from('activities')
      .update({
        title,
        time: time ?? null,
        date: date ?? undefined,
        location: transportData.departure_location,
      })
      .eq('source_id', transportId)
      .eq('source_type', 'transport');
    return;
  }

  const { date, time } = parseTimeStr(transportData.departure_time ?? null);
  const title = buildTransportTitle(transportData);
  const category = transportData.type === 'Flight' ? 'flight' : 'transport';

  await supabase.from('activities').insert({
    trip_id: tripId,
    title,
    category,
    date: date ?? null,
    time: time ?? null,
    location: transportData.departure_location,
    status: 'upcoming',
    created_by: userId,
    source_id: transportId,
    source_type: 'transport',
    source_event_type: 'departure',
  });
}

function buildTransportTitle(data: {
  type: string;
  airline?: string | null;
  flight_number?: string | null;
  departure_location: string;
  arrival_location: string;
}): string {
  if (data.type === 'Flight') {
    const prefix = data.airline
      ? `${data.airline}${data.flight_number ? ` ${data.flight_number}` : ''}`
      : 'Flight';
    return `${prefix}: ${data.departure_location} → ${data.arrival_location}`;
  }
  return `${data.type}: ${data.departure_location} → ${data.arrival_location}`;
}

// ─── Accommodation → Itinerary ────────────────────────────────────────────────

export async function createActivitiesFromAccommodation(
  accommodationId: string,
  tripId: string,
  accommodationData: {
    name: string;
    check_in?: string | null;
    check_out?: string | null;
    address?: string | null;
  },
  userId: string,
): Promise<void> {
  // Check-in activity
  await upsertAccommodationActivity({
    accommodationId,
    tripId,
    name: accommodationData.name,
    dateStr: accommodationData.check_in ?? null,
    address: accommodationData.address ?? null,
    eventType: 'checkin',
    category: 'hotel_checkin',
    titlePrefix: 'Check-in',
    userId,
  });

  // Check-out activity
  await upsertAccommodationActivity({
    accommodationId,
    tripId,
    name: accommodationData.name,
    dateStr: accommodationData.check_out ?? null,
    address: accommodationData.address ?? null,
    eventType: 'checkout',
    category: 'hotel_checkout',
    titlePrefix: 'Check-out',
    userId,
  });
}

async function upsertAccommodationActivity(params: {
  accommodationId: string;
  tripId: string;
  name: string;
  dateStr: string | null;
  address: string | null;
  eventType: 'checkin' | 'checkout';
  category: string;
  titlePrefix: string;
  userId: string;
}): Promise<void> {
  const { date, time } = parseTimeStr(params.dateStr);
  const title = `${params.titlePrefix}: ${params.name}`;

  // Dedup check
  const { data: existing } = await supabase
    .from('activities')
    .select('id')
    .eq('source_id', params.accommodationId)
    .eq('source_type', 'accommodation')
    .eq('source_event_type', params.eventType)
    .limit(1);

  if (existing && existing.length > 0) {
    // Update existing
    await supabase
      .from('activities')
      .update({
        title,
        date: date ?? null,
        time: time ?? null,
        location: params.address ?? null,
      })
      .eq('source_id', params.accommodationId)
      .eq('source_type', 'accommodation')
      .eq('source_event_type', params.eventType);
    return;
  }

  // Insert new
  await supabase.from('activities').insert({
    trip_id: params.tripId,
    title,
    category: params.category,
    date: date ?? null,
    time: time ?? null,
    location: params.address ?? null,
    status: 'upcoming',
    created_by: params.userId,
    source_id: params.accommodationId,
    source_type: 'accommodation',
    source_event_type: params.eventType,
  });
}

// ─── Delete sync ──────────────────────────────────────────────────────────────

export async function deleteActivitiesBySource(
  sourceId: string,
  sourceType: 'transport' | 'accommodation',
): Promise<void> {
  await supabase
    .from('activities')
    .delete()
    .eq('source_id', sourceId)
    .eq('source_type', sourceType);
}
