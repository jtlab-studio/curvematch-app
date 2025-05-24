import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
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

// Create router with future flags
const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <>
        <Navbar />
        <Landing />
        <Footer />
      </>
    ),
  },
  {
    path: '/login',
    element: (
      <>
        <Navbar />
        <Login />
        <Footer />
      </>
    ),
  },
  {
    path: '/signup',
    element: (
      <>
        <Navbar />
        <Signup />
        <Footer />
      </>
    ),
  },
  {
    path: '/match',
    element: (
      <AuthGuard>
        <Navbar />
        <Match />
        <Footer />
      </AuthGuard>
    ),
  },
  {
    path: '/library',
    element: (
      <AuthGuard>
        <Navbar />
        <Library />
        <Footer />
      </AuthGuard>
    ),
  },
  {
    path: '/library/:id',
    element: (
      <AuthGuard>
        <Navbar />
        <LibraryDetail />
        <Footer />
      </AuthGuard>
    ),
  },
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
});

function App() {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'dark' : ''}`}>
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
