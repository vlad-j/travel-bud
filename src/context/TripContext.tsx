import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TripContextType {
  currentTripId: string | null;
  setCurrentTripId: (id: string) => void;
}

const TripContext = createContext<TripContextType>({
  currentTripId: null,
  setCurrentTripId: () => {},
});

// Sync ref - always up to date, no async
export const currentTripIdRef = { current: null as string | null };

export function TripProvider({ children }: { children: React.ReactNode }) {
  const [currentTripId, setCurrentTripIdState] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('currentTripId').then((id) => {
      if (id) {
        setCurrentTripIdState(id);
        currentTripIdRef.current = id;
      }
    });
  }, []);

  function setCurrentTripId(id: string) {
    currentTripIdRef.current = id;  // sync - immediate
    setCurrentTripIdState(id);
    AsyncStorage.setItem('currentTripId', id);
  }

  return (
    <TripContext.Provider value={{ currentTripId, setCurrentTripId }}>
      {children}
    </TripContext.Provider>
  );
}

export function useCurrentTrip() {
  return useContext(TripContext);
}
