import React, { useState } from 'react';
import FilterPanel from '../modules/matching/components/FilterPanel';
import MapCanvas from '../modules/maps/components/MapCanvas';
import ResultsPanel from '../modules/matching/components/ResultsPanel';
import { useIsMobile } from '../modules/common/hooks/useMediaQuery';
import Button from '../modules/common/components/Button';
import { FunnelIcon, MapIcon, ListBulletIcon } from '@heroicons/react/24/outline';

type MobileView = 'filters' | 'map' | 'results';

const Match: React.FC = () => {
  const isMobile = useIsMobile();
  const [mobileView, setMobileView] = useState<MobileView>('map');
  const [searchArea, setSearchArea] = useState<any>(null);

  const handleAreaDrawn = (area: any) => {
    setSearchArea(area);
    if (isMobile) {
      setMobileView('results');
    }
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Mobile Tab Bar */}
        <div className="flex bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setMobileView('filters')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 ${
              mobileView === 'filters'
                ? 'text-accent-1 border-b-2 border-accent-1'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <FunnelIcon className="w-5 h-5" />
            <span>Filters</span>
          </button>
          <button
            onClick={() => setMobileView('map')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 ${
              mobileView === 'map'
                ? 'text-accent-1 border-b-2 border-accent-1'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <MapIcon className="w-5 h-5" />
            <span>Map</span>
          </button>
          <button
            onClick={() => setMobileView('results')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 ${
              mobileView === 'results'
                ? 'text-accent-1 border-b-2 border-accent-1'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <ListBulletIcon className="w-5 h-5" />
            <span>Results</span>
          </button>
        </div>

        {/* Mobile Content */}
        <div className="flex-1 overflow-hidden">
          {mobileView === 'filters' && (
            <div className="h-full overflow-y-auto p-4">
              <FilterPanel />
            </div>
          )}
          {mobileView === 'map' && (
            <MapCanvas onAreaDrawn={handleAreaDrawn} searchArea={searchArea} />
          )}
          {mobileView === 'results' && (
            <div className="h-full overflow-y-auto">
              <ResultsPanel />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4 p-4">
      {/* Left Sidebar - Filters */}
      <div className="w-80 flex-shrink-0">
        <FilterPanel />
      </div>

      {/* Center - Map */}
      <div className="flex-1 relative">
        <MapCanvas onAreaDrawn={handleAreaDrawn} searchArea={searchArea} />
      </div>

      {/* Right Sidebar - Results */}
      <div className="w-96 flex-shrink-0">
        <ResultsPanel />
      </div>
    </div>
  );
};

export default Match;
