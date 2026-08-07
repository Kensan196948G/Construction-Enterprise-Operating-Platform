import axios from 'axios';

export const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
});

// Bearer token は cdx-shared-auth の SSO ハンドラから注入される想定
api.interceptors.request.use((config) => {
  const token = (window as any).__CDX_TOKEN__;
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});
