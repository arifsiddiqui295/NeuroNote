import apiClient from './apiClient';

const BASE_URL = import.meta.env.VITE_API_URL;

// 2. Create the specific URL for your auth service
const API_URL = `${BASE_URL}/auth`;

// src/api/authApi.j
const login = async (email, password) => {
  const response = await apiClient.post(`${API_URL}/login`, {
    email,
    password,
  });
  // Just return the data
  return response.data;
};
const register = async (username, email, password) => {
  const response = await apiClient.post(`${API_URL}/register`, {
    username,
    email,
    password,
  });
  return response.data;
};
const authService = {
  login,
  register,
};

export default authService;