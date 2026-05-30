import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';
const ACCESS_TOKEN_KEY = 'klivora_access_token';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000,
});

let authToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;
let unauthorizedNotified = false;

export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  unauthorizedHandler = handler;
};

export const setAccessToken = async (token: string | null) => {
  authToken = token;
  if (token) unauthorizedNotified = false;
  if (token) {
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
  }
};

export const getAccessToken = async () => {
  if (authToken) return authToken;
  authToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  return authToken;
};

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers = config.headers ?? ({} as any);
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401) {
      await setAccessToken(null);
      if (!unauthorizedNotified && unauthorizedHandler) {
        unauthorizedNotified = true;
        unauthorizedHandler();
      }
    }
    return Promise.reject(error);
  }
);

export const getErrorMessage = (error: unknown, fallback = 'Something went wrong. Please try again.') => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      return 'Your session has expired. Please sign in again.';
    }
    if (typeof error.response?.data?.error === 'string') {
      return error.response.data.error;
    }
    if (typeof error.response?.data?.message === 'string') {
      return error.response.data.message;
    }
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. Please check your connection and try again.';
    }
    if (error.message) {
      return error.message;
    }
  }
  return fallback;
};

const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

const shouldRetry = (error: unknown) => {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  if (status == null) return true;
  return RETRYABLE_STATUS.has(status);
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const runWithRetry = async <T>(
  operation: () => Promise<AxiosResponse<T>>,
  retries = 1,
  delayMs = 250,
): Promise<AxiosResponse<T>> => {
  let lastError: unknown = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      if (attempt >= retries || !shouldRetry(err)) break;
      const backoff = delayMs * Math.pow(2, attempt);
      await wait(backoff);
    }
  }
  throw lastError;
};

export const getWithRetry = async <T = unknown>(
  url: string,
  config?: AxiosRequestConfig,
  retries = 1,
  delayMs = 250,
): Promise<AxiosResponse<T>> => {
  return runWithRetry(() => api.get<T>(url, config), retries, delayMs);
};

export const patchWithRetry = async <T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
  retries = 1,
  delayMs = 250,
): Promise<AxiosResponse<T>> => {
  return runWithRetry(() => api.patch<T>(url, data, config), retries, delayMs);
};
