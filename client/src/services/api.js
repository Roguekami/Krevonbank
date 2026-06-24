import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  withCredentials: true,
});

let csrfTokenFetched = false;

// Request interceptor to attach CSRF token
api.interceptors.request.use(async (config) => {
  // Only fetch CSRF for mutating methods if we haven't already
  if (!csrfTokenFetched && ['post', 'put', 'delete', 'patch'].includes(config.method)) {
    try {
      const { data } = await axios.get(`${api.defaults.baseURL}/csrf-token`, { withCredentials: true });
      api.defaults.headers['x-csrf-token'] = data.csrfToken;
      config.headers['x-csrf-token'] = data.csrfToken;
      csrfTokenFetched = true;
    } catch (err) {
      console.error('Failed to fetch CSRF token:', err);
    }
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor to handle 401s globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't redirect if the failed request was checking session state
      if (error.config && error.config.url && !error.config.url.includes('/auth/me')) {
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
