import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMatching } from '../hooks/useMatching';
import { useMatchingStore } from '../store/matchingStore';
import GlassPanel from '../../common/components/GlassPanel';
import Button from '../../common/components/Button';
import LoadingSpinner from '../../common/components/LoadingSpinner';
import MiniMap from '../../maps/components/MiniMap';
import RoutePreviewModal from '../../maps/components/RoutePreviewModal';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  MapIcon, 
  DocumentIcon,
  EyeIcon,
  InformationCircleIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

interface GPXAnalysis {
  originalSize: number;
  minifiedSize: number;
  reductionPercent: number;
  pointCount: number;
  distance: number;
  elevationGain: number;
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatDistance = (meters: number): string => {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};

const formatElevation = (meters: number): string => {
  return `${Math.round(meters)} m`;
};

// Temporary minify function until we fix the import
const minifyAndAnalyzeGPX = async (file: File): Promise<{
  minifiedFile: File;
  analysis: GPXAnalysis;
}> => {
  // For now, just return the original file with mock analysis
  const content = await file.text();
  const analysis: GPXAnalysis = {
    originalSize: file.size,
    minifiedSize: file.size,
    reductionPercent: 0,
    pointCount: (content.match(/<trkpt/g) || []).length,
    distance: 0,
    elevationGain: 0,
    bounds: { minLat: 0, maxLat: 0, minLon: 0, maxLon: 0 }
  };
  
  return {
    minifiedFile: file,
    analysis
  };
};

const FilterPanel: React.FC = () => {
  const { filters, updateFilters, performMatch, isMatching } = useMatching();
  const { searchArea, isProcessingGPX, setGPXData, setProcessingGPX, uploadedGPXRoute } = useMatchingStore();
  const [error, setError] = useState<string | null>(null);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Get GPX analysis from store
  const gpxAnalysis = filters.gpxAnalysis;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/gpx+xml': ['.gpx']
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setError(null);
        setProcessingGPX(true);
        
        try {
          const file = acceptedFiles[0];
          console.log('Processing GPX file:', file.name, formatFileSize(file.size));
          
          const { minifiedFile, analysis } = await minifyAndAnalyzeGPX(file);
          
          console.log('GPX analysis complete:', {
            originalSize: formatFileSize(analysis.originalSize),
            minifiedSize: formatFileSize(analysis.minifiedSize),
            reduction: `${analysis.reductionPercent.toFixed(1)}%`,
            distance: formatDistance(analysis.distance),
            elevation: formatElevation(analysis.elevationGain),
            points: analysis.pointCount,
          });
          
          setGPXData(file, minifiedFile, analysis);
        } catch (err) {
          console.error('Error processing GPX:', err);
          setError(err instanceof Error ? err.message : 'Failed to process GPX file');
          setProcessingGPX(false);
        }
      }
    }
  });

  const handleSubmit = () => {
    if (filters.minifiedGpxFile && searchArea) {
      performMatch();
    }
  };

  const resetFilters = () => {
    updateFilters({
      distanceFlexibility: 20,
      elevationFlexibility: 20,
      shapeImportance: 0,
      turnsImportance: 0,
      granularityMeters: 100,
      safetyMode: 'Moderate',
      gpxFile: null,
    });
    setError(null);
  };

  const isReady = filters.minifiedGpxFile && searchArea && !isProcessingGPX;

  return (
    <GlassPanel className="w-full h-full p-6 space-y-6 overflow-y-auto">
      <h3 className="text-lg font-semibold">Match Filters</h3>

      {/* GPX Upload */}
      <div>
        <label className="block text-sm font-medium mb-2">GPX File</label>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors h-24
            ${isDragActive ? 'border-accent-1 bg-accent-1/10' : 'border-gray-300 hover:border-gray-400'}
            ${isProcessingGPX ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} disabled={isProcessingGPX} />
          
          {isProcessingGPX ? (
            <div className="flex items-center justify-center gap-2">
              <LoadingSpinner size="small" />
              <p className="text-sm text-gray-500">Processing GPX file...</p>
            </div>
          ) : filters.gpxFile ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-6 h-6 text-green-500" />
                <div className="text-left">
                  <p className="font-medium text-sm">{filters.gpxFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(gpxAnalysis?.originalSize || 0)} → {formatFileSize(gpxAnalysis?.minifiedSize || 0)}
                    {gpxAnalysis && ` (${gpxAnalysis.reductionPercent.toFixed(0)}% smaller)`}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateFilters({ gpxFile: null });
                  setError(null);
                }}
                className="text-sm text-accent-1 hover:underline"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <DocumentIcon className="w-8 h-8 text-gray-400 mb-1" />
              <p className="text-gray-500 text-sm">
                {isDragActive ? 'Drop GPX here' : 'Drag & drop or click to select'}
              </p>
            </div>
          )}
        </div>
        
        {error && (
          <div className="mt-2 flex items-start gap-2 text-sm text-red-600">
            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Basic Settings */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Distance Flexibility: {filters.distanceFlexibility}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={filters.distanceFlexibility}
            onChange={(e) => updateFilters({ distanceFlexibility: Number(e.target.value) })}
            className="w-full accent-accent-1"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Exact</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Elevation Flexibility: {filters.elevationFlexibility}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={filters.elevationFlexibility}
            onChange={(e) => updateFilters({ elevationFlexibility: Number(e.target.value) })}
            className="w-full accent-accent-1"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Exact</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* NEW: Gradient Granularity Slider */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <label className="block text-sm font-medium mb-2 flex items-center gap-2">
            <AdjustmentsHorizontalIcon className="w-4 h-4" />
            Gradient Calculation Window: {filters.granularityMeters || 100}m
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Smaller values = more detailed matching, larger = smoother matching
          </p>
          <input
            type="range"
            min="25"
            max="1000"
            step="25"
            value={filters.granularityMeters || 100}
            onChange={(e) => updateFilters({ granularityMeters: Number(e.target.value) })}
            className="w-full accent-accent-1"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>25m</span>
            <span>250m</span>
            <span>500m</span>
            <span>750m</span>
            <span>1000m</span>
          </div>
        </div>
      </div>

      {/* Advanced Settings Toggle */}
      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm font-medium text-accent-1 hover:underline"
        >
          <InformationCircleIcon className="w-4 h-4" />
          {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
        </button>
      </div>

      {/* Advanced Settings */}
      {showAdvanced && (
        <GlassPanel className="p-4 space-y-4 bg-white/10 dark:bg-gray-800/50">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            By default, matching focuses on elevation gradient profiles. 
            Enable these options to also consider route shape and turns.
          </p>

          <div>
            <label className="block text-sm font-medium mb-2">
              Shape Matching: {filters.shapeImportance || 0}%
              <span className="text-xs text-gray-500 block">
                How closely the route shape should match
              </span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={filters.shapeImportance || 0}
              onChange={(e) => updateFilters({ shapeImportance: Number(e.target.value) })}
              className="w-full accent-accent-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Turn Sequence Matching: {filters.turnsImportance || 0}%
              <span className="text-xs text-gray-500 block">
                How similar the number and sequence of turns should be
              </span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={filters.turnsImportance || 0}
              onChange={(e) => updateFilters({ turnsImportance: Number(e.target.value) })}
              className="w-full accent-accent-3"
            />
          </div>

          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <strong>Elevation Gradient Importance: {100 - (filters.shapeImportance || 0) - (filters.turnsImportance || 0)}%</strong>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              The importance values must total 100%. Elevation gradient matching gets the remainder.
            </p>
          </div>
        </GlassPanel>
      )}

      {/* Safety Mode */}
      <div>
        <label className="block text-sm font-medium mb-2">Safety Mode</label>
        <select
          value={filters.safetyMode}
          onChange={(e) => updateFilters({ safetyMode: e.target.value })}
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 
                     border border-gray-300 dark:border-gray-600 rounded-lg 
                     focus:outline-none focus:ring-2 focus:ring-accent-1 focus:border-transparent
                     cursor-pointer"
        >
          <option value="Strict">Strict (foot/trail only)</option>
          <option value="Moderate">Moderate (incl. residential)</option>
          <option value="None">None</option>
        </select>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <Button
          onClick={handleSubmit}
          disabled={!isReady || isMatching}
          isLoading={isMatching}
          className="w-full"
        >
          {isMatching ? 'Finding Routes...' : 'Find Routes'}
        </Button>
        <Button
          onClick={resetFilters}
          variant="secondary"
          className="w-full"
          disabled={isMatching || isProcessingGPX}
        >
          Reset Filters
        </Button>
      </div>

      {/* GPX Route Overview */}
      {gpxAnalysis && filters.gpxFile && uploadedGPXRoute && (
        <GlassPanel className="p-4 mt-4 space-y-3 bg-accent-1/10">
          <h4 className="font-semibold text-base flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapIcon className="w-5 h-5 text-accent-1" />
              Uploaded Route
            </div>
            <Button
              size="small"
              variant="secondary"
              onClick={() => setShowRouteModal(true)}
              className="gap-1"
            >
              <EyeIcon className="w-4 h-4" />
              View
            </Button>
          </h4>
          
          {uploadedGPXRoute.geometry && (
            <MiniMap geometry={uploadedGPXRoute.geometry} height="150px" />
          )}
          
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Distance:</span>
              <span className="text-sm font-medium">{formatDistance(gpxAnalysis.distance)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Elevation Gain:</span>
              <span className="text-sm font-medium">↑ {formatElevation(gpxAnalysis.elevationGain)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Gradient Window:</span>
              <span className="text-sm font-medium text-accent-1">{filters.granularityMeters || 100}m</span>
            </div>
          </div>
          
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
              <CheckCircleIcon className="w-4 h-4" />
              <span>Ready for matching with {filters.granularityMeters || 100}m gradient window</span>
            </div>
          </div>
        </GlassPanel>
      )}

      {!filters.gpxFile && (
        <p className="text-sm text-yellow-600">
          Upload a GPX file to start
        </p>
      )}
      
      {filters.gpxFile && !searchArea && (
        <p className="text-sm text-yellow-600">
          Draw a search area on the map
        </p>
      )}

      {/* Route Preview Modal */}
      {showRouteModal && uploadedGPXRoute && (
        <RoutePreviewModal
          isOpen={showRouteModal}
          onClose={() => setShowRouteModal(false)}
          route={{
            name: filters.gpxFile?.name.replace('.gpx', '') || 'Uploaded Route',
            geometry: uploadedGPXRoute.geometry,
            distance: uploadedGPXRoute.distance,
            elevationGain: uploadedGPXRoute.elevationGain,
          }}
        />
      )}
    </GlassPanel>
  );
};

export default FilterPanel;