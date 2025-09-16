import axios from 'axios';

const http = axios.create({
  baseURL: process.env.REACT_APP_API_BASE || 'http://localhost:5000/api',
  withCredentials: false,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('fuelx_token'); // <- MUST be set at login
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default http;
