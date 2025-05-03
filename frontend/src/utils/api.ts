import axios from 'axios';
import { getAuthToken } from '../store/authStore'; // Import from Zustand store

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Remove the local getToken function
// const getToken = (): string | null => {
//   return localStorage.getItem('authToken');
// };

// Add a request interceptor to include the token in headers
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken(); // Use token from Zustand store
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// You might want to add response interceptors for error handling (e.g., 401 redirect)
// apiClient.interceptors.response.use(...);

export default apiClient; 