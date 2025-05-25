import React from 'react';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import Modal from '../../common/components/Modal';
import Button from '../../common/components/Button';
import 'leaflet/dist/leaflet.css';

interface RoutePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: {
    name: string;
    geometry: any;
    distance: number;
    elevationGain: number;
  };
}

const RoutePreviewModal: React.FC<RoutePreviewModalProps> = ({ isOpen, onClose, route }) => {
  // Convert geometry to Leaflet format
  const positions = route.geometry?.coordinates?.map((coord: number[]) => 
    [coord[1], coord[0]] as [number, number]
  ) || [];

  // Calculate bounds for centering
  const getBounds = () => {
    if (positions.length === 0) return undefined;
    
    let minLat = positions[0][0];
    let maxLat = positions[0][0];
    let minLng = positions[0][1];
    let maxLng = positions[0][1];
    
    positions.forEach(([lat, lng]) => {
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    });
    
    return [[minLat, minLng], [maxLat, maxLng]] as [[number, number], [number, number]];
  };

  const bounds = getBounds();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={route.name}>
      <div className="space-y-4">
        <div className="h-96 rounded-lg overflow-hidden">
          {positions.length > 0 && bounds ? (
            <MapContainer
              bounds={bounds}
              className="w-full h-full"
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Polyline
                positions={positions}
                pathOptions={{
                  color: '#2196f3',
                  weight: 4,
                  opacity: 0.8,
                }}
              />
            </MapContainer>
          ) : (
            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <p className="text-gray-500">No route data available</p>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400">Distance</p>
            <p className="font-semibold">{(route.distance / 1000).toFixed(1)} km</p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400">Elevation Gain</p>
            <p className="font-semibold">{route.elevationGain.toFixed(0)} m</p>
          </div>
        </div>
        
        <Button onClick={onClose} className="w-full">
          Close
        </Button>
      </div>
    </Modal>
  );
};

export default RoutePreviewModal;