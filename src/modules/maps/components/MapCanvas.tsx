import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Rectangle, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import DrawRectangle from './DrawRectangle';
import RouteOverlay from './RouteOverlay';
import { useMatchingStore } from '../../matching/store/matchingStore';
import Button from '../../common/components/Button';
import { PencilSquareIcon, MapPinIcon } from '@heroicons/react/24/outline';

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

// Component to handle initial map setup ONLY
const MapInitializer: React.FC<{ uploadedRoute?: any }> = ({ uploadedRoute }) => {
  const map = useMap();
  const [initialized, setInitialized] = useState(false);
  
  useEffect(() => {
    // Only run once on mount
    if (!initialized) {
      setInitialized(true);
      
      // If we have an uploaded route, fit to its bounds
      if (uploadedRoute && uploadedRoute.geometry?.coordinates?.length > 0) {
        const coords = uploadedRoute.geometry.coordinates;
        const bounds = L.latLngBounds(
          coords.map((c: number[]) => [c[1], c[0]] as [number, number])
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      } else {
        // Try to get user location but don't lock to it
        map.locate({ setView: false, maxZoom: 13 });
        
        map.once('locationfound', (e) => {
          // Only set view if map hasn't been interacted with
          if (!map.hasEventListeners('movestart')) {
            map.setView(e.latlng, 13);
          }
        });
      }
    }
  }, [map, initialized, uploadedRoute]);

  return null;
};

const MapCanvas: React.FC<MapCanvasProps> = ({
  routes = [],
  searchArea,
  interactive = true,
  onAreaDrawn,
}) => {
  const [center] = useState<[number, number]>([52.5200, 13.4050]); // Berlin default
  const [isDrawEnabled, setIsDrawEnabled] = useState(false);
  const { filters, setSearchArea, selectedRoute, uploadedGPXRoute } = useMatchingStore();

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

  const handleLocateMe = () => {
    const mapElement = document.querySelector('.leaflet-container');
    if (mapElement && (mapElement as any)._leaflet_map) {
      const map = (mapElement as any)._leaflet_map;
      map.locate({ setView: true, maxZoom: 13 });
    }
  };

  const canDraw = !!filters.gpxFile && interactive && !searchArea;

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={center}
        zoom={11}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
        scrollWheelZoom={true}
        dragging={true}
        zoomControl={true}
        doubleClickZoom={true}
        touchZoom={true}
        boxZoom={true}
        keyboard={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {interactive && <MapInitializer uploadedRoute={uploadedGPXRoute} />}
        
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
        
        {/* Show uploaded GPX route */}
        {uploadedGPXRoute && uploadedGPXRoute.geometry && (
          <Polyline
            positions={uploadedGPXRoute.geometry.coordinates.map((coord: number[]) => 
              [coord[1], coord[0]] as [number, number]
            )}
            pathOptions={{
              color: '#4caf50',
              weight: 4,
              opacity: 0.8,
            }}
          />
        )}
        
        {/* Show search results */}
        {routes.map((route, index) => (
          <RouteOverlay
            key={route.id || index}
            route={route}
            color={selectedRoute?.id === route.id ? '#ff9800' : '#00bcd4'}
            isHighlighted={selectedRoute?.id === route.id}
          />
        ))}
      </MapContainer>
      
      {/* Control Buttons */}
      <div className="absolute top-4 right-4 z-[1000] space-y-2">
        {/* Locate Me Button */}
        <Button
          onClick={handleLocateMe}
          variant="secondary"
          size="small"
          className="gap-2"
        >
          <MapPinIcon className="w-4 h-4" />
          Locate Me
        </Button>
        
        {/* Draw Button */}
        {canDraw && (
          <>
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
          </>
        )}
      </div>
    </div>
  );
};

export default MapCanvas;