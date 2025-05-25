import React, { useState, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { calculateAreaKm2 } from '../utils/mapHelpers';

interface DrawRectangleProps {
  onAreaDrawn: (bounds: L.LatLngBounds) => void;
  isEnabled: boolean;
}

const DrawRectangle: React.FC<DrawRectangleProps> = ({ onAreaDrawn, isEnabled }) => {
  const map = useMap();
  const [isDrawing, setIsDrawing] = useState(false);
  const [firstPoint, setFirstPoint] = useState<L.LatLng | null>(null);
  const [tempRectangle, setTempRectangle] = useState<L.Rectangle | null>(null);
  const [drawnRectangle, setDrawnRectangle] = useState<L.Rectangle | null>(null);
  const maxArea = 500; // km² - increased from 200

  useEffect(() => {
    if (!isEnabled) {
      // Clean up when disabled
      if (tempRectangle) {
        map.removeLayer(tempRectangle);
        setTempRectangle(null);
      }
      setIsDrawing(false);
      setFirstPoint(null);
      return;
    }

    // Change cursor when enabled
    map.getContainer().style.cursor = 'crosshair';

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (!isEnabled) return;

      if (!isDrawing) {
        // First click - start drawing
        setFirstPoint(e.latlng);
        setIsDrawing(true);
        
        // Add a marker for the first point
        const marker = L.circleMarker(e.latlng, {
          radius: 5,
          fillColor: '#ff9800',
          fillOpacity: 1,
          color: '#ff9800',
          weight: 2
        }).addTo(map);
        
        // Remove marker after a short time
        setTimeout(() => map.removeLayer(marker), 2000);
      } else if (firstPoint) {
        // Second click - complete rectangle
        const bounds = L.latLngBounds(firstPoint, e.latlng);
        const area = calculateAreaKm2(bounds);
        
        if (area > maxArea) {
          alert(`Area too large: ${area.toFixed(1)} km². Maximum allowed is ${maxArea} km².`);
          cancelDrawing();
          return;
        }
        
        // Remove temporary rectangle
        if (tempRectangle) {
          map.removeLayer(tempRectangle);
        }
        
        // Remove old rectangle
        if (drawnRectangle) {
          map.removeLayer(drawnRectangle);
        }
        
        // Create final rectangle
        const finalRect = L.rectangle(bounds, {
          color: '#ff9800',
          weight: 3,
          opacity: 0.8,
          fillOpacity: 0.2,
          fillColor: '#ff9800'
        }).addTo(map);
        
        setDrawnRectangle(finalRect);
        onAreaDrawn(bounds);
        
        // Reset drawing state
        setIsDrawing(false);
        setFirstPoint(null);
        setTempRectangle(null);
      }
    };

    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      if (!isDrawing || !firstPoint) return;
      
      // Update temporary rectangle
      if (tempRectangle) {
        map.removeLayer(tempRectangle);
      }
      
      const bounds = L.latLngBounds(firstPoint, e.latlng);
      const area = calculateAreaKm2(bounds);
      
      const rect = L.rectangle(bounds, {
        color: area > maxArea ? '#dc143c' : '#ff9800',
        weight: 2,
        opacity: 0.6,
        fillOpacity: 0.1,
        fillColor: area > maxArea ? '#dc143c' : '#ff9800',
        dashArray: '5, 10'
      }).addTo(map);
      
      // Add area label
      const center = bounds.getCenter();
      const label = L.tooltip({
        permanent: true,
        direction: 'center',
        className: 'area-tooltip'
      })
        .setContent(`${area.toFixed(1)} km²`)
        .setLatLng(center);
      
      rect.bindTooltip(label).openTooltip();
      setTempRectangle(rect);
    };

    const handleRightClick = (e: L.LeafletMouseEvent) => {
      L.DomEvent.preventDefault(e);
      cancelDrawing();
    };

    const cancelDrawing = () => {
      if (tempRectangle) {
        map.removeLayer(tempRectangle);
        setTempRectangle(null);
      }
      setIsDrawing(false);
      setFirstPoint(null);
    };

    // Add event listeners
    map.on('click', handleMapClick);
    map.on('mousemove', handleMouseMove);
    map.on('contextmenu', handleRightClick);

    // Clean up function
    return () => {
      map.off('click', handleMapClick);
      map.off('mousemove', handleMouseMove);
      map.off('contextmenu', handleRightClick);
      map.getContainer().style.cursor = '';
      
      if (tempRectangle) {
        map.removeLayer(tempRectangle);
      }
    };
  }, [map, isEnabled, isDrawing, firstPoint, tempRectangle, drawnRectangle, onAreaDrawn]);

  return null;
};

export default DrawRectangle;