import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface MatchFilters {
  gpxFile: File | null;
  distanceFlexibility: number;
  elevationFlexibility: number;
  safetyMode: string;
}

interface Bounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

interface RouteMatch {
  id: string;
  name: string;
  distance: number;
  elevationGain: number;
  gainPerKm: number;
  matchPercentage: number;
  curveScore: number;
  geometry: any;
  elevationProfile: number[];
}

interface MatchingState {
  filters: MatchFilters;
  results: RouteMatch[];
  selectedRoute: RouteMatch | null;
  searchArea: Bounds | null;
  setFilters: (filters: Partial<MatchFilters>) => void;
  setResults: (results: RouteMatch[]) => void;
  setSelectedRoute: (route: RouteMatch | null) => void;
  setSearchArea: (bounds: Bounds | null) => void;
}

export const useMatchingStore = create<MatchingState>()(
  immer((set) => ({
    filters: {
      gpxFile: null,
      distanceFlexibility: 10,
      elevationFlexibility: 10,
      safetyMode: 'Moderate',
    },
    results: [],
    selectedRoute: null,
    searchArea: null,
    setFilters: (updates) =>
      set((state) => {
        Object.assign(state.filters, updates);
      }),
    setResults: (results) =>
      set((state) => {
        state.results = results;
      }),
    setSelectedRoute: (route) =>
      set((state) => {
        state.selectedRoute = route;
      }),
    setSearchArea: (bounds) =>
      set((state) => {
        state.searchArea = bounds;
      }),
  }))
);
