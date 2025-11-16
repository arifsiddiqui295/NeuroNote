import axios from 'axios';

// Get the backend URL from your environment variables
const BASE_URL = import.meta.env.VITE_API_URL;

const apiClient = axios.create({
  baseURL: BASE_URL,
});

// --- Request Interceptor ---
// This runs BEFORE any request is sent
apiClient.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.token) {
    config.headers['Authorization'] = `Bearer ${user.token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// --- Response Interceptor ---
// This runs AFTER a response is received
apiClient.interceptors.response.use((response) => {
  // If the request was successful, just return the response
  return response;
}, (error) => {
  // If the error is a 401 (Unauthorized)
  if (error.response && error.response.status === 401) {
    // Remove the expired user data
    localStorage.removeItem('user');
    // Force a redirect to the login page to reset the app state
    window.location.href = '/login';
  }
  return Promise.reject(error);
});

export default apiClient;