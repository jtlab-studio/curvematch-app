import React from 'react';
import { Link } from 'react-router-dom';
import LoginForm from '../modules/auth/components/LoginForm';

const Login: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full bg-gradient-to-br from-primary to-secondary opacity-10"></div>
      </div>

      {/* Login Form */}
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome Back</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Login to continue your trail discovery journey
          </p>
        </div>
        
        <LoginForm />
        
        <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
          New to CurveMatch?{' '}
          <Link to="/signup" className="text-accent-1 hover:underline font-medium">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
