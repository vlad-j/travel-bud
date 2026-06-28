// ─── Journal Section ──────────────────────────────────────────────────────────

const MOOD_EMOJIS: Record<string, string> = {
  amazing: '😍', good: '😊', normal: '😐', bad: '😞',
};

export interface JournalEntryData {
  id: string;
  title: string;
  content: string | null;
  mood: string | null;
  highlight: string | null;
  favorite_meal: string | null;
  location: string | null;
  date: string;
  photos: string[];
}

function formatDateFull(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch { return dateStr; }
}

function renderEntry(entry: JournalEntryData): string {
  const photosHtml = entry.photos.length > 0
    ? `<div class="journal-photos">
        ${entry.photos.slice(0, 6).map(url =>
          `<img src="${url}" class="journal-photo" alt="" />`
        ).join('')}
      </div>`
    : '';

  return `
    <div class="journal-entry no-break">
      <div class="journal-entry-header">
        ${entry.mood ? `<span class="journal-mood">${MOOD_EMOJIS[entry.mood] ?? ''}</span>` : ''}
        <span class="journal-title">${entry.title}</span>
        <span class="journal-date">${formatDateFull(entry.date)}</span>
      </div>

      ${entry.location ? `<div class="journal-location">📍 ${entry.location}</div>` : ''}

      ${entry.highlight
        ? `<div class="journal-highlight">✨ <strong>Best moment:</strong> ${entry.highlight}</div>`
        : ''}

      ${entry.content
        ? `<div class="journal-content">${entry.content.replace(/\n/g, '<br>')}</div>`
        : ''}

      ${entry.favorite_meal
        ? `<div class="journal-meal"><span>🍜</span><span><strong>Favorite meal:</strong> ${entry.favorite_meal}</span></div>`
        : ''}

      ${photosHtml}
    </div>
  `;
}

export function renderJournal(entries: JournalEntryData[]): string {
  if (entries.length === 0) return '';

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  return `
    <div class="section page-break">
      <div class="section-title">Travel Diary · ${entries.length} entries</div>
      ${sorted.map(e => renderEntry(e)).join('')}
    </div>
  `;
}

// ─── Mood Timeline Section ────────────────────────────────────────────────────

export function renderMoodTimeline(entries: JournalEntryData[]): string {
  const moodEntries = entries.filter(e => e.mood && e.date).sort((a, b) => a.date.localeCompare(b.date));
  if (moodEntries.length === 0) return '';

  const moodCounts: Record<string, number> = {};
  for (const e of moodEntries) {
    if (e.mood) moodCounts[e.mood] = (moodCounts[e.mood] ?? 0) + 1;
  }

  const timelineHtml = moodEntries.map(e => {
    const dateStr = e.date.split('T')[0];
    const parts = dateStr.split('-');
    const day = parseInt(parts[2] ?? '0');
    const monthNum = parseInt(parts[1] ?? '1') - 1;
    const monthLabel = new Date(2000, monthNum, 1).toLocaleDateString('en-GB', { month: 'short' });
    return `
      <div class="mood-item">
        <div class="mood-emoji-wrap">${MOOD_EMOJIS[e.mood!] ?? '😐'}</div>
        <span class="mood-day">${day} ${monthLabel}</span>
      </div>
    `;
  }).join('');

  const MOODS = [
    { value: 'amazing', emoji: '😍', label: 'Amazing' },
    { value: 'good', emoji: '😊', label: 'Good' },
    { value: 'normal', emoji: '😐', label: 'Normal' },
    { value: 'bad', emoji: '😞', label: 'Bad' },
  ];

  const summaryHtml = MOODS
    .filter(m => moodCounts[m.value])
    .map(m => `
      <div class="mood-summary-item">
        <span>${m.emoji}</span>
        <span>${m.label}: ${moodCounts[m.value]}x</span>
      </div>
    `).join('');

  return `
    <div class="section">
      <div class="section-title">Mood Timeline</div>
      <div class="mood-timeline">${timelineHtml}</div>
      <div class="mood-summary">${summaryHtml}</div>
    </div>
  `;
}
