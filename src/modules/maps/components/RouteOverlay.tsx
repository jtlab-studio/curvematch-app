import React, { useState } from 'react';
import { Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';

interface RouteOverlayProps {
  route: {
    id: string | number;
    name: string;
    geometry: any;
    distance: number;
    elevationGain: number;
    matchPercentage?: number;
  };
  color?: string;
  isHighlighted?: boolean;
  onClick?: () => void;
}

const RouteOverlay: React.FC<RouteOverlayProps> = ({
  route,
  color = '#2196f3',
  isHighlighted = false,
  onClick,
}) => {
  const [showPopup, setShowPopup] = useState(false);

  // Convert geometry to Leaflet LatLng format
  const positions = route.geometry.coordinates.map((coord: number[]) => 
    [coord[1], coord[0]] as L.LatLngExpression
  );

  const handleClick = () => {
    setShowPopup(true);
    onClick?.();
  };

  return (
    <>
      <Polyline
        positions={positions}
        pathOptions={{
          color: isHighlighted ? '#ff5722' : color,
          weight: isHighlighted ? 5 : 3,
          opacity: isHighlighted ? 1 : 0.8,
        }}
        eventHandlers={{
          click: handleClick,
          mouseover: (e) => {
            e.target.setStyle({ weight: 5, opacity: 1 });
          },
          mouseout: (e) => {
            e.target.setStyle({ 
              weight: isHighlighted ? 5 : 3, 
              opacity: isHighlighted ? 1 : 0.8 
            });
          },
        }}
      >
        {showPopup && (
          <Popup>
            <div>
              <h4 className="font-semibold">{route.name}</h4>
              <p className="text-sm">Distance: {(route.distance / 1000).toFixed(1)} km</p>
              <p className="text-sm">Elevation: {route.elevationGain} m</p>
              {route.matchPercentage && (
                <p className="text-sm">Match: {route.matchPercentage}%</p>
              )}
            </div>
          </Popup>
        )}
      </Polyline>
    </>
  );
};

export default RouteOverlay;
