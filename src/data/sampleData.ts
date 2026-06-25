export type ActivityStatus = 'DONE' | 'NOW' | 'UPCOMING';

export interface Activity {
  id: string;
  time: string;
  title: string;
  status: ActivityStatus;
  icon: string;
  iconBg: string;
  subtitle?: string;
}

export interface BudgetCategory {
  name: string;
  spent: number;
  total: number;
  percentage: number;
  color: string;
  icon: string;
}

export interface Expense {
  id: string;
  name: string;
  time: string;
  amount: number;
  icon: string;
  iconBg: string;
}

export interface JournalEntry {
  id: string;
  location: string;
  time: string;
  note: string;
  photoUrl?: string;
  day: number;
  dayLabel: string;
  emoji: string;
}

export interface PackingItem {
  id: string;
  name: string;
  packed: boolean;
}

export interface PackingCategory {
  name: string;
  items: PackingItem[];
}

export interface Document {
  id: string;
  name: string;
  detail: string;
  icon: string;
  iconBg: string;
  savedOffline: boolean;
}

export interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  from: string;
  fromCity: string;
  to: string;
  toCity: string;
  departure: string;
  arrival: string;
  terminal: string;
  gate: string;
  seat: string;
  bookingRef: string;
  status: 'UPCOMING' | 'COMPLETED' | 'NOW';
  departureDate: string;
}

export interface MapPlace {
  id: string;
  name: string;
  nights: number;
  activities: number;
  budgetSpent: number;
  x: number;
  y: number;
}

export const USER = {
  name: 'Vlad',
  partner: 'Raul',
  avatar: '👨',
};

export const TRIP = {
  name: 'Java → Bali → Lombok',
  currentDay: 8,
  totalDays: 28,
  location: 'Yogyakarta',
  temperature: 31,
  startDate: 'May 9',
  endDate: 'Jun 5',
  status: 'UPCOMING' as const,
  days: 28,
  destinations: 4,
  flights: 7,
  budget: 2000,
  used: 62,
  distance: 1240,
  weather: '28° – 32°C',
  weatherDesc: 'Mostly sunny',
};

export const TODAY_ACTIVITIES: Activity[] = [
  {
    id: '1',
    time: '08:00',
    title: 'Borobudur Temple',
    status: 'DONE',
    icon: '🛕',
    iconBg: '#E8F5E9',
  },
  {
    id: '2',
    time: '13:30',
    title: 'Lunch at Jejamuran',
    status: 'NOW',
    icon: '🍜',
    iconBg: '#FFF3E0',
  },
  {
    id: '3',
    time: '16:00',
    title: 'Transfer to Airport',
    status: 'UPCOMING',
    icon: '🚗',
    iconBg: '#E3F2FD',
  },
  {
    id: '4',
    time: '18:20',
    title: 'Flight to Bali GA408',
    status: 'UPCOMING',
    icon: '✈️',
    iconBg: '#EDE7F6',
  },
  {
    id: '5',
    time: '19:00',
    title: 'Check-in Villa Padi Ubud',
    status: 'UPCOMING',
    icon: '🏡',
    iconBg: '#FCE4EC',
  },
];

export const BUDGET = {
  total: 2000,
  spent: 1240,
  remaining: 760,
  todaySpending: 47,
  partnerOwes: 48,
  percentUsed: 62,
};

export const BUDGET_CATEGORIES: BudgetCategory[] = [
  { name: 'Food', spent: 420, total: 2000, percentage: 34, color: '#FF9800', icon: '🍽️' },
  { name: 'Transport', spent: 320, total: 2000, percentage: 26, color: '#2196F3', icon: '🚗' },
  { name: 'Accommodation', spent: 380, total: 2000, percentage: 31, color: '#9C27B0', icon: '🏡' },
  { name: 'Activities', spent: 90, total: 2000, percentage: 7, color: '#4CAF50', icon: '🎯' },
  { name: 'Shopping', spent: 30, total: 2000, percentage: 2, color: '#F44336', icon: '🛍️' },
];

export const RECENT_EXPENSES: Expense[] = [
  { id: '1', name: 'Lunch Jejamuran', time: 'Today, 13:30', amount: 12, icon: '🍜', iconBg: '#FFF3E0' },
  { id: '2', name: 'Borobudur Tickets', time: 'Today, 08:00', amount: 25, icon: '🛕', iconBg: '#E8F5E9' },
  { id: '3', name: 'Taxi to Temple', time: 'Today, 07:30', amount: 8, icon: '🚗', iconBg: '#E3F2FD' },
  { id: '4', name: 'Hotel Yogyakarta', time: 'Yesterday', amount: 65, icon: '🏨', iconBg: '#EDE7F6' },
];

export const JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: '1',
    location: 'Borobudur Temple',
    time: '08:00',
    note: 'Amazing sunrise! 🌅\nLots of tourists but totally worth it.',
    photoUrl: 'https://images.pexels.com/photos/1008155/pexels-photo-1008155.jpeg?auto=compress&cs=tinysrgb&w=200',
    day: 8,
    dayLabel: 'Today · Day 8',
    emoji: '🛕',
  },
  {
    id: '2',
    location: 'Lunch at Jejamuran',
    time: '13:30',
    note: 'So delicious! 🤤\nBest mushroom noodles ever.',
    photoUrl: 'https://images.pexels.com/photos/1907228/pexels-photo-1907228.jpeg?auto=compress&cs=tinysrgb&w=200',
    day: 8,
    dayLabel: 'Today · Day 8',
    emoji: '🍜',
  },
  {
    id: '3',
    location: 'Prambanan Temple',
    time: '16:30',
    note: 'Beautiful complex and less crowded in the late afternoon.',
    photoUrl: 'https://images.pexels.com/photos/3217677/pexels-photo-3217677.jpeg?auto=compress&cs=tinysrgb&w=200',
    day: 7,
    dayLabel: 'Yesterday · Day 7',
    emoji: '🛕',
  },
];

export const ITINERARY_DAYS = [6, 7, 8, 9, 10];
export const SELECTED_DAY = 8;

export const ITINERARY_ACTIVITIES: Activity[] = [
  {
    id: '1',
    time: '08:00',
    title: 'Borobudur Temple',
    subtitle: 'Completed',
    status: 'DONE',
    icon: '🛕',
    iconBg: '#E8F5E9',
  },
  {
    id: '2',
    time: '13:30',
    title: 'Lunch at Jejamuran',
    status: 'NOW',
    icon: '🍜',
    iconBg: '#FFF3E0',
  },
  {
    id: '3',
    time: '16:00',
    title: 'Transfer to Airport',
    status: 'UPCOMING',
    icon: '🚗',
    iconBg: '#E3F2FD',
  },
  {
    id: '4',
    time: '18:20',
    title: 'Flight to Bali',
    subtitle: 'Garuda Indonesia · GA408',
    status: 'UPCOMING',
    icon: '✈️',
    iconBg: '#EDE7F6',
  },
  {
    id: '5',
    time: '19:00',
    title: 'Check-in Villa Padi Ubud',
    subtitle: 'Ubud, Bali',
    status: 'UPCOMING',
    icon: '🏡',
    iconBg: '#FCE4EC',
  },
];

export const MAP_PLACES: MapPlace[] = [
  { id: '1', name: 'Yogyakarta', nights: 4, activities: 6, budgetSpent: 320, x: 0.35, y: 0.55 },
  { id: '2', name: 'Bali', nights: 8, activities: 14, budgetSpent: 580, x: 0.62, y: 0.58 },
  { id: '3', name: 'Lombok', nights: 5, activities: 9, budgetSpent: 280, x: 0.82, y: 0.52 },
];

export const ACCOMMODATION = {
  name: 'Villa Padi Ubud',
  status: 'UPCOMING' as ActivityStatus,
  checkInTime: '19:00',
  checkInDay: 'Today',
  checkOutTime: '11:00',
  checkOutDay: 'Thu, 16 May',
  address: 'Jl. Monkey Forest, Ubud\nGianyar, Bali 80571',
  bookingRef: '#VPU123456',
  heroUrl: 'https://images.pexels.com/photos/3225531/pexels-photo-3225531.jpeg?auto=compress&cs=tinysrgb&w=600',
};

export const FLIGHTS: Flight[] = [
  {
    id: '1',
    airline: 'Garuda Indonesia',
    flightNumber: 'GA408',
    from: 'YOG',
    fromCity: 'Yogyakarta',
    to: 'DPS',
    toCity: 'Bali (Denpasar)',
    departure: '18:20',
    arrival: '19:45',
    terminal: 'Terminal 1',
    gate: 'Gate 3',
    seat: '14A',
    bookingRef: 'ABCDEF',
    status: 'UPCOMING',
    departureDate: 'Today',
  },
  {
    id: '2',
    airline: 'Turkish Airlines',
    flightNumber: 'TK57',
    from: 'IST',
    fromCity: 'Istanbul',
    to: 'CGK',
    toCity: 'Jakarta',
    departure: '10:00',
    arrival: '23:45',
    terminal: 'Terminal 2',
    gate: 'Gate 12',
    seat: '22C',
    bookingRef: 'GHIJKL',
    status: 'COMPLETED',
    departureDate: 'May 9',
  },
];

export const PACKING_CATEGORIES: PackingCategory[] = [
  {
    name: 'Essentials',
    items: [
      { id: 'e1', name: 'Passport', packed: true },
      { id: 'e2', name: 'Travel documents', packed: true },
      { id: 'e3', name: 'Wallet', packed: true },
      { id: 'e4', name: 'Phone & charger', packed: true },
      { id: 'e5', name: 'Power adapter', packed: false },
      { id: 'e6', name: 'Medication', packed: true },
    ],
  },
  {
    name: 'Clothes',
    items: [
      { id: 'c1', name: 'T-shirts', packed: true },
      { id: 'c2', name: 'Shorts', packed: true },
      { id: 'c3', name: 'Swimwear', packed: false },
      { id: 'c4', name: 'Sandals', packed: false },
    ],
  },
  {
    name: 'Toiletries',
    items: [
      { id: 't1', name: 'Sunscreen SPF50', packed: false },
      { id: 't2', name: 'Toothbrush', packed: true },
      { id: 't3', name: 'Shampoo', packed: true },
    ],
  },
];

export const DOCUMENTS: Document[] = [
  {
    id: '1',
    name: 'Passport',
    detail: 'Vlad Popescu · Expires 12 Jul 2032',
    icon: '📘',
    iconBg: '#E3F2FD',
    savedOffline: true,
  },
  {
    id: '2',
    name: 'Travel Insurance',
    detail: 'SafetyWing · Policy #12345678',
    icon: '🛡️',
    iconBg: '#E8F5E9',
    savedOffline: true,
  },
  {
    id: '3',
    name: 'Flight Tickets',
    detail: '2 tickets · Saved offline',
    icon: '✈️',
    iconBg: '#F3E5F5',
    savedOffline: true,
  },
  {
    id: '4',
    name: 'Hotel Confirmations',
    detail: '3 bookings · Saved offline',
    icon: '🏨',
    iconBg: '#EDE7F6',
    savedOffline: true,
  },
  {
    id: '5',
    name: 'Visa',
    detail: 'Indonesia E-Visa',
    icon: '📋',
    iconBg: '#FFF8E1',
    savedOffline: false,
  },
];
