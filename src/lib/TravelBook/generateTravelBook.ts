// ─── generateTravelBook ───────────────────────────────────────────────────────
// Main service. Fetches all data from Supabase and generates the Travel Book PDF.

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { supabase } from '../supabase';
import { assembleTravelBook, TravelBookData } from './TravelBookTemplate';
import type { CoverData } from './CoverSection';
import type { SummaryData } from './SummarySection';
import type { MapDestination } from './MapSection';
import type { DayData } from './ItinerarySection';
import type { JournalEntryData } from './JournalSection';
import type { BudgetData } from './BudgetSection';
import type { StatisticsData } from './StatisticsSection';

function localDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getTotalDays(startDate: string, endDate: string): number {
  try {
    const [sy, sm, sd] = startDate.split('-').map(Number);
    const [ey, em, ed] = endDate.split('-').map(Number);
    return Math.round(
      (new Date(ey, em - 1, ed).getTime() - new Date(sy, sm - 1, sd).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
  } catch { return 1; }
}

function getCurrentDestination(
  destinations: any[],
  startDate: string,
  dayNumber: number,
): string {
  let dayCounter = 0;
  const sorted = [...destinations].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  for (const dest of sorted) {
    const nights = dest.nights ?? 1;
    dayCounter += nights;
    if (dayNumber <= dayCounter) return dest.name;
  }
  return sorted[sorted.length - 1]?.name ?? '';
}

export async function generateTravelBook(tripId: string): Promise<void> {
  try {
    // ── Fetch all data in parallel ──────────────────────────────────────────
    const [
      tripRes, membersRes, destRes, activitiesRes,
      transportRes, accommodationsRes, journalRes, expensesRes,
    ] = await Promise.all([
      supabase.from('trips').select('*').eq('id', tripId).single(),
      supabase.from('trip_members').select('user_id, role, profiles:user_id(id, name, email)').eq('trip_id', tripId),
      supabase.from('destinations').select('*').eq('trip_id', tripId).order('order_index', { ascending: true }),
      supabase.from('activities').select('*').eq('trip_id', tripId).order('date', { ascending: true }).order('time', { ascending: true }),
      supabase.from('transport').select('*').eq('trip_id', tripId).order('departure_time', { ascending: true }),
      supabase.from('accommodations').select('*').eq('trip_id', tripId),
      supabase.from('journal_entries').select('*').eq('trip_id', tripId).order('date', { ascending: true }),
      supabase.from('expenses').select('*').eq('trip_id', tripId),
    ]);

    const trip = tripRes.data;
    if (!trip) { Alert.alert('Error', 'Trip not found.'); return; }

    const members = (membersRes.data ?? []).map((m: any) => ({
      name: m.profiles?.name ?? null,
      email: m.profiles?.email ?? null,
      role: m.role ?? 'editor',
    }));

    const destinations: MapDestination[] = (destRes.data ?? []).map((d: any) => ({
      id: d.id,
      name: d.name,
      country: d.country ?? null,
      nights: d.nights ?? null,
      order_index: d.order_index ?? null,
    }));

    const activities = activitiesRes.data ?? [];
    const transport = transportRes.data ?? [];
    const accommodations = accommodationsRes.data ?? [];
    const journalEntries: JournalEntryData[] = (journalRes.data ?? []).map((e: any) => ({
      id: e.id,
      title: e.title ?? '',
      content: e.content ?? null,
      mood: e.mood ?? null,
      highlight: e.highlight ?? null,
      favorite_meal: e.favorite_meal ?? null,
      location: e.location ?? null,
      date: e.date ?? '',
      photos: Array.isArray(e.photos) ? e.photos : [],
    }));
    const expenses = expensesRes.data ?? [];

    const totalDays = getTotalDays(trip.start_date, trip.end_date);
    const totalSpent = expenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);

    // ── Cover ────────────────────────────────────────────────────────────────
    const cover: CoverData = {
      tripName: trip.name,
      startDate: trip.start_date,
      endDate: trip.end_date,
      destinations: destinations.map(d => d.name),
      coverEmoji: trip.cover_destination ?? '✈️',
      memberCount: members.length,
    };

    // ── Summary ──────────────────────────────────────────────────────────────
    const summary: SummaryData = {
      tripName: trip.name,
      startDate: trip.start_date,
      endDate: trip.end_date,
      destinations,
      members,
      currency: trip.currency ?? 'EUR',
      totalBudget: trip.budget ?? 0,
      totalSpent,
    };

    // ── Daily timeline ────────────────────────────────────────────────────────
    const days: DayData[] = [];
    const [sy, sm, sd] = trip.start_date.split('-').map(Number);

    for (let i = 0; i < Math.min(totalDays, 60); i++) {
      const dayDate = new Date(sy, sm - 1, sd + i);
      const dateStr = localDateStr(dayDate);

      const dayActivities = activities
        .filter((a: any) => a.date === dateStr)
        .map((a: any) => ({
          title: a.title,
          time: a.time ?? null,
          category: a.category ?? 'other',
          location: a.location ?? null,
        }));

      const dayJournal = journalEntries.find(e => e.date?.startsWith(dateStr));

      const daySpent = expenses
        .filter((e: any) => e.date?.startsWith(dateStr))
        .reduce((sum: number, e: any) => sum + Number(e.amount), 0);

      const destination = getCurrentDestination(destinations, trip.start_date, i + 1);

      if (dayActivities.length > 0 || dayJournal || daySpent > 0) {
        days.push({
          date: dateStr,
          dayNumber: i + 1,
          destination,
          activities: dayActivities,
          journalEntry: dayJournal
            ? {
                title: dayJournal.title,
                content: dayJournal.content,
                mood: dayJournal.mood,
                highlight: dayJournal.highlight,
                favorite_meal: dayJournal.favorite_meal,
              }
            : null,
          totalSpent: daySpent,
          currency: trip.currency ?? 'EUR',
        });
      }
    }

    // ── Budget ───────────────────────────────────────────────────────────────
    const budget: BudgetData = {
      currency: trip.currency ?? 'EUR',
      totalBudget: trip.budget ?? 0,
      totalSpent,
      expenses: expenses.map((e: any) => ({
        amount: Number(e.amount),
        category: e.category ?? 'other',
        title: e.title ?? '',
        date: e.date ?? '',
      })),
    };

    // ── Statistics ───────────────────────────────────────────────────────────
    const allPhotos = journalEntries.flatMap(e => e.photos);
    const statistics: StatisticsData = {
      totalDays,
      destinationsCount: destinations.length,
      activitiesCompleted: activities.filter((a: any) => a.status === 'completed').length,
      flightsCount: transport.filter((t: any) => t.type === 'Flight').length,
      hotelsCount: accommodations.length,
      journalEntriesCount: journalEntries.length,
      photosCount: allPhotos.length,
      totalExpenses: expenses.length,
      currency: trip.currency ?? 'EUR',
      totalSpent,
    };

    // ── Assemble HTML ────────────────────────────────────────────────────────
    const data: TravelBookData = { cover, summary, destinations, days, journalEntries, budget, statistics };
    const html = assembleTravelBook(data);

    // ── Generate PDF ─────────────────────────────────────────────────────────
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    // ── Share ─────────────────────────────────────────────────────────────────
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `${trip.name} — Travel Book`,
        UTI: 'com.adobe.pdf',
      });
    } else {
      Alert.alert('✅ PDF Generated', `Saved to: ${uri}`);
    }

  } catch (e: any) {
    console.error('generateTravelBook error:', e);
    Alert.alert('Error', e.message ?? 'Could not generate Travel Book.');
  }
}
