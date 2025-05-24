import { useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import * as authApi from '../api/authApi';

interface SignupData {
  email: string;
  username: string;
  password: string;
  interest?: string;
}

export const useAuth = () => {
  const { user, isAuthenticated, setUser, clearAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(email, password);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  }, [clearAuth]);

  const signup = useCallback(async (data: SignupData) => {
    setIsLoading(true);
    try {
      const response = await authApi.signup(data);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    signup,
  };
};
