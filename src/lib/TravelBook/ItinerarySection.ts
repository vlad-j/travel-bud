// ─── Itinerary Section ────────────────────────────────────────────────────────
// Daily timeline with activities, journal entries, and spending per day.

const ACTIVITY_EMOJIS: Record<string, string> = {
  food: '🍜', transport: '🚗', accommodation: '🏨', activity: '🎯',
  flight: '✈️', hotel_checkin: '🏨', hotel_checkout: '🧳', shopping: '🛍️', other: '📍',
};

const MOOD_EMOJIS: Record<string, string> = {
  amazing: '😍', good: '😊', normal: '😐', bad: '😞',
};

export interface DayData {
  date: string;
  dayNumber: number;
  destination: string;
  activities: Array<{ title: string; time: string | null; category: string; location: string | null }>;
  journalEntry: {
    title: string;
    content: string | null;
    mood: string | null;
    highlight: string | null;
    favorite_meal: string | null;
  } | null;
  totalSpent: number;
  currency: string;
}

function formatDateFull(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch { return dateStr; }
}

function renderDayCard(day: DayData): string {
  const activitiesHtml = day.activities.length > 0
    ? `<div class="day-activities">
        ${day.activities.map(a => `
          <div class="day-activity">
            <span class="day-activity-time">${a.time?.slice(0, 5) ?? ''}</span>
            <span class="day-activity-emoji">${ACTIVITY_EMOJIS[a.category] ?? '📍'}</span>
            <span>${a.title}${a.location ? ` <span style="color:#888;font-size:11px">· ${a.location}</span>` : ''}</span>
          </div>
        `).join('')}
      </div>`
    : '';

  const journalHtml = day.journalEntry
    ? `<div class="day-journal">
        ${day.journalEntry.mood ? `<div class="day-journal-mood">${MOOD_EMOJIS[day.journalEntry.mood] ?? ''}</div>` : ''}
        <div class="day-journal-title">${day.journalEntry.title}</div>
        ${day.journalEntry.content ? `<div class="day-journal-content">${day.journalEntry.content.slice(0, 300)}${day.journalEntry.content.length > 300 ? '...' : ''}</div>` : ''}
        ${day.journalEntry.highlight ? `<div class="day-journal-highlight">✨ ${day.journalEntry.highlight}</div>` : ''}
      </div>`
    : '';

  const spendingHtml = day.totalSpent > 0
    ? `<div class="day-spending">
        <span>Daily spending:</span>
        <span class="day-spending-amount">${day.currency} ${day.totalSpent.toFixed(0)}</span>
      </div>`
    : '';

  return `
    <div class="day-card no-break">
      <div class="day-header">
        <span class="day-number">DAY ${day.dayNumber}</span>
        <span class="day-date">${formatDateFull(day.date)}</span>
        <span class="day-dest">${day.destination}</span>
      </div>
      ${activitiesHtml}
      ${journalHtml}
      ${spendingHtml}
    </div>
  `;
}

export function renderItinerary(days: DayData[]): string {
  if (days.length === 0) return '';

  return `
    <div class="section page-break">
      <div class="section-title">Daily Timeline</div>
      ${days.map(day => renderDayCard(day)).join('')}
    </div>
  `;
}
