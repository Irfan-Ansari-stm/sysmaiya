import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const ACCESS_TOKEN_COOKIE = 'access_token';

let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: any) => void; reject: (e: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    error ? reject(error) : resolve(token);
  });
  failedQueue = [];
};

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  withCredentials: true, // Send cookies
  headers: { 'Content-Type': 'application/json' },
});

const getStoredAccessToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token') || Cookies.get(ACCESS_TOKEN_COOKIE) || null;
};

// ─── Request Interceptor: Attach Access Token ──────────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getStoredAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
      if (typeof window !== 'undefined' && localStorage.getItem('access_token') !== token) {
        localStorage.setItem('access_token', token);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: Auto-refresh on 401 ─────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers!.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${API_BASE}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = data.data.access_token;
        setAuthToken(newToken);
        processQueue(null, newToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuthToken();
        if (typeof window !== 'undefined') window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── Typed API helpers ────────────────────────────────────────────────────────
export const setAuthToken = (token: string) => {
  localStorage.setItem('access_token', token);
  Cookies.set(ACCESS_TOKEN_COOKIE, token, { sameSite: 'lax' });
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export const clearAuthToken = () => {
  localStorage.removeItem('access_token');
  Cookies.remove(ACCESS_TOKEN_COOKIE);
  delete api.defaults.headers.common['Authorization'];
};

export default api;
