import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('cdx_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
