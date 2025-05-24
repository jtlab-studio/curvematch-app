import { useCallback } from 'react';
import useSWR from 'swr';
import { useLibraryStore } from '../store/libraryStore';
import * as libraryApi from '../api/libraryApi';

export const useLibrary = () => {
  const {
    routes,
    selectedRoute,
    setRoutes,
    addRoute,
    updateRoute,
    removeRoute,
  } = useLibraryStore();

  const { data, error, mutate, isValidating } = useSWR(
    'library',
    libraryApi.getLibrary,
    {
      onSuccess: (data) => setRoutes(data),
      revalidateOnFocus: false,
    }
  );

  const saveRoute = useCallback(async (route: any, name: string) => {
    const savedRoute = await libraryApi.saveRoute({
      name,
      tag: route.originalGpxName || 'Unknown',
      searchArea: route.searchArea,
      routeData: route,
    });
    addRoute(savedRoute);
    await mutate();
    return savedRoute;
  }, [addRoute, mutate]);

  const deleteRoute = useCallback(async (id: number) => {
    await libraryApi.deleteRoute(id);
    removeRoute(id);
    await mutate();
  }, [removeRoute, mutate]);

  const downloadGPX = useCallback(async (id: number) => {
    const blob = await libraryApi.downloadGPX(id);
    const route = routes.find(r => r.id === id);
    const filename = route ? `${route.name}.gpx` : 'route.gpx';
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [routes]);

  const updateRouteName = useCallback(async (id: number, name: string) => {
    const updated = await libraryApi.updateRoute(id, { name });
    updateRoute(id, updated);
    await mutate();
  }, [updateRoute, mutate]);

  return {
    routes: routes || [],
    selectedRoute,
    isLoading: !data && !error,
    error,
    saveRoute,
    deleteRoute,
    downloadGPX,
    updateRouteName,
  };
};
