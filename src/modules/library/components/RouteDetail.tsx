import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useLibrary } from '../hooks/useLibrary';
import MapCanvas from '../../maps/components/MapCanvas';
import GlassPanel from '../../common/components/GlassPanel';
import Button from '../../common/components/Button';
import LoadingSpinner from '../../common/components/LoadingSpinner';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const RouteDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { routes, downloadGPX, deleteRoute, updateRouteName } = useLibrary();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');

  const route = routes.find(r => r.id === Number(id));

  useEffect(() => {
    if (route) {
      setEditedName(route.name);
    }
  }, [route]);

  if (!route) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const handleNameEdit = () => {
    setIsEditing(true);
  };

  const handleNameSave = async () => {
    if (editedName && editedName !== route.name) {
      await updateRouteName(route.id, editedName);
    }
    setIsEditing(false);
  };

  const handleDownload = async () => {
    await downloadGPX(route.id);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this route?')) {
      await deleteRoute(route.id);
      navigate('/library');
    }
  };

  const chartData = {
    labels: route.elevationProfile.map((_: any, i: number) => 
      ((i / (route.elevationProfile.length - 1)) * route.distance / 1000).toFixed(1)
    ),
    datasets: [
      {
        label: 'Elevation (m)',
        data: route.elevationProfile,
        borderColor: 'rgb(33, 150, 243)',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Distance (km)',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Elevation (m)',
        },
      },
    },
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <button
          onClick={() => navigate('/library')}
          className="text-accent-1 hover:underline"
        >
          ← Back to Library
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map */}
        <div className="h-96 lg:h-auto">
          <MapCanvas
            routes={[route]}
            searchArea={route.searchArea}
            interactive={false}
          />
        </div>

        {/* Details */}
        <div className="space-y-6">
          {/* Metadata */}
          <GlassPanel className="p-6">
            <div className="flex items-center justify-between mb-4">
              {isEditing ? (
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onBlur={handleNameSave}
                  onKeyPress={(e) => e.key === 'Enter' && handleNameSave()}
                  className="text-2xl font-bold bg-transparent border-b-2 border-accent-1 outline-none"
                  autoFocus
                />
              ) : (
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  {route.name}
                  <button
                    onClick={handleNameEdit}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✏️
                  </button>
                </h1>
              )}
            </div>

            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="font-medium text-gray-600">Original GPX</dt>
                <dd>{route.tag}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-600">Date Saved</dt>
                <dd>{new Date(route.savedAt).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-600">Distance</dt>
                <dd>{(route.distance / 1000).toFixed(1)} km</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-600">Elevation Gain</dt>
                <dd>{route.elevationGain} m</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-600">Gain/km</dt>
                <dd>{route.gainPerKm.toFixed(0)} m/km</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-600">Match %</dt>
                <dd>{route.matchPercentage}%</dd>
              </div>
            </dl>

            <div className="flex gap-2 mt-6">
              <Button onClick={handleDownload}>
                Download GPX
              </Button>
              <Button variant="secondary" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </GlassPanel>

          {/* Elevation Chart */}
          <GlassPanel className="p-6">
            <h2 className="text-lg font-semibold mb-4">Elevation Profile</h2>
            <div className="h-64">
              <Line data={chartData} options={chartOptions} />
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
};

export default RouteDetail;
