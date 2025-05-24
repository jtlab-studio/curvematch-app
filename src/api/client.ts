// src/api/client.ts - Fixed version that doesn't interfere with FormData

import axios, { type AxiosInstance, type AxiosError } from 'axios';

// Create axios instance with minimal configuration
export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 30000,
  withCredentials: true, // Important for cookies
});

// Request interceptor - only set Content-Type for JSON
apiClient.interceptors.request.use(
  (config) => {
    // Only set Content-Type for JSON data, not FormData
    if (
      config.data && 
      !(config.data instanceof FormData) && 
      !(config.data instanceof Blob) &&
      typeof config.data === 'object'
    ) {
      config.headers['Content-Type'] = 'application/json';
    }
    // For FormData, let axios handle the Content-Type with boundary
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // Global error handling
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      // Forbidden
      console.error('Access forbidden');
    } else if (error.response?.status === 500) {
      // Server error
      console.error('Server error occurred');
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;