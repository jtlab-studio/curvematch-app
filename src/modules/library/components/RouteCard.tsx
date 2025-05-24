import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLibrary } from '../hooks/useLibrary';
import GlassPanel from '../../common/components/GlassPanel';
import Button from '../../common/components/Button';

interface RouteCardProps {
  route: {
    id: number;
    name: string;
    tag: string;
    savedAt: string;
    distance: number;
    elevationGain: number;
    matchPercentage: number;
  };
}

const RouteCard: React.FC<RouteCardProps> = ({ route }) => {
  const navigate = useNavigate();
  const { deleteRoute, downloadGPX } = useLibrary();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleView = () => {
    navigate(`/library/${route.id}`);
  };

  const handleDownload = async () => {
    try {
      await downloadGPX(route.id);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setIsDeleting(true);
    try {
      await deleteRoute(route.id);
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <GlassPanel className="p-4 hover:shadow-lg transition-shadow">
      <div className="h-32 bg-gray-200 rounded-lg mb-4 relative overflow-hidden">
        {/* Mini map would go here */}
        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
          Map Preview
        </div>
      </div>

      <h3 className="font-semibold text-lg mb-1">{route.name}</h3>
      <p className="text-sm text-gray-600 mb-2">{route.tag}</p>
      
      <div className="text-sm space-y-1 mb-4">
        <p>Distance: {(route.distance / 1000).toFixed(1)} km</p>
        <p>Elevation: {route.elevationGain} m</p>
        <p>Match: {route.matchPercentage}%</p>
        <p>Saved: {new Date(route.savedAt).toLocaleDateString()}</p>
      </div>

      <div className="flex gap-2">
        <Button size="small" onClick={handleView}>
          View
        </Button>
        <Button size="small" variant="secondary" onClick={handleDownload}>
          Download GPX
        </Button>
        {!showDeleteConfirm ? (
          <Button
            size="small"
            variant="secondary"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete
          </Button>
        ) : (
          <Button
            size="small"
            variant="secondary"
            onClick={handleDelete}
            isLoading={isDeleting}
            className="!bg-red-600 !text-white"
          >
            Confirm Delete
          </Button>
        )}
      </div>

      {showDeleteConfirm && !isDeleting && (
        <button
          onClick={() => setShowDeleteConfirm(false)}
          className="text-sm text-gray-500 hover:underline mt-2"
        >
          Cancel
        </button>
      )}
    </GlassPanel>
  );
};

export default RouteCard;
