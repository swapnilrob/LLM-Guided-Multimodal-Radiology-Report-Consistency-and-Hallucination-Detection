import axios from 'axios';

// Create a reusable Axios instance with the backend URL pre-configured
const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
});

// Automatically attach the JWT token to every request
API.interceptors.request.use((config) => {
  // Get token from sessionStorage (set during login)
  const token = sessionStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;