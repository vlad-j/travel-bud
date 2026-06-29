import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TripMember {
  id: string;
  name: string | null;
  email: string | null;
  role: 'owner' | 'editor' | 'viewer';
}

export interface TripMetadata {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  cover_destination: string | null;
}

export interface TripDateRange {
  start: string;
  end: string;
  totalDays: number;
}

export interface TripDestination {
  id: string;
  name: string;
  country: string | null;
  nights: number | null;
  order_index: number | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function localDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function calculateCurrentDay(startDate: string): number {
  const [sy, sm, sd] = startDate.split('-').map(Number);
  const startLocal = new Date(sy, sm - 1, sd);
  const now = new Date();
  const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((todayLocal.getTime() - startLocal.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff + 1);
}

function calculateTotalDays(startDate: string, endDate: string): number {
  const [sy, sm, sd] = startDate.split('-').map(Number);
  const [ey, em, ed] = endDate.split('-').map(Number);
  const start = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

// ─── Context shape ────────────────────────────────────────────────────────────

interface TripContextValue {
  // IDs & loading
  currentTripId: string | null;
  isTripLoading: boolean;
  hasActiveTrip: boolean;

  // Core setters (used by HomeScreen carousel)
  setCurrentTripId: (id: string | null) => void;

  // Trip metadata
  currentTripMetadata: TripMetadata | null;

  // Currency
  tripCurrency: string;

  // Members
  tripMembers: TripMember[];

  // Day
  currentDay: number;

  // Destination
  currentDestination: TripDestination | null;

  // Date range
  tripDateRange: TripDateRange | null;

  // Refresh trigger
  refreshTripContext: () => Promise<void>;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const defaultContext: TripContextValue = {
  currentTripId: null,
  isTripLoading: false,
  hasActiveTrip: false,
  setCurrentTripId: () => {},
  currentTripMetadata: null,
  tripCurrency: 'EUR',
  tripMembers: [],
  currentDay: 1,
  currentDestination: null,
  tripDateRange: null,
  currentUserId: null,
  refreshTripContext: async () => {},
};

// ─── Context ──────────────────────────────────────────────────────────────────

const TripContext = createContext<TripContextValue>(defaultContext);

// ─── Mutable ref for sync access (kept for backward compatibility) ─────────────

export const currentTripIdRef: React.MutableRefObject<string | null> = { current: null };

// ─── Provider ─────────────────────────────────────────────────────────────────

export function TripProvider({ children }: { children: React.ReactNode }) {
  const [currentTripId, _setCurrentTripId] = useState<string | null>(null);
  const [isTripLoading, setIsTripLoading] = useState(false);
  const [currentTripMetadata, setCurrentTripMetadata] = useState<TripMetadata | null>(null);
  const [tripCurrency, setTripCurrency] = useState<string>('EUR');
  const [tripMembers, setTripMembers] = useState<TripMember[]>([]);
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [currentDestination, setCurrentDestination] = useState<TripDestination | null>(null);
  const [tripDateRange, setTripDateRange] = useState<TripDateRange | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const hasActiveTrip = currentTripId !== null && currentTripMetadata !== null;

  function setCurrentTripId(id: string | null) {
    currentTripIdRef.current = id;
    _setCurrentTripId(id);
  }

  const loadTripContext = useCallback(async (tripId: string) => {
    setIsTripLoading(true);
    try {
      // Load current user
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);

      // Load trip metadata + currency
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .select('id, name, start_date, end_date, status, cover_destination, currency')
        .eq('id', tripId)
        .single();

      if (tripError || !trip) {
        setCurrentTripMetadata(null);
        setTripCurrency('EUR');
        setTripDateRange(null);
        setCurrentDay(1);
        setCurrentDestination(null);
        setTripMembers([]);
        setIsTripLoading(false);
        return;
      }

      // Set metadata
      setCurrentTripMetadata({
        id: trip.id,
        name: trip.name,
        start_date: trip.start_date,
        end_date: trip.end_date,
        status: trip.status,
        cover_destination: trip.cover_destination ?? null,
      });

      // Set currency
      setTripCurrency(trip.currency ?? 'EUR');

      // Set date range
      const totalDays = calculateTotalDays(trip.start_date, trip.end_date);
      setTripDateRange({
        start: trip.start_date,
        end: trip.end_date,
        totalDays,
      });

      // Set current day
      const day = calculateCurrentDay(trip.start_date);
      setCurrentDay(Math.min(day, totalDays));

      // Load members
      const { data: members } = await supabase
        .from('trip_members')
        .select('user_id, role, profiles:user_id(id, name, email)')
        .eq('trip_id', tripId);

      const mappedMembers: TripMember[] = (members ?? []).map((m: any) => ({
        id: m.user_id,
        name: m.profiles?.name ?? null,
        email: m.profiles?.email ?? null,
        role: m.role ?? 'editor',
      }));
      setTripMembers(mappedMembers);

      // Load destinations to find current destination
      const { data: destinations } = await supabase
        .from('destinations')
        .select('id, name, country, nights, order_index')
        .eq('trip_id', tripId)
        .order('order_index', { ascending: true });

      if (destinations && destinations.length > 0) {
        // Find current destination based on current day
        let dayCounter = 0;
        let currentDest: TripDestination | null = null;
        const currentDayNum = Math.min(day, totalDays);

        for (const dest of destinations) {
          const nights = dest.nights ?? 1;
          dayCounter += nights;
          if (currentDayNum <= dayCounter) {
            currentDest = {
              id: dest.id,
              name: dest.name,
              country: dest.country ?? null,
              nights: dest.nights ?? null,
              order_index: dest.order_index ?? null,
            };
            break;
          }
        }

        // Fallback to last destination if day exceeds all nights
        if (!currentDest) {
          const last = destinations[destinations.length - 1];
          currentDest = {
            id: last.id,
            name: last.name,
            country: last.country ?? null,
            nights: last.nights ?? null,
            order_index: last.order_index ?? null,
          };
        }

        setCurrentDestination(currentDest);
      } else {
        setCurrentDestination(null);
      }

    } catch (e) {
      console.error('TripContext loadTripContext error:', e);
      setCurrentTripMetadata(null);
      setCurrentDestination(null);
    } finally {
      setIsTripLoading(false);
    }
  }, []);

  // Load context whenever tripId changes
  useEffect(() => {
    if (currentTripId) {
      loadTripContext(currentTripId);
    } else {
      // Reset all context when no trip selected
      setCurrentTripMetadata(null);
      setTripCurrency('EUR');
      setTripMembers([]);
      setCurrentDay(1);
      setCurrentDestination(null);
      setTripDateRange(null);
    }
  }, [currentTripId, loadTripContext]);

  const refreshTripContext = useCallback(async () => {
    if (currentTripId) {
      await loadTripContext(currentTripId);
    }
  }, [currentTripId, loadTripContext]);

  return (
    <TripContext.Provider value={{
      currentTripId,
      isTripLoading,
      hasActiveTrip,
      setCurrentTripId,
      currentTripMetadata,
      tripCurrency,
      tripMembers,
      currentDay,
      currentDestination,
      tripDateRange,
      currentUserId,
      refreshTripContext,
    }}>
      {children}
    </TripContext.Provider>
  );
}

// ─── Main hook ────────────────────────────────────────────────────────────────

export function useCurrentTrip() {
  return useContext(TripContext);
}

// ─── Helper hooks ─────────────────────────────────────────────────────────────

/**
 * Returns the active trip's currency.
 * Falls back to 'EUR' if no trip is selected.
 */
export function useTripCurrency(): string {
  const { tripCurrency } = useContext(TripContext);
  return tripCurrency;
}

/**
 * Returns current day info for the active trip.
 * Safe fallbacks when no trip is selected.
 */
export function useTripDay(): {
  currentDay: number;
  totalDays: number;
  startDate: string | null;
  endDate: string | null;
  isToday: boolean;
} {
  const { currentDay, tripDateRange } = useContext(TripContext);

  const now = new Date();
  const todayStr = localDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate()));

  let isToday = false;
  if (tripDateRange) {
    const [sy, sm, sd] = tripDateRange.start.split('-').map(Number);
    const currentDayDate = new Date(sy, sm - 1, sd + currentDay - 1);
    isToday = localDateStr(currentDayDate) === todayStr;
  }

  return {
    currentDay,
    totalDays: tripDateRange?.totalDays ?? 0,
    startDate: tripDateRange?.start ?? null,
    endDate: tripDateRange?.end ?? null,
    isToday,
  };
}
