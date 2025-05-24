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

  console.log('Sending match request with form data');
  
  try {
    // Don't set Content-Type header - let axios set it automatically with boundary
    const response = await apiClient.post(matchEndpoint, formData, {
      headers: {
        // Remove explicit Content-Type to let axios handle multipart boundary
      },
      // Add timeout to prevent hanging
      timeout: 30000,
      // Ensure axios knows this is form data
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    return response.data;
  } catch (error: any) {
    console.error('Match API error:', error);
    
    // More detailed error handling
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please try again.');
    }
    if (error.code === 'ERR_NETWORK') {
      throw new Error('Network error. Please check if the backend is running.');
    }
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    if (error.response?.status === 413) {
      throw new Error('File too large. Please use a smaller GPX file.');
    }
    if (error.response?.status === 415) {
      throw new Error('Invalid file type. Please upload a GPX file.');
    }
    
    throw new Error('Failed to match routes. Please check your connection.');
  }
};