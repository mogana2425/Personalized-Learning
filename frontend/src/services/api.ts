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
  // Default to live production server for Android and iOS physical devices
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

// Response interceptor to catch unauthorized errors and auto-logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Token expired or unauthorized, logging out...');
      store.dispatch(logout());
    }
    return Promise.reject(error);
  }
);

export default api;
