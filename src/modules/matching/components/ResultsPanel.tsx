import React, { useState, useEffect } from 'react';
import { useMatching } from '../hooks/useMatching';
import RouteInspector from './RouteInspector';
import SaveModal from '../../library/components/SaveModal';
import LoadingSpinner from '../../common/components/LoadingSpinner';
import GlassPanel from '../../common/components/GlassPanel';
import Button from '../../common/components/Button';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface RouteMatch {
  id: string;
  name: string;
  distance: number;
  elevationGain: number;
  matchPercentage: number;
  curveScore: number;
  geometry: any;
  elevationProfile: number[];
}

interface LoadingStage {
  id: string;
  label: string;
  completed: boolean;
}

const ResultsPanel: React.FC = () => {
  const { results, isMatching, error } = useMatching();
  const [selectedRoute, setSelectedRoute] = useState<RouteMatch | null>(null);
  const [routeToSave, setRouteToSave] = useState<RouteMatch | null>(null);
  const [page, setPage] = useState(1);
  const [loadingStages, setLoadingStages] = useState<LoadingStage[]>([]);
  const itemsPerPage = 10;

  useEffect(() => {
    if (isMatching) {
      // Initialize loading stages
      const stages: LoadingStage[] = [
        { id: 'upload', label: 'Uploading GPX file', completed: false },
        { id: 'parse', label: 'Parsing route data', completed: false },
        { id: 'analyze', label: 'Analyzing elevation profile', completed: false },
        { id: 'search', label: 'Searching for similar routes', completed: false },
        { id: 'calculate', label: 'Calculating match scores', completed: false },
      ];
      setLoadingStages(stages);

      // Simulate stage progression
      const timers: NodeJS.Timeout[] = [];
      stages.forEach((stage, index) => {
        const timer = setTimeout(() => {
          setLoadingStages(prev => 
            prev.map((s, i) => i <= index ? { ...s, completed: true } : s)
          );
        }, (index + 1) * 800);
        timers.push(timer);
      });

      return () => {
        timers.forEach(timer => clearTimeout(timer));
      };
    }
  }, [isMatching]);

  const handleRouteSelect = (route: RouteMatch) => {
    setSelectedRoute(route);
  };

  const handleRouteSave = (route: RouteMatch) => {
    setRouteToSave(route);
  };

  const paginatedResults = results.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(results.length / itemsPerPage);

  if (isMatching) {
    return (
      <GlassPanel className="w-full h-full flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <LoadingSpinner size="large" />
            <h3 className="mt-4 text-lg font-semibold">Finding matching routes...</h3>
          </div>
          
          <div className="space-y-3">
            {loadingStages.map((stage) => (
              <div
                key={stage.id}
                className={`flex items-center gap-3 transition-all duration-300 ${
                  stage.completed ? 'opacity-100' : 'opacity-50'
                }`}
              >
                {stage.completed ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-500 animate-pulse" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-400" />
                )}
                <span className={`text-sm ${stage.completed ? 'font-medium' : ''}`}>
                  {stage.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </GlassPanel>
    );
  }

  if (error) {
    return (
      <GlassPanel className="w-full h-full p-6">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </GlassPanel>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <GlassPanel className="flex-1 p-6 overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          Results {results.length > 0 && `(${results.length} routes found)`}
        </h3>

        {results.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No results yet. Set filters and draw a search area to find routes.
          </p>
        ) : (
          <div className="space-y-4">
            {paginatedResults.map((route) => (
              <div
                key={route.id}
                className="p-4 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                onClick={() => handleRouteSelect(route)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{route.name}</h4>
                  <span className="text-sm font-semibold text-accent-1">
                    {route.matchPercentage}% match
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Distance: {(route.distance / 1000).toFixed(1)} km</p>
                  <p>Elevation Gain: {route.elevationGain} m</p>
                  <p>Curve Score: {route.curveScore.toFixed(2)}</p>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRouteSelect(route);
                    }}
                  >
                    View
                  </Button>
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRouteSave(route);
                    }}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <Button
              size="small"
              variant="secondary"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              size="small"
              variant="secondary"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </GlassPanel>

      {selectedRoute && (
        <RouteInspector
          route={selectedRoute}
          onClose={() => setSelectedRoute(null)}
        />
      )}

      {routeToSave && (
        <SaveModal
          route={routeToSave}
          isOpen={!!routeToSave}
          onClose={() => setRouteToSave(null)}
        />
      )}
    </div>
  );
};

export default ResultsPanel;
