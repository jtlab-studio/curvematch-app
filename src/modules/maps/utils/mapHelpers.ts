import L from 'leaflet';

const EARTH_RADIUS_KM = 6371;

export const calculateAreaKm2 = (bounds: L.LatLngBounds): number => {
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  
  // Convert to radians
  const lat1 = sw.lat * Math.PI / 180;
  const lat2 = ne.lat * Math.PI / 180;
  const lon1 = sw.lng * Math.PI / 180;
  const lon2 = ne.lng * Math.PI / 180;
  
  // Calculate area using spherical approximation
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  
  const avgLat = (lat1 + lat2) / 2;
  const width = EARTH_RADIUS_KM * dLon * Math.cos(avgLat);
  const height = EARTH_RADIUS_KM * dLat;
  
  return Math.abs(width * height);
};

export const boundsToGeoJSON = (bounds: L.LatLngBounds): GeoJSON.Feature => {
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  const nw = L.latLng(ne.lat, sw.lng);
  const se = L.latLng(sw.lat, ne.lng);
  
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [sw.lng, sw.lat],
        [nw.lng, nw.lat],
        [ne.lng, ne.lat],
        [se.lng, se.lat],
        [sw.lng, sw.lat], // Close the polygon
      ]],
    },
  };
};

export const latLngToWKT = (latLng: L.LatLng): string => {
  return `POINT(${latLng.lng} ${latLng.lat})`;
};

export const polylineToGeoJSON = (polyline: L.Polyline): GeoJSON.Feature => {
  const latLngs = polyline.getLatLngs() as L.LatLng[];
  const coordinates = latLngs.map(ll => [ll.lng, ll.lat]);
  
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates,
    },
  };
};
