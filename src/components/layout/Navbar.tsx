import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../modules/auth/hooks/useAuth';
import { useTheme } from '../../modules/common/hooks/useTheme';
import GlassPanel from '../../modules/common/components/GlassPanel';
import Button from '../../modules/common/components/Button';
import { 
  HomeIcon, 
  MapIcon, 
  BookOpenIcon,
  SunIcon,
  MoonIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navLinks = [
    { path: '/', label: 'Home', icon: HomeIcon, public: true },
    { path: '/match', label: 'Match', icon: MapIcon, public: false },
    { path: '/library', label: 'Library', icon: BookOpenIcon, public: false },
  ];

  const visibleLinks = navLinks.filter(link => link.public || isAuthenticated);

  return (
    <GlassPanel className="sticky top-0 z-50 rounded-none backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-1 to-accent-2 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="text-xl font-bold">CurveMatch</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {visibleLinks.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  location.pathname === path
                    ? 'text-accent-1 bg-accent-1/10'
                    : 'hover:text-accent-1 hover:bg-white/10'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? (
                <SunIcon className="w-5 h-5" />
              ) : (
                <MoonIcon className="w-5 h-5" />
              )}
            </button>

            {/* Auth Buttons / User Menu */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2">
                  <UserCircleIcon className="w-5 h-5" />
                  <span className="text-sm">{user?.username}</span>
                </div>
                <Button
                  size="small"
                  variant="secondary"
                  onClick={handleLogout}
                  className="gap-2"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  size="small"
                  variant="secondary"
                  onClick={() => navigate('/login')}
                >
                  Login
                </Button>
                <Button
                  size="small"
                  onClick={() => navigate('/signup')}
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden flex items-center gap-4 pb-3 -mx-4 px-4 overflow-x-auto">
          {visibleLinks.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                location.pathname === path
                  ? 'text-accent-1 bg-accent-1/10'
                  : 'hover:text-accent-1 hover:bg-white/10'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </GlassPanel>
  );
};

export default Navbar;
