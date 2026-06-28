// ─── Destination Hero Mapping ─────────────────────────────────────────────────
// Maps destination keywords to hero emoji.
// Extensible: add new entries as new destinations are supported.
// Future: replace emoji with destination photo URL or country color scheme.

export interface DestinationHero {
  emoji: string;
  color: string; // accent color for future use
}

interface HeroMapping {
  keywords: string[];
  hero: DestinationHero;
}

const HERO_MAPPINGS: HeroMapping[] = [
  // Southeast Asia
  { keywords: ['bali', 'lombok', 'java', 'yogyakarta', 'jakarta', 'indonesia'], hero: { emoji: '🛕', color: '#FF9800' } },
  { keywords: ['bangkok', 'thailand', 'chiang mai', 'phuket', 'krabi'], hero: { emoji: '🏯', color: '#F44336' } },
  { keywords: ['vietnam', 'hanoi', 'ho chi minh', 'saigon', 'hoi an', 'da nang'], hero: { emoji: '🏮', color: '#E53935' } },
  { keywords: ['cambodia', 'angkor', 'siem reap', 'phnom penh'], hero: { emoji: '🏛️', color: '#795548' } },
  { keywords: ['malaysia', 'kuala lumpur', 'penang', 'kota kinabalu'], hero: { emoji: '🌴', color: '#4CAF50' } },
  { keywords: ['singapore'], hero: { emoji: '🦁', color: '#F44336' } },
  { keywords: ['philippines', 'manila', 'palawan', 'boracay', 'cebu'], hero: { emoji: '🏝️', color: '#00BCD4' } },

  // East Asia
  { keywords: ['japan', 'tokyo', 'kyoto', 'osaka', 'hiroshima', 'nara'], hero: { emoji: '⛩️', color: '#F44336' } },
  { keywords: ['china', 'beijing', 'shanghai', 'hong kong', 'guangzhou'], hero: { emoji: '🐉', color: '#F44336' } },
  { keywords: ['south korea', 'seoul', 'busan', 'jeju'], hero: { emoji: '🏙️', color: '#3F51B5' } },

  // Europe
  { keywords: ['paris', 'france'], hero: { emoji: '🗼', color: '#3F51B5' } },
  { keywords: ['rome', 'italy', 'milan', 'venice', 'florence', 'naples'], hero: { emoji: '🏛️', color: '#FF9800' } },
  { keywords: ['spain', 'barcelona', 'madrid', 'seville', 'granada'], hero: { emoji: '💃', color: '#F44336' } },
  { keywords: ['greece', 'athens', 'santorini', 'mykonos', 'crete'], hero: { emoji: '🏛️', color: '#2196F3' } },
  { keywords: ['amsterdam', 'netherlands'], hero: { emoji: '🌷', color: '#FF9800' } },
  { keywords: ['london', 'england', 'uk', 'united kingdom'], hero: { emoji: '🎡', color: '#1565C0' } },
  { keywords: ['germany', 'berlin', 'munich', 'hamburg'], hero: { emoji: '🏰', color: '#F9A825' } },
  { keywords: ['portugal', 'lisbon', 'porto'], hero: { emoji: '🐓', color: '#FF5722' } },
  { keywords: ['norway', 'oslo', 'bergen', 'fjord'], hero: { emoji: '🏔️', color: '#1565C0' } },
  { keywords: ['sweden', 'stockholm', 'gothenburg'], hero: { emoji: '🌲', color: '#2E7D32' } },
  { keywords: ['switzerland', 'zurich', 'geneva', 'bern', 'alps'], hero: { emoji: '🏔️', color: '#1565C0' } },
  { keywords: ['austria', 'vienna', 'salzburg', 'innsbruck'], hero: { emoji: '🎼', color: '#795548' } },
  { keywords: ['croatia', 'dubrovnik', 'split', 'zagreb'], hero: { emoji: '⛵', color: '#0288D1' } },
  { keywords: ['romania', 'bucharest', 'cluj', 'transylvania', 'brasov'], hero: { emoji: '🏰', color: '#1B5E20' } },

  // Middle East & Africa
  { keywords: ['dubai', 'abu dhabi', 'uae', 'emirates'], hero: { emoji: '🏙️', color: '#FFD600' } },
  { keywords: ['egypt', 'cairo', 'luxor', 'hurghada'], hero: { emoji: '🐪', color: '#FF9800' } },
  { keywords: ['morocco', 'marrakech', 'casablanca', 'fez'], hero: { emoji: '🕌', color: '#FF5722' } },
  { keywords: ['south africa', 'cape town', 'johannesburg', 'safari'], hero: { emoji: '🦁', color: '#FF9800' } },

  // Americas
  { keywords: ['new york', 'usa', 'united states', 'america', 'los angeles', 'miami', 'chicago'], hero: { emoji: '🗽', color: '#1565C0' } },
  { keywords: ['mexico', 'cancun', 'mexico city', 'playa del carmen'], hero: { emoji: '🌮', color: '#FF5722' } },
  { keywords: ['brazil', 'rio', 'sao paulo', 'amazon'], hero: { emoji: '🌴', color: '#2E7D32' } },
  { keywords: ['argentina', 'buenos aires', 'patagonia'], hero: { emoji: '🥩', color: '#795548' } },
  { keywords: ['peru', 'lima', 'machu picchu', 'cusco'], hero: { emoji: '🦙', color: '#FF9800' } },
  { keywords: ['canada', 'toronto', 'vancouver', 'montreal'], hero: { emoji: '🍁', color: '#F44336' } },

  // Oceania
  { keywords: ['australia', 'sydney', 'melbourne', 'brisbane', 'cairns'], hero: { emoji: '🦘', color: '#FF9800' } },
  { keywords: ['new zealand', 'auckland', 'queenstown'], hero: { emoji: '🥝', color: '#4CAF50' } },

  // Default fallback
  { keywords: ['beach', 'island', 'tropical'], hero: { emoji: '🏝️', color: '#00BCD4' } },
  { keywords: ['mountain', 'hiking', 'alpine'], hero: { emoji: '🏔️', color: '#607D8B' } },
  { keywords: ['city', 'urban'], hero: { emoji: '🏙️', color: '#607D8B' } },
];

const DEFAULT_HERO: DestinationHero = { emoji: '✈️', color: '#4CAF50' };

/**
 * Returns a hero config for a given destination name/country.
 * Matches case-insensitively against keywords.
 * Returns default travel emoji if no match found.
 */
export function getDestinationHero(destinationName?: string | null, country?: string | null): DestinationHero {
  if (!destinationName && !country) return DEFAULT_HERO;

  const searchStr = [destinationName, country].filter(Boolean).join(' ').toLowerCase();

  for (const mapping of HERO_MAPPINGS) {
    if (mapping.keywords.some(kw => searchStr.includes(kw))) {
      return mapping.hero;
    }
  }

  return DEFAULT_HERO;
}
