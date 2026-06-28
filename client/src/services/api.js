import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  withCredentials: true,
});

// Request interceptor — attach Bearer token from localStorage if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('krevon_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor — handle 401s globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/') {
        localStorage.removeItem('krevon_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
