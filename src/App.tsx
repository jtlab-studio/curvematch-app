import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useTheme } from './modules/common/hooks/useTheme';

function App() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <Router>
      <div className="min-h-screen bg-primary-bg text-primary-text">
        <nav className="glass p-4 mb-8">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary">CurveMatch</h1>
            <div className="flex gap-4 items-center">
              <Link to="/" className="hover:text-accent-1">Home</Link>
              <Link to="/match" className="hover:text-accent-1">Match</Link>
              <Link to="/library" className="hover:text-accent-1">Library</Link>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-white/10"
              >
                {isDark ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </nav>

        <main className="container mx-auto px-4">
          <Routes>
            <Route path="/" element={
              <div className="text-center py-20">
                <h2 className="text-4xl font-bold mb-4">Welcome to CurveMatch</h2>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                  Discover & Match Your Perfect Trail
                </p>
                <div className="mt-8">
                  <Link
                    to="/match"
                    className="bg-accent-1 text-white px-6 py-3 rounded-2xl hover:bg-accent-1/90 inline-block"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            } />
            <Route path="/match" element={
              <div className="glass p-8 rounded-2xl">
                <h2 className="text-2xl font-bold mb-4">Match Page</h2>
                <p>Match functionality will be implemented here.</p>
              </div>
            } />
            <Route path="/library" element={
              <div className="glass p-8 rounded-2xl">
                <h2 className="text-2xl font-bold mb-4">Library Page</h2>
                <p>Your saved routes will appear here.</p>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
