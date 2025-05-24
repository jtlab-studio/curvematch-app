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
  } = useMatchingStore();

  const [isMatching, setIsMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performMatch = useCallback(async () => {
    if (!filters.gpxFile || !searchArea) return;

    setIsMatching(true);
    setError(null);

    try {
      console.log('Starting match with:', {
        gpxFile: filters.gpxFile.name,
        distanceFlexibility: filters.distanceFlexibility,
        elevationFlexibility: filters.elevationFlexibility,
        safetyMode: filters.safetyMode,
        searchArea,
      });

      const response = await matchingApi.matchRoutes({
        gpxFile: filters.gpxFile,
        distanceFlexibility: filters.distanceFlexibility,
        elevationFlexibility: filters.elevationFlexibility,
        safetyMode: filters.safetyMode,
        searchArea,
      });

      console.log('Match response:', response);
      setResults(response.matches);
    } catch (error) {
      console.error('Match failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to match routes';
      setError(errorMessage);
      setResults([]);
    } finally {
      setIsMatching(false);
    }
  }, [filters, searchArea, setResults]);

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
