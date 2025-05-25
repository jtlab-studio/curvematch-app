// src/modules/matching/components/FilterPanel.tsx

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
  minifyAndAnalyzeGPX, 
  formatFileSize, 
  formatDistance, 
  formatElevation 
} from '../../../utils/gpxMinifier';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  MapIcon, 
  DocumentIcon,
  EyeIcon 
} from '@heroicons/react/24/outline';

const FilterPanel: React.FC = () => {
  const { filters, updateFilters, performMatch, isMatching } = useMatching();
  const { searchArea, gpxAnalysis, isProcessingGPX, setGPXData, setProcessingGPX, uploadedGPXRoute } = useMatchingStore();
  const [error, setError] = useState<string | null>(null);
  const [showRouteModal, setShowRouteModal] = useState(false);

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
          
          // Minify and analyze the GPX file
          const { minifiedFile, analysis } = await minifyAndAnalyzeGPX(file);
          
          console.log('GPX analysis complete:', {
            originalSize: formatFileSize(analysis.originalSize),
            minifiedSize: formatFileSize(analysis.minifiedSize),
            reduction: `${analysis.reductionPercent.toFixed(1)}%`,
            distance: formatDistance(analysis.distance),
            elevation: formatElevation(analysis.elevationGain),
            points: analysis.pointCount,
          });
          
          // Store both files and analysis
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
      distanceFlexibility: 10,
      elevationFlexibility: 10,
      safetyMode: 'Moderate',
      gpxFile: null,
    });
    setError(null);
  };

  const isReady = filters.minifiedGpxFile && searchArea && !isProcessingGPX;

  return (
    <GlassPanel className="w-full h-full p-6 space-y-6 overflow-y-auto">
      <h3 className="text-lg font-semibold">Match Filters</h3>

      {/* GPX Upload - Smaller height */}
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

      {/* Distance Flexibility */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Distance Flexibility: {filters.distanceFlexibility}%
        </label>
        <input
          type="range"
          min="0"
          max="50"
          value={filters.distanceFlexibility}
          onChange={(e) => updateFilters({ distanceFlexibility: Number(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Elevation Flexibility */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Elevation Flexibility: {filters.elevationFlexibility}%
        </label>
        <input
          type="range"
          min="0"
          max="50"
          value={filters.elevationFlexibility}
          onChange={(e) => updateFilters({ elevationFlexibility: Number(e.target.value) })}
          className="w-full"
        />
      </div>

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

      {/* GPX Route Overview with Mini Map */}
      {gpxAnalysis && filters.gpxFile && uploadedGPXRoute && (
        <GlassPanel className="p-4 mt-4 space-y-3">
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
          
          {/* Mini Map */}
          <MiniMap geometry={uploadedGPXRoute.geometry} height="150px" />
          
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Name:</span>
              <span className="text-sm font-medium">{filters.gpxFile.name.replace('.gpx', '')}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Distance:</span>
              <span className="text-sm font-medium">{formatDistance(gpxAnalysis.distance)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Elevation Gain:</span>
              <span className="text-sm font-medium">↑ {formatElevation(gpxAnalysis.elevationGain)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Gain/km:</span>
              <span className="text-sm font-medium">
                {(gpxAnalysis.elevationGain / (gpxAnalysis.distance / 1000)).toFixed(0)} m/km
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Track Points:</span>
              <span className="text-sm font-medium">{gpxAnalysis.pointCount.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
              <CheckCircleIcon className="w-4 h-4" />
              <span>File optimized by {gpxAnalysis.reductionPercent.toFixed(0)}%</span>
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