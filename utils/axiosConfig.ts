// smch-mobile-app/utils/axiosConfig.ts
// Axios configuration with ngrok headers and Bearer token interceptor

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './api';

/**
 * Create a configured axios instance with:
 * - Automatic Bearer token injection
 * - ngrok-skip-browser-warning header (CRITICAL for mobile)
 * - Proper error handling
 */
export const createAxiosInstance = () => {
  const instance = axios.create({
    baseURL: API_URL,
    timeout: 30000,
  });

  // Request interceptor: Attach Bearer token and ngrok header
  instance.interceptors.request.use(
    async (config) => {
      try {
        const token = await AsyncStorage.getItem('token');
        
        // CRITICAL: Add ngrok skip-browser-warning header
        // Without this, ngrok returns HTML warning page instead of JSON
        config.headers['ngrok-skip-browser-warning'] = 'true';
        
        // Attach Bearer token if available
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        
        return config;
      } catch (error) {
        console.error('Error in axios request interceptor:', error);
        return config;
      }
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor: Handle auth errors
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      // Handle 401 Unauthorized errors
      if (error.response?.status === 401) {
        console.warn('Unauthorized - clearing token');
        AsyncStorage.removeItem('token');
        // Optionally, redirect to login here via router
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// Export a default instance
export const axiosInstance = createAxiosInstance();

export default axiosInstance;
