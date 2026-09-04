import axios from 'axios';

// Create a reusable Axios instance with the backend URL pre-configured
const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,  // This sends cookies with every request (needed for refresh tokens)
});

export default API; 