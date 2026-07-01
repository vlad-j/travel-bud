// ─── Packing Category Registry — extensible, searchable ───────────────────────
// Mirrors the pattern used by ActivityCategoryPicker so Packing feels
// consistent with Add Activity / Add Expense.

export interface PackingCategoryDef {
  key: string;
  label: string;
  subtitle: string;
  emoji: string;
  color: string;
  bg: string;
}

export const PACKING_CATEGORIES: PackingCategoryDef[] = [
  { key: 'Essentials',   label: 'Essentials',    subtitle: 'Must-have items for any trip',   emoji: '⭐', color: '#FF9800', bg: '#FFF3E0' },
  { key: 'Clothes',      label: 'Clothes',       subtitle: 'Clothing and accessories',       emoji: '👕', color: '#2196F3', bg: '#E3F2FD' },
  { key: 'Shoes',        label: 'Shoes',         subtitle: 'Footwear for every occasion',    emoji: '👟', color: '#795548', bg: '#EFEBE9' },
  { key: 'Accessories',  label: 'Accessories',   subtitle: 'Jewelry, belts, hats and more',  emoji: '👜', color: '#E91E63', bg: '#FCE4EC' },
  { key: 'Toiletries',   label: 'Toiletries',    subtitle: 'Personal care and hygiene',      emoji: '🧴', color: '#00BCD4', bg: '#E0F7FA' },
  { key: 'Medication',   label: 'Medication',    subtitle: 'Medicine and health items',      emoji: '💊', color: '#F44336', bg: '#FFEBEE' },
  { key: 'Electronics',  label: 'Electronics',   subtitle: 'Gadgets and tech accessories',   emoji: '💻', color: '#FF9800', bg: '#FFF3E0' },
  { key: 'Chargers',     label: 'Chargers',      subtitle: 'Cables, plugs and power banks',  emoji: '🔌', color: '#607D8B', bg: '#ECEFF1' },
  { key: 'Camera',       label: 'Camera',        subtitle: 'Photo and video gear',           emoji: '📷', color: '#3F51B5', bg: '#E8EAF6' },
  { key: 'Documents',    label: 'Documents',     subtitle: 'Travel documents and papers',    emoji: '📄', color: '#4CAF50', bg: '#E8F5E9' },
  { key: 'Entertainment',label: 'Entertainment', subtitle: 'Books, games and downtime',      emoji: '🎧', color: '#9C27B0', bg: '#F3E5F5' },
  { key: 'Snacks',       label: 'Snacks',        subtitle: 'Food for the road',              emoji: '🍫', color: '#8D6E63', bg: '#EFEBE9' },
  { key: 'Beach',        label: 'Beach',         subtitle: 'Swimwear, sunscreen and towels', emoji: '🏖️', color: '#03A9F4', bg: '#E1F5FE' },
  { key: 'Winter Gear',  label: 'Winter Gear',   subtitle: 'Warm layers and cold-weather kit',emoji: '🧤', color: '#5C6BC0', bg: '#E8EAF6' },
  { key: 'Baby',         label: 'Baby',          subtitle: 'Everything for little travelers',emoji: '🍼', color: '#F06292', bg: '#FCE4EC' },
  { key: 'Pets',         label: 'Pets',          subtitle: 'Supplies for furry companions',  emoji: '🐾', color: '#8D6E63', bg: '#EFEBE9' },
  { key: 'Other',        label: 'Other',         subtitle: 'Miscellaneous items',            emoji: '🎒', color: '#9E9E9E', bg: '#F5F5F5' },
];

export function getPackingCategoryDef(key: string): PackingCategoryDef {
  return (
    PACKING_CATEGORIES.find((c) => c.key === key) ??
    PACKING_CATEGORIES.find((c) => c.key === 'Other')!
  );
}

// Canonical "Trip Essentials" — always shown at the top regardless of
// whether the user has added them yet. Tapping an unchecked one creates
// the underlying packing_items row (category: Essentials) and marks it
// packed in a single action.
export interface TripEssentialDef {
  key: string;
  label: string;
  emoji: string;
  // Optional link to the Documents module — if a document with one of
  // these `type` values exists for the trip, we show a "Linked" hint.
  linkedDocType?: string;
}

export const TRIP_ESSENTIALS: TripEssentialDef[] = [
  { key: 'Passport', label: 'Passport', emoji: '📔', linkedDocType: 'Passport' },
  { key: 'Wallet', label: 'Wallet', emoji: '👛' },
  { key: 'Phone', label: 'Phone', emoji: '📱' },
  { key: 'Charger', label: 'Charger', emoji: '🔌' },
  { key: 'Boarding Pass', label: 'Boarding Pass', emoji: '🎫', linkedDocType: 'Flight Ticket' },
];
