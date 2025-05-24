import React, { useState } from 'react';
import { useLibrary } from '../modules/library/hooks/useLibrary';
import RouteCard from '../modules/library/components/RouteCard';
import LoadingSpinner from '../modules/common/components/LoadingSpinner';
import GlassPanel from '../modules/common/components/GlassPanel';
import Button from '../modules/common/components/Button';
import { ViewColumnsIcon, Squares2X2Icon } from '@heroicons/react/24/outline';

type ViewMode = 'grid' | 'list';

const Library: React.FC = () => {
  const { routes, isLoading, error } = useLibrary();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRoutes = routes.filter(route =>
    route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GlassPanel className="p-8 text-center">
          <p className="text-red-600 mb-4">Failed to load routes</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">My Route Library</h1>
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search routes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 
                       placeholder-gray-500 dark:placeholder-gray-400
                       focus:outline-none focus:ring-2 focus:ring-accent-1"
            />
          </div>

          {/* View Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-accent-1 text-white'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
              title="Grid view"
            >
              <Squares2X2Icon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-accent-1 text-white'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
              title="List view"
            >
              <ViewColumnsIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Routes Display */}
      {filteredRoutes.length === 0 ? (
        <GlassPanel className="p-12 text-center">
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm ? 'No routes match your search' : 'No saved routes yet'}
          </p>
          <p className="text-gray-500 dark:text-gray-500">
            Go to the Match page to find and save your first route!
          </p>
        </GlassPanel>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }
        >
          {filteredRoutes.map((route) => (
            <RouteCard key={route.id} route={route} />
          ))}
        </div>
      )}

      {/* Stats */}
      {routes.length > 0 && (
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <GlassPanel className="p-4 text-center">
            <div className="text-2xl font-bold text-accent-1">{routes.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Routes</div>
          </GlassPanel>
          <GlassPanel className="p-4 text-center">
            <div className="text-2xl font-bold text-accent-2">
              {((routes.reduce((sum, r) => sum + r.distance, 0) / 1000)).toFixed(0)} km
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Distance</div>
          </GlassPanel>
          <GlassPanel className="p-4 text-center">
            <div className="text-2xl font-bold text-accent-3">
              {routes.reduce((sum, r) => sum + r.elevationGain, 0).toLocaleString()} m
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Elevation</div>
          </GlassPanel>
          <GlassPanel className="p-4 text-center">
            <div className="text-2xl font-bold text-secondary">
              {(routes.reduce((sum, r) => sum + r.matchPercentage, 0) / routes.length).toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Avg Match</div>
          </GlassPanel>
        </div>
      )}
    </div>
  );
};

export default Library;
