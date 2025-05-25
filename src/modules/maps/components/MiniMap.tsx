import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MiniMapProps {
  geometry: any;
  height?: string;
}

const MiniMap: React.FC<MiniMapProps> = ({ geometry, height = '150px' }) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !geometry?.coordinates) return;

    // Initialize map if not already created
    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        tap: false,
        touchZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);
    }

    // Clear existing layers
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Polyline) {
        mapRef.current?.removeLayer(layer);
      }
    });

    // Add route
    const positions = geometry.coordinates.map((coord: number[]) => 
      [coord[1], coord[0]] as [number, number]
    );

    if (positions.length > 0) {
      const polyline = L.polyline(positions, {
        color: '#2196f3',
        weight: 3,
        opacity: 0.8,
      }).addTo(mapRef.current);

      // Fit bounds with padding
      mapRef.current.fitBounds(polyline.getBounds(), { padding: [20, 20] });
    }

    return () => {
      // Cleanup on unmount
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [geometry]);

  return (
    <div 
      ref={containerRef} 
      className="w-full rounded-lg overflow-hidden"
      style={{ height }}
    />
  );
};

export default MiniMap;