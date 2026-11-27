import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('admin_access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

let isRefreshing = false;
let pendingQueue: { resolve: (val: any) => void; reject: (err: any) => void }[] = [];

const processQueue = (error: any, token: string | null = null) => {
  pendingQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  pendingQueue = [];
};

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    // Do NOT intercept if the request was to auth endpoints (login, refresh) or if already retried
    if (!originalRequest || originalRequest._retry || originalRequest.url?.includes('/auth/')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Use raw axios to prevent infinite recursive interceptor deadlocks
        const refreshRes = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true, timeout: 5000 }
        );
        const newToken = refreshRes.data?.data?.accessToken;
        if (newToken && typeof window !== 'undefined') {
          sessionStorage.setItem('admin_access_token', newToken);
        }
        processQueue(null, newToken);
        if (newToken) {
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        }
        return apiClient(originalRequest);
      } catch (err) {
        processQueue(err, null);
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('admin_access_token');
          sessionStorage.removeItem('admin_user');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export function getErrorMessage(err: any, fallback = 'An unexpected error occurred'): string {
  if (!err) return fallback;
  const errorObj = err.response?.data?.error;
  if (errorObj?.code === 'PERMISSION_DENIED') {
    return errorObj.message || 'Access denied: You do not have permission for this action.';
  }
  if (errorObj?.details) {
    if (Array.isArray(errorObj.details)) {
      return errorObj.details
        .map((d: any) => (d.message ? (d.path ? `${d.path}: ${d.message}` : d.message) : typeof d === 'string' ? d : JSON.stringify(d)))
        .join(', ');
    }
    if (typeof errorObj.details === 'string') return errorObj.details;
    if (typeof errorObj.details === 'object' && errorObj.details.requiredPermission) {
      return `Access denied: Missing '${errorObj.details.requiredPermission}' privilege.`;
    }
    if (typeof errorObj.details === 'object') return Object.values(errorObj.details).join(', ');
  }
  if (errorObj?.message) return errorObj.message;
  if (err.response?.data?.message) return err.response.data.message;
  if (err.message) return err.message;
  return fallback;
}

export default apiClient;
