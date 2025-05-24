import React, { useState } from 'react';
import { useMatching } from '../hooks/useMatching';
import RouteInspector from './RouteInspector';
import SaveModal from '../../library/components/SaveModal';
import LoadingSpinner from '../../common/components/LoadingSpinner';
import GlassPanel from '../../common/components/GlassPanel';
import Button from '../../common/components/Button';

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

const ResultsPanel: React.FC = () => {
  const { results, isMatching } = useMatching();
  const [selectedRoute, setSelectedRoute] = useState<RouteMatch | null>(null);
  const [routeToSave, setRouteToSave] = useState<RouteMatch | null>(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

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
      <GlassPanel className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">Finding matching routes...</p>
        </div>
      </GlassPanel>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <GlassPanel className="flex-1 p-6 overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          Results ({results.length} routes found)
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
