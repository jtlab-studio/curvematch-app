// src/utils/gpxMinifier.ts - Complete GPX minification and analysis

export interface GPXAnalysis {
  originalSize: number;
  minifiedSize: number;
  reductionPercent: number;
  pointCount: number;
  distance: number; // in meters
  elevationGain: number; // in meters
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
}

/**
 * Minify a GPX file and analyze its contents
 */
export async function minifyAndAnalyzeGPX(file: File): Promise<{
  minifiedFile: File;
  analysis: GPXAnalysis;
}> {
  const content = await file.text();
  const { minifiedContent, analysis } = minifyGPXContent(content);
  
  // Create a new file with the minified content
  const blob = new Blob([minifiedContent], { type: 'application/gpx+xml' });
  const minifiedFile = new File([blob], `min_${file.name}`, { type: 'application/gpx+xml' });
  
  return {
    minifiedFile,
    analysis: {
      ...analysis,
      originalSize: file.size,
      minifiedSize: blob.size,
      reductionPercent: ((file.size - blob.size) / file.size) * 100,
    },
  };
}

/**
 * Minify GPX content and analyze it
 */
export function minifyGPXContent(gpxContent: string): {
  minifiedContent: string;
  analysis: Omit<GPXAnalysis, 'originalSize' | 'minifiedSize' | 'reductionPercent'>;
} {
  const parser = new DOMParser();
  const doc = parser.parseFromString(gpxContent, 'text/xml');
  
  // Check for parse errors
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid GPX file format');
  }
  
  // Create a new minimal GPX document
  const minimalDoc = document.implementation.createDocument(
    'http://www.topografix.com/GPX/1/1',
    'gpx',
    null
  );
  
  const gpxEl = minimalDoc.documentElement;
  gpxEl.setAttribute('version', '1.1');
  gpxEl.setAttribute('creator', 'CurveMatch Minifier');
  
  // Analysis variables
  let totalDistance = 0;
  let totalElevationGain = 0;
  let pointCount = 0;
  let minLat = Infinity, maxLat = -Infinity;
  let minLon = Infinity, maxLon = -Infinity;
  let lastPoint: { lat: number; lon: number; ele?: number } | null = null;
  
  // Process all tracks
  const tracks = doc.querySelectorAll('trk');
  tracks.forEach((track, trackIdx) => {
    const minTrack = minimalDoc.createElement('trk');
    
    // Keep track name if present
    const nameEl = track.querySelector('name');
    if (nameEl && nameEl.textContent) {
      const minName = minimalDoc.createElement('name');
      minName.textContent = nameEl.textContent;
      minTrack.appendChild(minName);
    } else {
      const minName = minimalDoc.createElement('name');
      minName.textContent = `Track ${trackIdx + 1}`;
      minTrack.appendChild(minName);
    }
    
    // Process all segments
    const segments = track.querySelectorAll('trkseg');
    segments.forEach(segment => {
      const minSegment = minimalDoc.createElement('trkseg');
      
      // Process all track points
      const points = segment.querySelectorAll('trkpt');
      points.forEach(point => {
        const lat = point.getAttribute('lat');
        const lon = point.getAttribute('lon');
        
        if (lat && lon) {
          const latNum = parseFloat(lat);
          const lonNum = parseFloat(lon);
          
          // Update bounds
          minLat = Math.min(minLat, latNum);
          maxLat = Math.max(maxLat, latNum);
          minLon = Math.min(minLon, lonNum);
          maxLon = Math.max(maxLon, lonNum);
          
          const minPoint = minimalDoc.createElement('trkpt');
          minPoint.setAttribute('lat', lat);
          minPoint.setAttribute('lon', lon);
          
          // Keep elevation if present
          let eleNum: number | undefined;
          const eleEl = point.querySelector('ele');
          if (eleEl && eleEl.textContent) {
            eleNum = parseFloat(eleEl.textContent);
            if (!isNaN(eleNum)) {
              const minEle = minimalDoc.createElement('ele');
              minEle.textContent = eleNum.toString();
              minPoint.appendChild(minEle);
            }
          }
          
          // Calculate distance and elevation gain
          if (lastPoint) {
            const dist = haversineDistance(
              lastPoint.lat,
              lastPoint.lon,
              latNum,
              lonNum
            );
            totalDistance += dist;
            
            if (eleNum !== undefined && lastPoint.ele !== undefined) {
              const elevDiff = eleNum - lastPoint.ele;
              if (elevDiff > 0) {
                totalElevationGain += elevDiff;
              }
            }
          }
          
          lastPoint = { lat: latNum, lon: lonNum, ele: eleNum };
          pointCount++;
          
          minSegment.appendChild(minPoint);
        }
      });
      
      if (minSegment.childNodes.length > 0) {
        minTrack.appendChild(minSegment);
      }
    });
    
    if (minTrack.childNodes.length > 0) {
      gpxEl.appendChild(minTrack);
    }
  });
  
  // Serialize back to string with formatting
  const serializer = new XMLSerializer();
  let minifiedGPX = serializer.serializeToString(minimalDoc);
  
  // Add XML declaration if missing
  if (!minifiedGPX.startsWith('<?xml')) {
    minifiedGPX = '<?xml version="1.0" encoding="UTF-8"?>\n' + minifiedGPX;
  }
  
  return {
    minifiedContent: minifiedGPX,
    analysis: {
      pointCount,
      distance: Math.round(totalDistance),
      elevationGain: Math.round(totalElevationGain),
      bounds: {
        minLat: minLat === Infinity ? 0 : minLat,
        maxLat: maxLat === -Infinity ? 0 : maxLat,
        minLon: minLon === Infinity ? 0 : minLon,
        maxLon: maxLon === -Infinity ? 0 : maxLon,
      },
    },
  };
}

/**
 * Calculate distance between two points using Haversine formula
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format elevation for display
 */
export function formatElevation(meters: number): string {
  return `${Math.round(meters)} m`;
}