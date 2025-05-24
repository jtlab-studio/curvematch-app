import React, { useMemo } from 'react';
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
  ChartData,
  ChartOptions,
} from 'chart.js';
import GlassPanel from '../../common/components/GlassPanel';
import Button from '../../common/components/Button';
import SaveModal from '../../library/components/SaveModal';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface RouteInspectorProps {
  route: any;
  onClose: () => void;
}

const RouteInspector: React.FC<RouteInspectorProps> = ({ route, onClose }) => {
  const [showSaveModal, setShowSaveModal] = React.useState(false);

  const chartData = useMemo<ChartData<'line'>>(() => {
    const distances = route.elevationProfile.map((_: any, i: number) => 
      ((i / (route.elevationProfile.length - 1)) * route.distance / 1000).toFixed(1)
    );

    return {
      labels: distances,
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
  }, [route]);

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => `Elevation: ${context.parsed.y}m`,
        },
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
    <>
      <GlassPanel className="mt-4 p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold">{route.name}</h3>
            <div className="flex gap-4 mt-2 text-sm text-gray-600">
              <span>Distance: {(route.distance / 1000).toFixed(1)} km</span>
              <span>Gain: {route.elevationGain} m</span>
              <span>Gain/km: {(route.elevationGain / (route.distance / 1000)).toFixed(0)} m/km</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-4 bg-accent-1/10 rounded-lg">
            <div className="text-2xl font-bold text-accent-1">
              {route.matchPercentage}%
            </div>
            <div className="text-sm text-gray-600">Match Score</div>
          </div>
          <div className="text-center p-4 bg-accent-2/10 rounded-lg">
            <div className="text-2xl font-bold text-accent-2">
              {route.curveScore.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Curve Score</div>
          </div>
        </div>

        <div className="h-64 mb-4">
          <Line data={chartData} options={chartOptions} />
        </div>

        <Button onClick={() => setShowSaveModal(true)} className="w-full">
          Save to Library
        </Button>
      </GlassPanel>

      {showSaveModal && (
        <SaveModal
          route={route}
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </>
  );
};

export default RouteInspector;
