import { create } from 'zustand';
import {
  PACKING_CATEGORIES,
  FLIGHTS,
  DOCUMENTS,
  PackingCategory,
  PackingItem,
  Flight,
  Document as TravelDocument,
} from '../data/sampleData';

export interface AccommodationEntry {
  id: string;
  name: string;
  platform: string;
  address: string;
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  bookingRef: string;
  price?: string;
  notes?: string;
  status: 'UPCOMING' | 'NOW' | 'DONE';
  nights?: number;
  priceForStay?: string;
  amenities?: string[];
  photoUrl?: string;
}

const DEFAULT_ACCOMMODATION: AccommodationEntry = {
  id: 'default',
  name: 'Villa Padi Ubud',
  platform: 'Airbnb',
  address: 'Jl. Monkey Forest, Ubud\nGianyar, Bali 80571',
  checkInDate: 'Today',
  checkInTime: '19:00',
  checkOutDate: 'Thu, 16 May',
  checkOutTime: '11:00',
  bookingRef: '#VPU123456',
  status: 'UPCOMING',
  nights: 4,
  priceForStay: '€480',
  amenities: ['WiFi', 'Pool', 'Breakfast', 'AC'],
  photoUrl: 'https://images.pexels.com/photos/3225531/pexels-photo-3225531.jpeg?auto=compress&cs=tinysrgb&w=600',
};

interface AppState {
  packingCategories: PackingCategory[];
  flights: Flight[];
  accommodations: AccommodationEntry[];
  documents: TravelDocument[];

  togglePackingItem: (categoryName: string, itemId: string) => void;
  addPackingItem: (categoryName: string, itemName: string) => void;

  addFlight: (flight: Omit<Flight, 'id'>) => void;
  addAccommodation: (acc: Omit<AccommodationEntry, 'id'>) => void;
  addDocument: (doc: Omit<TravelDocument, 'id'>) => void;
  deleteDocument: (id: string) => void;

  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  packingCategories: PACKING_CATEGORIES,
  flights: FLIGHTS,
  accommodations: [DEFAULT_ACCOMMODATION],
  documents: DOCUMENTS,

  togglePackingItem: (categoryName, itemId) =>
    set((state) => ({
      packingCategories: state.packingCategories.map((cat) =>
        cat.name === categoryName
          ? { ...cat, items: cat.items.map((item) => item.id === itemId ? { ...item, packed: !item.packed } : item) }
          : cat
      ),
    })),

  addPackingItem: (categoryName, itemName) =>
    set((state) => ({
      packingCategories: state.packingCategories.map((cat) =>
        cat.name === categoryName
          ? {
              ...cat,
              items: [
                ...cat.items,
                { id: `${categoryName}-${Date.now()}`, name: itemName, packed: false } as PackingItem,
              ],
            }
          : cat
      ),
    })),

  addFlight: (flight) =>
    set((state) => ({
      flights: [{ ...flight, id: `f-${Date.now()}` }, ...state.flights],
    })),

  addAccommodation: (acc) =>
    set((state) => ({
      accommodations: [{ ...acc, id: `a-${Date.now()}` }, ...state.accommodations],
    })),

  addDocument: (doc) =>
    set((state) => ({
      documents: [{ ...doc, id: `d-${Date.now()}` }, ...state.documents],
    })),

  deleteDocument: (id) =>
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== id),
    })),

  activeTab: 'Home',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
