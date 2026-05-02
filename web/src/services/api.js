import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Shared Supabase client for token retrieval
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 30000,
});

// Inject auth token from Supabase session
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch {}
  return config;
});

// Handle errors globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(err.response?.data || err);
  }
);

// ── API Methods ──────────────────────────────────────────────

// Dashboard
export const getDashboardSummary = () => api.get('/reports/dashboard-summary');

// Customers
export const getCustomers = (params) => api.get('/customers', { params });
export const getCustomer = (id) => api.get(`/customers/${id}`);
export const createCustomer = (data) => api.post('/customers', data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data);
export const deleteCustomer = (id) => api.delete(`/customers/${id}`);
export const getCustomerInvoices = (id) => api.get(`/customers/${id}/invoices`);
export const getCustomerBalance = (id) => api.get(`/customers/${id}/balance`);

// Invoices
export const getInvoices = (params) => api.get('/invoices', { params });
export const getInvoice = (id) => api.get(`/invoices/${id}`);
export const createInvoice = (data) => api.post('/invoices', data);
export const updateInvoice = (id, data) => api.put(`/invoices/${id}`, data);
export const deleteInvoice = (id) => api.delete(`/invoices/${id}`);
export const sendInvoice = (id) => api.post(`/invoices/${id}/send`);
export const duplicateInvoice = (id) => api.post(`/invoices/${id}/duplicate`);
export const updateInvoiceStatus = (id, status) => api.patch(`/invoices/${id}/status`, { status });
export const downloadInvoicePdf = async (id, invoiceNumber) => {
  const res = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${invoiceNumber}.pdf`;
  a.click();
  window.URL.revokeObjectURL(url);
};

// Expenses
export const getExpenses = (params) => api.get('/expenses', { params });
export const getExpense = (id) => api.get(`/expenses/${id}`);
export const createExpense = (data) => api.post('/expenses', data);
export const updateExpense = (id, data) => api.put(`/expenses/${id}`, data);
export const deleteExpense = (id) => api.delete(`/expenses/${id}`);
export const uploadReceipt = (id, file) => {
  const fd = new FormData();
  fd.append('receipt', file);
  return api.post(`/expenses/${id}/receipt`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
};

// Accounts
export const getAccounts = () => api.get('/accounts');
export const createAccount = (data) => api.post('/accounts', data);
export const updateAccount = (id, data) => api.put(`/accounts/${id}`, data);
export const deleteAccount = (id) => api.delete(`/accounts/${id}`);

// Transactions
export const getTransactions = (params) => api.get('/transactions', { params });
export const createTransaction = (data) => api.post('/transactions', data);
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`);

// Payroll - Employees
export const getEmployees = () => api.get('/payroll/employees');
export const getEmployee = (id) => api.get(`/payroll/employees/${id}`);
export const createEmployee = (data) => api.post('/payroll/employees', data);
export const updateEmployee = (id, data) => api.put(`/payroll/employees/${id}`, data);
export const deleteEmployee = (id) => api.delete(`/payroll/employees/${id}`);

// Payroll - Runs
export const getPayrollRuns = (params) => api.get('/payroll/runs', { params });
export const runPayroll = (data) => api.post('/payroll/runs', data);
export const getPayrollRun = (id) => api.get(`/payroll/runs/${id}`);
export const updatePayrollStatus = (id, status) => api.patch(`/payroll/runs/${id}/status`, { status });
export const downloadPayslip = async (id, employeeName) => {
  const res = await api.get(`/payroll/runs/${id}/payslip`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `payslip-${employeeName}.pdf`;
  a.click();
  window.URL.revokeObjectURL(url);
};

// Reports
export const getProfitLoss = (params) => api.get('/reports/profit-loss', { params });
export const getBalanceSheet = () => api.get('/reports/balance-sheet');
export const getTaxSummary = (params) => api.get('/reports/tax-summary', { params });

// Payments
export const createPaymentLink = (invoiceId) => api.post('/payments/create-payment-link', { invoice_id: invoiceId });
export const getPaymentHistory = () => api.get('/payments/history');

// Notifications
export const getNotifications = () => api.get('/notifications');
export const markNotificationRead = (id) => api.patch(`/notifications/${id}/read`);
export const markAllRead = () => api.patch('/notifications/read-all');

// User Profile
export const getProfile = () => api.get('/users/me');
export const updateProfile = (data) => api.put('/users/me', data);
export const completeOnboarding = (data) => api.put('/users/me/onboarding', data);
export const uploadLogo = (file) => {
  const fd = new FormData();
  fd.append('logo', file);
  return api.post('/users/me/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
};

export default api;
