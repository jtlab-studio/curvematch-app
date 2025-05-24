// src/modules/matching/components/FilterPanel.tsx

import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMatching } from '../hooks/useMatching';
import { useMatchingStore } from '../store/matchingStore';
import GlassPanel from '../../common/components/GlassPanel';
import Button from '../../common/components/Button';
import LoadingSpinner from '../../common/components/LoadingSpinner';
import { 
  minifyAndAnalyzeGPX, 
  formatFileSize, 
  formatDistance, 
  formatElevation 
} from '../../../utils/gpxMinifier';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const FilterPanel: React.FC = () => {
  const { filters, updateFilters, performMatch, isMatching } = useMatching();
  const { searchArea, gpxAnalysis, isProcessingGPX, setGPXData, setProcessingGPX } = useMatchingStore();
  const [error, setError] = useState<string | null>(null);

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

      {/* GPX Upload */}
      <div>
        <label className="block text-sm font-medium mb-2">GPX File</label>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-accent-1 bg-accent-1/10' : 'border-gray-300 hover:border-gray-400'}
            ${isProcessingGPX ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} disabled={isProcessingGPX} />
          
          {isProcessingGPX ? (
            <div>
              <LoadingSpinner size="medium" />
              <p className="mt-2 text-sm text-gray-500">Processing GPX file...</p>
            </div>
          ) : filters.gpxFile ? (
            <div>
              <CheckCircleIcon className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="font-medium">{filters.gpxFile.name}</p>
              
              {gpxAnalysis && (
                <div className="mt-3 space-y-2 text-sm text-left">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded">
                      <span className="text-gray-600 dark:text-gray-400">Size reduced:</span>
                      <p className="font-semibold text-green-700 dark:text-green-400">
                        {formatFileSize(gpxAnalysis.originalSize)} → {formatFileSize(gpxAnalysis.minifiedSize)}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-500">
                        {gpxAnalysis.reductionPercent.toFixed(1)}% smaller
                      </p>
                    </div>
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded">
                      <span className="text-gray-600 dark:text-gray-400">Distance:</span>
                      <p className="font-semibold text-blue-700 dark:text-blue-400">
                        {formatDistance(gpxAnalysis.distance)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded">
                      <span className="text-gray-600 dark:text-gray-400">Elevation:</span>
                      <p className="font-semibold text-orange-700 dark:text-orange-400">
                        ↑ {formatElevation(gpxAnalysis.elevationGain)}
                      </p>
                    </div>
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded">
                      <span className="text-gray-600 dark:text-gray-400">Points:</span>
                      <p className="font-semibold text-purple-700 dark:text-purple-400">
                        {gpxAnalysis.pointCount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateFilters({ gpxFile: null });
                  setError(null);
                }}
                className="text-sm text-accent-1 hover:underline mt-2"
              >
                Change file
              </button>
            </div>
          ) : (
            <p className="text-gray-500">
              {isDragActive ? 'Drop the GPX file here' : 'Drag & drop a GPX file here, or click to select'}
            </p>
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
    </GlassPanel>
  );
};

export default FilterPanel;