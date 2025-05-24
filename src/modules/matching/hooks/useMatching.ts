import { useCallback } from 'react';
import useSWR from 'swr';
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

  const { data, error, mutate, isValidating } = useSWR(
    filters.gpxFile && searchArea ? ['match', filters, searchArea] : null,
    null,
    { revalidateOnFocus: false }
  );

  const performMatch = useCallback(async () => {
    if (!filters.gpxFile || !searchArea) return;

    try {
      const response = await matchingApi.matchRoutes({
        gpxFile: filters.gpxFile,
        distanceFlexibility: filters.distanceFlexibility,
        elevationFlexibility: filters.elevationFlexibility,
        safetyMode: filters.safetyMode,
        searchArea,
      });
      setResults(response.matches);
    } catch (error) {
      console.error('Match failed:', error);
      setResults([]);
    }
  }, [filters, searchArea, setResults]);

  const updateFilters = useCallback((updates: Partial<MatchFilters>) => {
    setFilters(updates);
  }, [setFilters]);

  const clearResults = useCallback(() => {
    setResults([]);
    setSelectedRoute(null);
  }, [setResults, setSelectedRoute]);

  return {
    filters,
    results,
    selectedRoute,
    isMatching: isValidating,
    performMatch,
    updateFilters,
    clearResults,
  };
};
