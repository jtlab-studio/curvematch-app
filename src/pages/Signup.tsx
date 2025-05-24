import React from 'react';
import { Link } from 'react-router-dom';
import SignupForm from '../modules/auth/components/SignupForm';

const Signup: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full bg-gradient-to-br from-secondary to-tertiary opacity-10"></div>
      </div>

      {/* Signup Form */}
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Join CurveMatch</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Start discovering your perfect trails today
          </p>
        </div>
        
        <SignupForm />
        
        <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-accent-1 hover:underline font-medium">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
