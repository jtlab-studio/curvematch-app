import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface SavedRoute {
  id: number;
  name: string;
  tag: string;
  savedAt: string;
  distance: number;
  elevationGain: number;
  gainPerKm: number;
  curveScore: number;
  matchPercentage: number;
  geometry: any;
  elevationProfile: number[];
  searchArea: any;
}

interface LibraryState {
  routes: SavedRoute[];
  selectedRoute: SavedRoute | null;
  isLoading: boolean;
  setRoutes: (routes: SavedRoute[]) => void;
  addRoute: (route: SavedRoute) => void;
  updateRoute: (id: number, updates: Partial<SavedRoute>) => void;
  removeRoute: (id: number) => void;
  setSelectedRoute: (route: SavedRoute | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useLibraryStore = create<LibraryState>()(
  immer((set) => ({
    routes: [],
    selectedRoute: null,
    isLoading: false,
    setRoutes: (routes) =>
      set((state) => {
        state.routes = routes;
      }),
    addRoute: (route) =>
      set((state) => {
        state.routes.push(route);
      }),
    updateRoute: (id, updates) =>
      set((state) => {
        const index = state.routes.findIndex((r: SavedRoute) => r.id === id);
        if (index !== -1) {
          Object.assign(state.routes[index], updates);
        }
      }),
    removeRoute: (id) =>
      set((state) => {
        state.routes = state.routes.filter((r: SavedRoute) => r.id !== id);
      }),
    setSelectedRoute: (route) =>
      set((state) => {
        state.selectedRoute = route;
      }),
    setLoading: (loading) =>
      set((state) => {
        state.isLoading = loading;
      }),
  }))
);
