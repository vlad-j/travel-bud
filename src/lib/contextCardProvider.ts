// ─── Context Card Provider ────────────────────────────────────────────────────
// Evaluates all possible contextual cards and returns the single
// highest-priority card for the current traveler moment.
//
// Priority order:
//  1. flight_today
//  2. flight_tomorrow
//  3. checkin_today
//  4. checkout_today
//  5. transport_today
//  6. next_activity
//  7. missing_documents   ← type defined but not evaluated yet (no real logic)
//  8. budget_warning
//  9. journal_reminder    ← only after 18:00 and if no entry today
// 10. no_activities_today

export type ContextCardType =
  | 'flight_today'
  | 'flight_tomorrow'
  | 'checkin_today'
  | 'checkout_today'
  | 'transport_today'
  | 'next_activity'
  | 'missing_documents'
  | 'budget_warning'
  | 'journal_reminder'
  | 'no_activities_today'
  | null;

export interface ContextCardAction {
  label: string;
  screen: string;
  params?: Record<string, any>;
}

export interface ContextCard {
  type: ContextCardType;
  emoji: string;
  title: string;
  subtitle: string;
  action?: ContextCardAction;
  urgency: 'high' | 'medium' | 'low';
}

// ─── Input data types ─────────────────────────────────────────────────────────

export interface ContextCardInput {
  // Transport
  flightToday: { id: string; departure_location: string; arrival_location: string; departure_time: string | null } | null;
  flightTomorrow: { id: string; departure_location: string; arrival_location: string; departure_time: string | null } | null;
  transportToday: { id: string; type: string; departure_location: string; arrival_location: string } | null;

  // Accommodation
  checkinToday: { id: string; name: string; check_in_date: string } | null;
  checkoutToday: { id: string; name: string; check_out_date: string } | null;

  // Activities
  activitiesTodayCount: number;
  nextActivity: { id: string; title: string; time: string | null; location: string | null } | null;

  // Budget
  budgetTotal: number;
  budgetSpent: number;

  // Journal
  hasJournalToday: boolean;

  // Time context
  currentHour: number; // 0-23
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatTime(timeStr: string | null): string {
  if (!timeStr) return '';
  try {
    const d = new Date(timeStr);
    if (isNaN(d.getTime())) return timeStr.slice(0, 5);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return timeStr.slice(0, 5);
  }
}

// ─── Main evaluator ───────────────────────────────────────────────────────────

export function evaluateContextCard(input: ContextCardInput): ContextCard | null {
  const {
    flightToday, flightTomorrow, transportToday,
    checkinToday, checkoutToday,
    activitiesTodayCount, nextActivity,
    budgetTotal, budgetSpent,
    hasJournalToday,
    currentHour,
  } = input;

  // 1. Flight today
  if (flightToday) {
    const time = formatTime(flightToday.departure_time);
    return {
      type: 'flight_today',
      emoji: '✈️',
      title: `Flight today${time ? ` at ${time}` : ''}`,
      subtitle: `${flightToday.departure_location} → ${flightToday.arrival_location}`,
      action: { label: 'View flight', screen: 'Transport' },
      urgency: 'high',
    };
  }

  // 2. Flight tomorrow
  if (flightTomorrow) {
    const time = formatTime(flightTomorrow.departure_time);
    return {
      type: 'flight_tomorrow',
      emoji: '✈️',
      title: `Flight tomorrow${time ? ` at ${time}` : ''}`,
      subtitle: `${flightTomorrow.departure_location} → ${flightTomorrow.arrival_location} · Are your documents ready?`,
      action: { label: 'View flight', screen: 'Transport' },
      urgency: 'high',
    };
  }

  // 3. Check-in today
  if (checkinToday) {
    return {
      type: 'checkin_today',
      emoji: '🏨',
      title: `Check-in today`,
      subtitle: checkinToday.name,
      action: { label: 'View booking', screen: 'Accommodation' },
      urgency: 'high',
    };
  }

  // 4. Check-out today
  if (checkoutToday) {
    return {
      type: 'checkout_today',
      emoji: '🧳',
      title: `Check-out today`,
      subtitle: `Don't forget to pack — ${checkoutToday.name}`,
      action: { label: 'View booking', screen: 'Accommodation' },
      urgency: 'medium',
    };
  }

  // 5. Transport today (non-flight)
  if (transportToday) {
    return {
      type: 'transport_today',
      emoji: '🚌',
      title: `${transportToday.type} today`,
      subtitle: `${transportToday.departure_location} → ${transportToday.arrival_location}`,
      action: { label: 'View transport', screen: 'Transport' },
      urgency: 'medium',
    };
  }

  // 6. Next activity (within next 3 hours)
  if (nextActivity && nextActivity.time) {
    const [h, m] = nextActivity.time.split(':').map(Number);
    const actMinutes = h * 60 + m;
    const nowMinutes = currentHour * 60 + new Date().getMinutes();
    const diff = actMinutes - nowMinutes;

    if (diff >= 0 && diff <= 180) {
      const inMin = diff;
      const label = inMin <= 10 ? 'Starting now' : `In ${inMin} min`;
      return {
        type: 'next_activity',
        emoji: '🎯',
        title: nextActivity.title,
        subtitle: `${label}${nextActivity.location ? ` · ${nextActivity.location}` : ''}`,
        action: { label: 'View itinerary', screen: 'Itinerary' },
        urgency: inMin <= 30 ? 'high' : 'medium',
      };
    }
  }

  // 7. missing_documents — type reserved, not evaluated yet
  // TODO: evaluate when document intelligence is implemented (Phase 9)

  // 8. Budget warning
  if (budgetTotal > 0 && budgetSpent > 0) {
    const pct = (budgetSpent / budgetTotal) * 100;
    if (pct >= 100) {
      const over = budgetSpent - budgetTotal;
      return {
        type: 'budget_warning',
        emoji: '🚨',
        title: `Budget exceeded by ${Math.round(over)} ${' '}`,
        subtitle: 'You are over your planned budget',
        action: { label: 'View budget', screen: 'Budget' },
        urgency: 'high',
      };
    }
    if (pct >= 90) {
      return {
        type: 'budget_warning',
        emoji: '⚠️',
        title: `90% of budget used`,
        subtitle: `${Math.round(budgetTotal - budgetSpent)} remaining — spend carefully`,
        action: { label: 'View budget', screen: 'Budget' },
        urgency: 'high',
      };
    }
    if (pct >= 80) {
      return {
        type: 'budget_warning',
        emoji: '💰',
        title: `80% of budget used`,
        subtitle: `${Math.round(budgetTotal - budgetSpent)} still available`,
        action: { label: 'View budget', screen: 'Budget' },
        urgency: 'medium',
      };
    }
  }

  // 9. Journal reminder (only after 18:00, only if no entry today)
  if (currentHour >= 18 && !hasJournalToday) {
    return {
      type: 'journal_reminder',
      emoji: '📖',
      title: `Write today's memory`,
      subtitle: `Don't let today's story go untold`,
      action: { label: 'Open journal', screen: 'Journal' },
      urgency: 'low',
    };
  }

  // 10. No activities today (with action)
  if (activitiesTodayCount === 0) {
    return {
      type: 'no_activities_today',
      emoji: '🗓️',
      title: `No activities planned today`,
      subtitle: `Start building today's itinerary`,
      action: { label: 'Add activity', screen: 'Itinerary' },
      urgency: 'low',
    };
  }

  return null;
}
