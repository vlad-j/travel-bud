// ─── Map Section ──────────────────────────────────────────────────────────────
// Visual route between destinations (text-based for PDF, no real map)

const DEST_EMOJIS: Record<string, string> = {
  thailand: '🏯', bali: '🛕', indonesia: '🛕', java: '🛕', lombok: '🌴',
  japan: '⛩️', france: '🗼', paris: '🗼', italy: '🏛️', rome: '🏛️',
  spain: '💃', barcelona: '💃', greece: '🏛️', norway: '🏔️', oslo: '🏔️',
  vietnam: '🏮', cambodia: '🏛️', singapore: '🦁', malaysia: '🌴',
  usa: '🗽', 'new york': '🗽', mexico: '🌮', brazil: '🌴',
  australia: '🦘', egypt: '🐪', morocco: '🕌', dubai: '🏙️',
  default: '📍',
};

function getDestEmoji(name: string, country: string | null): string {
  const search = [name, country].filter(Boolean).join(' ').toLowerCase();
  for (const [key, emoji] of Object.entries(DEST_EMOJIS)) {
    if (search.includes(key)) return emoji;
  }
  return DEST_EMOJIS.default;
}

export interface MapDestination {
  name: string;
  country: string | null;
  nights: number | null;
  order_index: number | null;
}

export function renderMap(destinations: MapDestination[]): string {
  if (destinations.length === 0) return '';

  const sorted = [...destinations].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

  const stopsHtml = sorted.map((dest, i) => `
    <div class="route-stop">
      <div class="route-dot-col">
        <div class="route-dot"></div>
        ${i < sorted.length - 1 ? '<div class="route-line"></div>' : ''}
      </div>
      <div class="route-emoji">${getDestEmoji(dest.name, dest.country)}</div>
      <div class="route-info">
        <div class="route-name">${dest.name}</div>
        ${dest.country ? `<div class="route-country">${dest.country}</div>` : ''}
        ${dest.nights ? `<div class="route-nights">🌙 ${dest.nights} nights</div>` : ''}
      </div>
    </div>
  `).join('');

  return `
    <div class="section page-break">
      <div class="section-title">Travel Route</div>
      <div class="route-wrap">${stopsHtml}</div>
    </div>
  `;
}
