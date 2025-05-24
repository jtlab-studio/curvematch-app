import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMatching } from '../hooks/useMatching';
import { useMatchingStore } from '../store/matchingStore';
import GlassPanel from '../../common/components/GlassPanel';
import Button from '../../common/components/Button';

const FilterPanel: React.FC = () => {
  const { filters, updateFilters, performMatch, isMatching } = useMatching();
  const { searchArea } = useMatchingStore();
  const [gpxFile, setGpxFile] = useState<File | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/gpx+xml': ['.gpx']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setGpxFile(acceptedFiles[0]);
        updateFilters({ gpxFile: acceptedFiles[0] });
      }
    }
  });

  const handleSubmit = () => {
    if (gpxFile && searchArea) {
      performMatch();
    }
  };

  const resetFilters = () => {
    setGpxFile(null);
    updateFilters({
      distanceFlexibility: 10,
      elevationFlexibility: 10,
      safetyMode: 'Moderate',
      gpxFile: null,
    });
  };

  const isReady = gpxFile && searchArea;

  return (
    <GlassPanel className="w-full h-full p-6 space-y-6">
      <h3 className="text-lg font-semibold">Match Filters</h3>

      {/* GPX Upload */}
      <div>
        <label className="block text-sm font-medium mb-2">GPX File</label>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-accent-1 bg-accent-1/10' : 'border-gray-300 hover:border-gray-400'}`}
        >
          <input {...getInputProps()} />
          {gpxFile ? (
            <div>
              <p className="font-medium">{gpxFile.name}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setGpxFile(null);
                  updateFilters({ gpxFile: null });
                }}
                className="text-sm text-accent-1 hover:underline mt-1"
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

      {/* Safety Mode - Fixed styling */}
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
          <option value="Strict" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            Strict (foot/trail only)
          </option>
          <option value="Moderate" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            Moderate (incl. residential)
          </option>
          <option value="None" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            None
          </option>
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
          disabled={isMatching}
        >
          Reset Filters
        </Button>
      </div>

      {!gpxFile && (
        <p className="text-sm text-yellow-600">
          Upload a GPX file to start
        </p>
      )}
      
      {gpxFile && !searchArea && (
        <p className="text-sm text-yellow-600">
          Draw a search area on the map
        </p>
      )}
    </GlassPanel>
  );
};

export default FilterPanel;
