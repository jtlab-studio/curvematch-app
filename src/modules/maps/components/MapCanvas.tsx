import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import DrawControl from './DrawControl';
import RouteOverlay from './RouteOverlay';
import { useMap } from '../hooks/useMap';
import { useMatchingStore } from '../../matching/store/matchingStore';

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

interface MapCanvasProps {
  routes?: any[];
  searchArea?: any;
  interactive?: boolean;
  onAreaDrawn?: (bounds: any) => void;
}

const MapEvents: React.FC<{ onLocationFound: (e: any) => void }> = ({ onLocationFound }) => {
  const map = useMapEvents({
    locationfound: onLocationFound,
  });

  useEffect(() => {
    map.locate({ setView: true, maxZoom: 13 });
  }, [map]);

  return null;
};

const MapCanvas: React.FC<MapCanvasProps> = ({
  routes = [],
  searchArea,
  interactive = true,
  onAreaDrawn,
}) => {
  const [center, setCenter] = useState<[number, number]>([52.5200, 13.4050]); // Berlin
  const [zoom, setZoom] = useState(11);
  const [isDrawEnabled, setIsDrawEnabled] = useState(false);
  const { locateUser } = useMap();
  const { filters, setSearchArea } = useMatchingStore();

  const handleLocationFound = (e: L.LocationEvent) => {
    setCenter([e.latlng.lat, e.latlng.lng]);
  };

  const handleAreaDrawn = (bounds: L.LatLngBounds) => {
    const area = {
      west: bounds.getWest(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      north: bounds.getNorth(),
    };
    setSearchArea(area);
    onAreaDrawn?.(area);
    setIsDrawEnabled(false);
  };

  useEffect(() => {
    // Enable drawing when filters are ready
    setIsDrawEnabled(!!filters.gpxFile && interactive);
  }, [filters.gpxFile, interactive]);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="w-full h-full"
      style={{ minHeight: '400px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {interactive && <MapEvents onLocationFound={handleLocationFound} />}
      
      {interactive && isDrawEnabled && (
        <DrawControl onAreaDrawn={handleAreaDrawn} />
      )}
      
      {searchArea && (
        <L.Rectangle
          bounds={[
            [searchArea.south, searchArea.west],
            [searchArea.north, searchArea.east],
          ]}
          pathOptions={{
            color: '#ff9800',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.1,
          }}
        />
      )}
      
      {routes.map((route, index) => (
        <RouteOverlay
          key={route.id || index}
          route={route}
          color={index === 0 ? '#2196f3' : '#00bcd4'}
          isHighlighted={false}
        />
      ))}
    </MapContainer>
  );
};

export default MapCanvas;
