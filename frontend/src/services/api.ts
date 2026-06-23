import axios from 'axios';
import { Platform } from 'react-native';
import { store } from '../store';
import { logout } from '../store/authSlice';

// Dynamically handle localhost testing for Android emulators vs iOS/Web
const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // For physical Android devices using adb reverse, localhost works.
  // For emulators, localhost also works if adb reverse tcp:5001 tcp:5001 is run.
  return 'http://localhost:5001/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 60000,
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
