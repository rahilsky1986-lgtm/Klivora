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

// ── API Methods ──────────────────────────────────────────────

// Customers
export const getCustomers = (params?: Record<string, string | number>) =>
  getWithRetry('/customers', { params });
export const createCustomer = (data: Record<string, unknown>) =>
  postWithRetry('/customers', data);
export const updateCustomer = (id: string, data: Record<string, unknown>) =>
  putWithRetry(`/customers/${id}`, data);
export const deleteCustomer = (id: string) =>
  deleteWithRetry(`/customers/${id}`);

// Invoices
export const getInvoices = (params?: Record<string, string | number>) =>
  getWithRetry('/invoices', { params });
export const getInvoice = (id: string) =>
  getWithRetry(`/invoices/${id}`);
export const createInvoice = (data: Record<string, unknown>) =>
  postWithRetry('/invoices', data);
export const updateInvoice = (id: string, data: Record<string, unknown>) =>
  putWithRetry(`/invoices/${id}`, data);
export const deleteInvoice = (id: string) =>
  deleteWithRetry(`/invoices/${id}`);
export const sendInvoice = (id: string) =>
  postWithRetry(`/invoices/${id}/send`);
export const updateInvoiceStatus = (id: string, status: string) =>
  patchWithRetry(`/invoices/${id}/status`, { status });
export const duplicateInvoice = (id: string) =>
  postWithRetry(`/invoices/${id}/duplicate`);

// Expenses
export const getExpenses = (params?: Record<string, string | number>) =>
  getWithRetry('/expenses', { params });
export const createExpense = (data: Record<string, unknown>) =>
  postWithRetry('/expenses', data);
export const updateExpense = (id: string, data: Record<string, unknown>) =>
  putWithRetry(`/expenses/${id}`, data);
export const deleteExpense = (id: string) =>
  deleteWithRetry(`/expenses/${id}`);
export const uploadReceipt = (id: string, file: { uri: string; name: string; type: string }) => {
  const fd = new FormData();
  fd.append('receipt', file as any);
  return postWithRetry(`/expenses/${id}/receipt`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
};

// Accounts
export const getAccounts = () =>
  getWithRetry('/accounts');
export const createAccount = (data: Record<string, unknown>) =>
  postWithRetry('/accounts', data);
export const updateAccount = (id: string, data: Record<string, unknown>) =>
  putWithRetry(`/accounts/${id}`, data);
export const deleteAccount = (id: string) =>
  deleteWithRetry(`/accounts/${id}`);

// Transactions
export const getTransactions = (params?: Record<string, string | number>) =>
  getWithRetry('/transactions', { params });
export const createTransaction = (data: Record<string, unknown>) =>
  postWithRetry('/transactions', data);
export const deleteTransaction = (id: string) =>
  deleteWithRetry(`/transactions/${id}`);

// Payroll - Employees
export const getEmployees = () =>
  getWithRetry('/payroll/employees');
export const createEmployee = (data: Record<string, unknown>) =>
  postWithRetry('/payroll/employees', data);
export const updateEmployee = (id: string, data: Record<string, unknown>) =>
  putWithRetry(`/payroll/employees/${id}`, data);
export const deleteEmployee = (id: string) =>
  deleteWithRetry(`/payroll/employees/${id}`);

// Payroll - Runs
export const getPayrollRuns = (params?: Record<string, string | number>) =>
  getWithRetry('/payroll/runs', { params });
export const runPayroll = (data: Record<string, unknown>) =>
  postWithRetry('/payroll/runs', data);
export const updatePayrollStatus = (id: string, status: string) =>
  patchWithRetry(`/payroll/runs/${id}/status`, { status });

// Reports
export const getDashboardSummary = () =>
  getWithRetry('/reports/dashboard-summary');
export const getProfitLoss = (params?: Record<string, string | number>) =>
  getWithRetry('/reports/profit-loss', { params });
export const getBalanceSheet = () =>
  getWithRetry('/reports/balance-sheet');
export const getTaxSummary = (params?: Record<string, string | number>) =>
  getWithRetry('/reports/tax-summary', { params });
export const getTrialBalance = () =>
  getWithRetry('/reports/trial-balance');
export const getGeneralLedger = (params?: Record<string, string | number>) =>
  getWithRetry('/reports/general-ledger', { params });

// User Profile
export const getProfile = () =>
  getWithRetry('/users/me');
export const updateProfile = (data: Record<string, unknown>) =>
  putWithRetry('/users/me', data);
export const uploadLogo = (file: { uri: string; name: string; type: string }) => {
  const fd = new FormData();
  fd.append('logo', file as any);
  return postWithRetry('/users/me/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
};

// Notifications
export const getNotifications = () =>
  getWithRetry('/notifications');
export const markNotificationRead = (id: string) =>
  patchWithRetry(`/notifications/${id}/read`);
export const markAllNotificationsRead = () =>
  patchWithRetry('/notifications/read-all');

// Payments
export const createPaymentLink = (invoiceId: string) =>
  postWithRetry('/payments/create-payment-link', { invoice_id: invoiceId });

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

export const postWithRetry = async <T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
  retries = 1,
  delayMs = 250,
): Promise<AxiosResponse<T>> => {
  return runWithRetry(() => api.post<T>(url, data, config), retries, delayMs);
};

export const putWithRetry = async <T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
  retries = 1,
  delayMs = 250,
): Promise<AxiosResponse<T>> => {
  return runWithRetry(() => api.put<T>(url, data, config), retries, delayMs);
};

export const deleteWithRetry = async <T = unknown>(
  url: string,
  config?: AxiosRequestConfig,
  retries = 1,
  delayMs = 250,
): Promise<AxiosResponse<T>> => {
  return runWithRetry(() => api.delete<T>(url, config), retries, delayMs);
};
