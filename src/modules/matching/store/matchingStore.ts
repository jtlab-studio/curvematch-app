// src/modules/matching/store/matchingStore.ts

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { GPXAnalysis } from '../../../utils/gpxMinifier';

interface MatchFilters {
  gpxFile: File | null;
  minifiedGpxFile: File | null;
  gpxAnalysis: GPXAnalysis | null;
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

interface UploadedRoute {
  geometry: any;
  distance: number;
  elevationGain: number;
  elevationProfile: number[];
}

interface MatchingState {
  filters: MatchFilters;
  results: RouteMatch[];
  selectedRoute: RouteMatch | null;
  searchArea: Bounds | null;
  isProcessingGPX: boolean;
  uploadedGPXRoute: UploadedRoute | null;
  setFilters: (filters: Partial<MatchFilters>) => void;
  setGPXData: (originalFile: File, minifiedFile: File, analysis: GPXAnalysis) => void;
  setResults: (results: RouteMatch[]) => void;
  setSelectedRoute: (route: RouteMatch | null) => void;
  setSearchArea: (bounds: Bounds | null) => void;
  setProcessingGPX: (processing: boolean) => void;
  setUploadedGPXRoute: (route: UploadedRoute | null) => void;
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
    uploadedGPXRoute: null,
    
    setFilters: (updates) =>
      set((state) => {
        Object.assign(state.filters, updates);
        // Clear uploaded route if GPX is removed
        if (updates.gpxFile === null) {
          state.uploadedGPXRoute = null;
        }
      }),
      
    setGPXData: (originalFile, minifiedFile, analysis) =>
      set((state) => {
        state.filters.gpxFile = originalFile;
        state.filters.minifiedGpxFile = minifiedFile;
        state.filters.gpxAnalysis = analysis;
        state.isProcessingGPX = false;
        
        // Set uploaded route for display on map
        state.uploadedGPXRoute = {
          geometry: {
            type: 'LineString',
            coordinates: [] // This would be populated from the GPX parsing
          },
          distance: analysis.distance,
          elevationGain: analysis.elevationGain,
          elevationProfile: [],
        };
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
      
    setUploadedGPXRoute: (route) =>
      set((state) => {
        state.uploadedGPXRoute = route;
      }),
      
    resetFilters: () =>
      set((state) => {
        state.filters = { ...defaultFilters };
        state.searchArea = null;
        state.results = [];
        state.selectedRoute = null;
        state.isProcessingGPX = false;
        state.uploadedGPXRoute = null;
      }),
  }))
);