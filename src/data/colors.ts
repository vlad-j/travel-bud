// Pastel color system for Ultimate Travel Buddy

export const PASTEL = {
  completed: '#DDF4E4',
  current: '#FFF2C7',
  upcoming: '#EEE4FF',
  flights: '#E3F2FD',
  accommodation: '#F3E5F5',
  food: '#FFF8E1',
  activities: '#E8F5E9',
  shopping: '#FCE4EC',
  transport: '#E3F2FD',
} as const;

export const CATEGORY_BG: Record<string, string> = {
  Accommodation: PASTEL.accommodation,
  Flights: PASTEL.flights,
  Food: PASTEL.food,
  Transport: PASTEL.transport,
  Activities: PASTEL.activities,
  Shopping: PASTEL.shopping,
};

export const STATUS_BG: Record<string, string> = {
  DONE: PASTEL.completed,
  NOW: PASTEL.current,
  UPCOMING: PASTEL.upcoming,
};

export const CATEGORY_COLORS: Record<string, string> = {
  Food: '#FF9800',
  Accommodation: '#9C27B0',
  Transport: '#2196F3',
  Activities: '#4CAF50',
  Shopping: '#F44336',
};
