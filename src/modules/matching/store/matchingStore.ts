// src/modules/matching/store/matchingStore.ts

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { GPXAnalysis } from '../../../utils/gpxMinifier';

interface MatchFilters {
  gpxFile: File | null;
  minifiedGpxFile: File | null; // Cached minified version
  gpxAnalysis: GPXAnalysis | null; // Analysis results
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
  isProcessingGPX: boolean;
  setFilters: (filters: Partial<MatchFilters>) => void;
  setGPXData: (originalFile: File, minifiedFile: File, analysis: GPXAnalysis) => void;
  setResults: (results: RouteMatch[]) => void;
  setSelectedRoute: (route: RouteMatch | null) => void;
  setSearchArea: (bounds: Bounds | null) => void;
  setProcessingGPX: (processing: boolean) => void;
  resetFilters: () => void;
}

const defaultFilters: MatchFilters = {
  gpxFile: null,
  minifiedGpxFile: null,
  gpxAnalysis: null,
  distanceFlexibility: 10,
  elevationFlexibility: 10,
  safetyMode: 'Moderate',
};

export const useMatchingStore = create<MatchingState>()(
  immer((set) => ({
    filters: { ...defaultFilters },
    results: [],
    selectedRoute: null,
    searchArea: null,
    isProcessingGPX: false,
    
    setFilters: (updates) =>
      set((state) => {
        Object.assign(state.filters, updates);
      }),
      
    setGPXData: (originalFile, minifiedFile, analysis) =>
      set((state) => {
        state.filters.gpxFile = originalFile;
        state.filters.minifiedGpxFile = minifiedFile;
        state.filters.gpxAnalysis = analysis;
        state.isProcessingGPX = false;
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
      
    setProcessingGPX: (processing) =>
      set((state) => {
        state.isProcessingGPX = processing;
      }),
      
    resetFilters: () =>
      set((state) => {
        state.filters = { ...defaultFilters };
        state.searchArea = null;
        state.results = [];
        state.selectedRoute = null;
        state.isProcessingGPX = false;
      }),
  }))
);