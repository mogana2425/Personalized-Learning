import axios from 'axios';
import { Platform } from 'react-native';
import { store } from '../store';
import { logout } from '../store/authSlice';

const PRODUCTION_URL = 'https://personalized-learning-2mb7.onrender.com/api';
const LOCAL_URL = 'http://localhost:5001/api';

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return LOCAL_URL;
    }
  }
  return PRODUCTION_URL;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 180000, // 3 minutes timeout for AI evaluation and OCR processing
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically add authorization token
api.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to catch unauthorized errors and recover from transient network errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isNetworkError = !error.response && (error.message === 'Network Error' || error.code === 'ERR_NETWORK');

    if (isNetworkError && originalRequest) {
      originalRequest._retryCount = originalRequest._retryCount || 0;

      // Web only: local dev servers and the production API live on different hosts,
      // so a single failover swap between them is still useful there.
      if (Platform.OS === 'web' && originalRequest._retryCount === 0) {
        originalRequest._retryCount += 1;
        const failoverUrl = originalRequest.baseURL === PRODUCTION_URL ? LOCAL_URL : PRODUCTION_URL;
        console.warn(`[API Failover] Primary endpoint failed. Retrying request with failover endpoint: ${failoverUrl}`);
        originalRequest.baseURL = failoverUrl;
        return api(originalRequest);
      }

      // Native (physical devices/emulators): "localhost" resolves to the device itself,
      // so failing over there can never succeed and previously produced a confusing
      // "Network Error" even when the real server was fine. Retry the SAME server
      // instead, with backoff - this recovers automatically when the error was caused
      // by the backend cold-starting (e.g. a Render free-tier instance spinning back up
      // from sleep), which surfaces to axios as a bare, response-less "Network Error".
      if (Platform.OS !== 'web' && originalRequest._retryCount < 2) {
        originalRequest._retryCount += 1;
        const delayMs = 4000 * originalRequest._retryCount;
        console.warn(`[API Retry] Network error, retrying in ${delayMs}ms (attempt ${originalRequest._retryCount})`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return api(originalRequest);
      }
    }

    if (error.response && error.response.status === 401) {
      console.warn('Token expired or unauthorized, logging out...');
      store.dispatch(logout());
    }
    return Promise.reject(error);
  }
);

export default api;
