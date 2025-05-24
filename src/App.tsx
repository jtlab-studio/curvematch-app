import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useTheme } from './modules/common/hooks/useTheme';
import AuthGuard from './modules/auth/components/AuthGuard';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Match from './pages/Match';
import Library from './pages/Library';
import LibraryDetail from './pages/LibraryDetail';

function App() {
  const { isDark } = useTheme();

  return (
    <Router>
      <div className={`min-h-screen flex flex-col ${isDark ? 'dark' : ''}`}>
        <Navbar />
        <main className="flex-1">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Protected Routes */}
            <Route
              path="/match"
              element={
                <AuthGuard>
                  <Match />
                </AuthGuard>
              }
            />
            <Route
              path="/library"
              element={
                <AuthGuard>
                  <Library />
                </AuthGuard>
              }
            />
            <Route
              path="/library/:id"
              element={
                <AuthGuard>
                  <LibraryDetail />
                </AuthGuard>
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
