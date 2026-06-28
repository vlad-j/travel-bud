// ─── Summary Section ──────────────────────────────────────────────────────────

export interface SummaryData {
  tripName: string;
  startDate: string;
  endDate: string;
  destinations: Array<{ name: string; country: string | null; nights: number | null }>;
  members: Array<{ name: string | null; email: string | null; role: string }>;
  currency: string;
  totalBudget: number;
  totalSpent: number;
}

function formatDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch { return dateStr; }
}

export function renderSummary(data: SummaryData): string {
  const totalDays = (() => {
    try {
      const [sy, sm, sd] = data.startDate.split('-').map(Number);
      const [ey, em, ed] = data.endDate.split('-').map(Number);
      return Math.round(
        (new Date(ey, em - 1, ed).getTime() - new Date(sy, sm - 1, sd).getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
    } catch { return 0; }
  })();

  const membersHtml = data.members.map(m => `
    <div class="member-chip">
      <span class="member-emoji">👤</span>
      <div>
        <div class="member-name">${m.name ?? m.email ?? 'Traveler'}</div>
        <div class="member-role">${m.role}</div>
      </div>
    </div>
  `).join('');

  const destsHtml = data.destinations.map(d => `
    <div class="summary-item">📍 ${d.name}${d.country ? `, ${d.country}` : ''}${d.nights ? ` · ${d.nights} nights` : ''}</div>
  `).join('');

  const budgetPct = data.totalBudget > 0
    ? Math.min(Math.round((data.totalSpent / data.totalBudget) * 100), 100)
    : 0;

  return `
    <div class="section">
      <div class="section-title">Trip Summary</div>

      <div class="summary-card">
        <h2>${data.tripName}</h2>
        <div class="sub">${formatDate(data.startDate)} — ${formatDate(data.endDate)}</div>
        <div class="summary-row">
          <div class="summary-item">📅 ${totalDays} days</div>
          <div class="summary-item">🌍 ${data.destinations.length} destination${data.destinations.length !== 1 ? 's' : ''}</div>
          <div class="summary-item">👥 ${data.members.length} traveler${data.members.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      ${data.destinations.length > 0 ? `
        <div class="section-title" style="margin-top:20px">Destinations</div>
        <div class="summary-row" style="margin-bottom:20px">${destsHtml}</div>
      ` : ''}

      ${data.members.length > 0 ? `
        <div class="section-title">Travel Group</div>
        <div class="members-row">${membersHtml}</div>
      ` : ''}

      ${data.totalBudget > 0 ? `
        <div class="section-title">Budget Overview</div>
        <div class="budget-hero">
          <div class="budget-total">${data.currency} ${data.totalSpent.toLocaleString()}</div>
          <div class="budget-label">spent of ${data.currency} ${data.totalBudget.toLocaleString()} budget</div>
          <div class="budget-progress-bg">
            <div class="budget-progress-fill" style="width:${budgetPct}%"></div>
          </div>
          <div class="budget-stats">
            <div class="budget-stat">
              <div class="budget-stat-value">${budgetPct}%</div>
              <div class="budget-stat-label">Used</div>
            </div>
            <div class="budget-stat">
              <div class="budget-stat-value">${data.currency} ${Math.abs(data.totalBudget - data.totalSpent).toLocaleString()}</div>
              <div class="budget-stat-label">${data.totalSpent > data.totalBudget ? 'Over budget' : 'Remaining'}</div>
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}
