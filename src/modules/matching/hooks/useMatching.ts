// src/modules/matching/hooks/useMatching.ts

import { useCallback, useState } from 'react';
import { useMatchingStore } from '../store/matchingStore';
import * as matchingApi from '../api/matchingApi';

interface MatchFilters {
  gpxFile: File | null;
  distanceFlexibility: number;
  elevationFlexibility: number;
  safetyMode: string;
}

export const useMatching = () => {
  const {
    filters,
    results,
    selectedRoute,
    searchArea,
    setFilters,
    setResults,
    setSelectedRoute,
    setUploadedGPXRoute,
  } = useMatchingStore();

  const [isMatching, setIsMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performMatch = useCallback(async () => {
    if (!filters.minifiedGpxFile || !searchArea) {
      console.error('Missing required data:', {
        hasMinifiedGpx: !!filters.minifiedGpxFile,
        hasSearchArea: !!searchArea,
      });
      return;
    }

    setIsMatching(true);
    setError(null);

    try {
      console.log('Starting match with minified GPX:', {
        originalFile: filters.gpxFile?.name,
        minifiedFile: filters.minifiedGpxFile.name,
        minifiedSize: (filters.minifiedGpxFile.size / 1024).toFixed(1) + ' KB',
        distanceFlexibility: filters.distanceFlexibility,
        elevationFlexibility: filters.elevationFlexibility,
        safetyMode: filters.safetyMode,
        searchArea,
      });

      const response = await matchingApi.matchRoutes({
        gpxFile: filters.minifiedGpxFile,
        distanceFlexibility: filters.distanceFlexibility,
        elevationFlexibility: filters.elevationFlexibility,
        safetyMode: filters.safetyMode,
        searchArea,
      });

      console.log('Match response:', response);
      
      // Set the input route for display on map
      if (response.inputRoute) {
        setUploadedGPXRoute({
          geometry: response.inputRoute.geometry,
          distance: response.inputRoute.distance,
          elevationGain: response.inputRoute.elevationGain,
          elevationProfile: response.inputRoute.elevationProfile || [],
        });
      }
      
      setResults(response.matches);
    } catch (error) {
      console.error('Match failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to match routes';
      setError(errorMessage);
      setResults([]);
    } finally {
      setIsMatching(false);
    }
  }, [filters, searchArea, setResults, setUploadedGPXRoute]);

  const updateFilters = useCallback((updates: Partial<MatchFilters>) => {
    setFilters(updates);
  }, [setFilters]);

  const clearResults = useCallback(() => {
    setResults([]);
    setSelectedRoute(null);
    setError(null);
  }, [setResults, setSelectedRoute]);

  return {
    filters,
    results,
    selectedRoute,
    isMatching,
    error,
    performMatch,
    updateFilters,
    clearResults,
  };
};