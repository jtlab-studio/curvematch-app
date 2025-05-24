import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../modules/auth/hooks/useAuth';
import GlassPanel from '../modules/common/components/GlassPanel';
import Button from '../modules/common/components/Button';
import { MapIcon, ChartBarIcon, BookOpenIcon } from '@heroicons/react/24/outline';

const Landing: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: MapIcon,
      title: 'Curve-Matching',
      description: 'Find routes that match your uploaded GPX file with advanced algorithms.',
    },
    {
      icon: ChartBarIcon,
      title: 'Custom Loop Generation',
      description: 'Generate loops by distance & elevation to match your fitness level.',
    },
    {
      icon: BookOpenIcon,
      title: 'Personal Library',
      description: 'Save & manage your favorite routes for future adventures.',
    },
  ];

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Background Map Pattern */}
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-gradient-to-br from-blue-600 to-green-600 opacity-20"></div>
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px'
            }}
          ></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <GlassPanel className="p-12 backdrop-blur-xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-accent-1 to-accent-2 bg-clip-text text-transparent">
              Discover & Match Your Perfect Trail
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-700 dark:text-gray-300">
              Upload your GPX—or draw a search area—to find similar routes around you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Button
                  size="large"
                  onClick={() => navigate('/match')}
                  className="min-w-[200px]"
                >
                  Go to App
                </Button>
              ) : (
                <Button
                  size="large"
                  onClick={() => navigate('/login')}
                  className="min-w-[200px]"
                >
                  Get Started
                </Button>
              )}
              <Button
                variant="secondary"
                size="large"
                onClick={scrollToFeatures}
                className="min-w-[200px]"
              >
                Learn More
              </Button>
            </div>
          </GlassPanel>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">
            Everything You Need for Trail Discovery
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <GlassPanel
                key={index}
                className="p-8 hover:transform hover:scale-105 transition-all duration-300"
              >
                <feature.icon className="w-16 h-16 text-accent-1 mb-4" />
                <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </GlassPanel>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
