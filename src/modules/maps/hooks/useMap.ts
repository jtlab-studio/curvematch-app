import { useState, useCallback } from 'react';
import L from 'leaflet';
import { calculateAreaKm2 } from '../utils/mapHelpers';

export const useMap = () => {
  const [userLocation, setUserLocation] = useState<L.LatLng | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const locateUser = useCallback(async (): Promise<L.LatLng> => {
    setIsLocating(true);
    setLocationError(null);

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = 'Geolocation is not supported by your browser';
        setLocationError(error);
        setIsLocating(false);
        reject(new Error(error));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latLng = L.latLng(position.coords.latitude, position.coords.longitude);
          setUserLocation(latLng);
          setIsLocating(false);
          resolve(latLng);
        },
        (error) => {
          let errorMessage = 'Unable to get your location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          setLocationError(errorMessage);
          setIsLocating(false);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  const fitBounds = useCallback((bounds: L.LatLngBounds) => {
    // This would be called by the map component
    // Implementation depends on map instance access
  }, []);

  const calculateArea = useCallback((bounds: L.LatLngBounds): number => {
    return calculateAreaKm2(bounds);
  }, []);

  return {
    userLocation,
    isLocating,
    locationError,
    locateUser,
    fitBounds,
    calculateArea,
  };
};
