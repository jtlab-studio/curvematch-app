import { apiClient } from '../../../api/client';

export interface MatchRequest {
  gpxFile: File;
  distanceFlexibility: number;
  elevationFlexibility: number;
  safetyMode: string;
  searchArea: {
    west: number;
    south: number;
    east: number;
    north: number;
  };
}

export interface RouteMatch {
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

export interface MatchResponse {
  matches: RouteMatch[];
}

const matchEndpoint = '/api/match';

export const matchRoutes = async (data: MatchRequest): Promise<MatchResponse> => {
  const formData = new FormData();
  formData.append('gpxFile', data.gpxFile);
  formData.append('distanceFlexibility', data.distanceFlexibility.toString());
  formData.append('elevationFlexibility', data.elevationFlexibility.toString());
  formData.append('safetyMode', data.safetyMode);
  formData.append('searchArea', JSON.stringify(data.searchArea));

  const response = await apiClient.post(matchEndpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};
