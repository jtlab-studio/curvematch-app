import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import { calculateAreaKm2 } from '../utils/mapHelpers';

interface DrawControlProps {
  onAreaDrawn: (bounds: L.LatLngBounds) => void;
}

const DrawControl: React.FC<DrawControlProps> = ({ onAreaDrawn }) => {
  const map = useMap();
  const drawnItemsRef = useRef<L.FeatureGroup>(new L.FeatureGroup());
  const maxArea = 200; // km²

  useEffect(() => {
    const drawnItems = drawnItemsRef.current;
    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        polygon: false,
        circle: false,
        circlemarker: false,
        marker: false,
        polyline: false,
        rectangle: {
          shapeOptions: {
            color: '#ff9800',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.1,
          },
        },
      },
      edit: {
        featureGroup: drawnItems,
        edit: false,
        remove: true,
      },
    });

    map.addControl(drawControl);

    const handleCreated = (e: any) => {
      const layer = e.layer;
      const bounds = layer.getBounds();
      const area = calculateAreaKm2(bounds);

      if (area > maxArea) {
        alert(`Area too large: ${area.toFixed(1)} km². Maximum allowed is ${maxArea} km².`);
        return;
      }

      drawnItems.clearLayers();
      drawnItems.addLayer(layer);
      onAreaDrawn(bounds);
    };

    map.on(L.Draw.Event.CREATED, handleCreated);

    return () => {
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
      map.off(L.Draw.Event.CREATED, handleCreated);
    };
  }, [map, onAreaDrawn, maxArea]);

  return null;
};

export default DrawControl;
