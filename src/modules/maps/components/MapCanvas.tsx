import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMapEvents, Rectangle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import DrawRectangle from './DrawRectangle';
import RouteOverlay from './RouteOverlay';
import { useMatchingStore } from '../../matching/store/matchingStore';
import Button from '../../common/components/Button';
import { PencilSquareIcon } from '@heroicons/react/24/outline';

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
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
  const [isDrawEnabled, setIsDrawEnabled] = useState(false);
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

  const canDraw = !!filters.gpxFile && interactive && !searchArea;

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={center}
        zoom={11}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {interactive && <MapEvents onLocationFound={handleLocationFound} />}
        
        {interactive && (
          <DrawRectangle 
            isEnabled={isDrawEnabled} 
            onAreaDrawn={handleAreaDrawn} 
          />
        )}
        
        {searchArea && (
          <Rectangle
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
      
      {/* Draw Button */}
      {canDraw && (
        <div className="absolute top-4 right-4 z-[1000]">
          <Button
            onClick={() => setIsDrawEnabled(!isDrawEnabled)}
            variant={isDrawEnabled ? 'primary' : 'secondary'}
            className="gap-2"
          >
            <PencilSquareIcon className="w-5 h-5" />
            {isDrawEnabled ? 'Cancel Drawing' : 'Draw Search Area'}
          </Button>
          {isDrawEnabled && (
            <div className="mt-2 p-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg">
              <p className="text-sm font-medium">Click to set corners</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Right-click to cancel</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MapCanvas;
