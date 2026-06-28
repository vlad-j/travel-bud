// ─── Statistics Section ───────────────────────────────────────────────────────

export interface StatisticsData {
  totalDays: number;
  destinationsCount: number;
  activitiesCompleted: number;
  flightsCount: number;
  hotelsCount: number;
  journalEntriesCount: number;
  photosCount: number;
  totalExpenses: number;
  currency: string;
  totalSpent: number;
}

export function renderStatistics(data: StatisticsData): string {
  const stats = [
    { emoji: '📅', value: String(data.totalDays), label: 'Days' },
    { emoji: '🌍', value: String(data.destinationsCount), label: 'Destinations' },
    { emoji: '🎯', value: String(data.activitiesCompleted), label: 'Activities' },
    { emoji: '✈️', value: String(data.flightsCount), label: 'Flights' },
    { emoji: '🏨', value: String(data.hotelsCount), label: 'Hotels' },
    { emoji: '📖', value: String(data.journalEntriesCount), label: 'Journal entries' },
    { emoji: '📷', value: String(data.photosCount), label: 'Photos' },
    { emoji: '💰', value: `${data.currency} ${data.totalSpent.toLocaleString()}`, label: 'Total spent' },
  ];

  const statsHtml = stats.map(s => `
    <div class="stat-card">
      <span class="stat-emoji">${s.emoji}</span>
      <span class="stat-value">${s.value}</span>
      <span class="stat-label">${s.label}</span>
    </div>
  `).join('');

  return `
    <div class="section page-break">
      <div class="section-title">Trip Statistics</div>
      <div class="stats-grid">${statsHtml}</div>
    </div>
  `;
}
