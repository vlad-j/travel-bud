// ─── Cover Section ────────────────────────────────────────────────────────────

export interface CoverData {
  tripName: string;
  startDate: string;
  endDate: string;
  destinations: string[];
  coverEmoji: string;
  memberCount: number;
}

function formatDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch { return dateStr; }
}

export function renderCover(data: CoverData): string {
  const dests = data.destinations.join(' → ');
  const totalDays = (() => {
    try {
      const [sy, sm, sd] = data.startDate.split('-').map(Number);
      const [ey, em, ed] = data.endDate.split('-').map(Number);
      return Math.round(
        (new Date(ey, em - 1, ed).getTime() - new Date(sy, sm - 1, sd).getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
    } catch { return 0; }
  })();

  return `
    <div class="cover page-break">
      <div class="cover-emoji">${data.coverEmoji}</div>
      <div class="cover-trip-name">${data.tripName}</div>
      <div class="cover-dates">${formatDate(data.startDate)} — ${formatDate(data.endDate)}</div>
      ${dests ? `<div class="cover-destinations">${dests}</div>` : ''}
      <div class="cover-badge">✈️ ${totalDays} days · ${data.memberCount} traveler${data.memberCount !== 1 ? 's' : ''}</div>
      <div class="cover-footer">ULTIMATE TRAVEL BUDDY · TRAVEL BOOK</div>
    </div>
  `;
}
