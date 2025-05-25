import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Rectangle, useMap } from 'react-leaflet';
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

// Component to handle map location and zoom
const MapLocationHandler: React.FC<{ onLocationFound: (e: any) => void }> = ({ onLocationFound }) => {
  const map = useMap();
  
  useEffect(() => {
    // Try to get user location
    map.locate({ setView: false });
    
    // Listen for location found
    map.on('locationfound', (e) => {
      onLocationFound(e);
      
      // Calculate zoom level for 10km width
      // At zoom level 13, the width is approximately 10km at most latitudes
      const zoomFor10km = 13;
      map.setView(e.latlng, zoomFor10km);
    });
    
    // Handle location error - fallback to default
    map.on('locationerror', () => {
      console.log('Location access denied, using default location');
      // Default zoom for 10km width
      map.setZoom(13);
    });
  }, [map, onLocationFound]);

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
  const { filters, setSearchArea, selectedRoute } = useMatchingStore();

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
        zoom={13} // Default zoom for ~10km width
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {interactive && <MapLocationHandler onLocationFound={handleLocationFound} />}
        
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
        
        {/* Show search results only */}
        {routes.map((route, index) => (
          <RouteOverlay
            key={route.id || index}
            route={route}
            color={selectedRoute?.id === route.id ? '#ff9800' : '#00bcd4'} // Orange for selected
            isHighlighted={selectedRoute?.id === route.id}
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
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Max area: 500 km² • Right-click to cancel
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MapCanvas;