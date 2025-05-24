import { apiClient } from '../../../api/client';

export interface SavedRoute {
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

export interface SaveRouteData {
  name: string;
  tag: string;
  searchArea: any;
  routeData: any;
}

export interface UpdateRouteData {
  name?: string;
}

const libraryEndpoint = '/api/library';
const routeEndpoint = '/api/route';

export const getLibrary = async (): Promise<SavedRoute[]> => {
  const response = await apiClient.get(libraryEndpoint);
  return response.data;
};

export const getRoute = async (id: number): Promise<SavedRoute> => {
  const response = await apiClient.get(`${libraryEndpoint}/${id}`);
  return response.data;
};

export const saveRoute = async (data: SaveRouteData): Promise<SavedRoute> => {
  const response = await apiClient.post(`${routeEndpoint}/${data.routeData.id}/save`, {
    name: data.name,
    tag: data.tag,
    area: data.searchArea,
    ...data.routeData,
  });
  return response.data;
};

export const updateRoute = async (id: number, data: UpdateRouteData): Promise<SavedRoute> => {
  const response = await apiClient.patch(`${libraryEndpoint}/${id}`, data);
  return response.data;
};

export const deleteRoute = async (id: number): Promise<void> => {
  await apiClient.delete(`${libraryEndpoint}/${id}`);
};

export const downloadGPX = async (id: number): Promise<Blob> => {
  const response = await apiClient.get(`${routeEndpoint}/${id}/gpx`, {
    responseType: 'blob',
  });
  return response.data;
};
