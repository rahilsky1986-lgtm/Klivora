export const fmt = (cents: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format((cents || 0) / 100);

export const toCents = (dollars: string | number) => Math.round(parseFloat(String(dollars || 0)) * 100);
export const toDollars = (cents: number) => (cents / 100).toFixed(2);

export const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

export const formatShortDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
};

export const today = () => new Date().toISOString().split('T')[0];

export const addDays = (dateStr: string, days: number) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

export const EXPENSE_CATEGORIES = [
  'Office Supplies', 'Software', 'Travel', 'Meals', 'Marketing',
  'Utilities', 'Rent', 'Insurance', 'Professional Services', 'Equipment',
  'Vehicle', 'Training', 'Subscriptions', 'Other',
];

export const CURRENCIES = [
  { code: 'USD', label: 'USD ($)' },
  { code: 'EUR', label: 'EUR (€)' },
  { code: 'GBP', label: 'GBP (£)' },
  { code: 'CAD', label: 'CAD ($)' },
  { code: 'AUD', label: 'AUD ($)' },
];

export const getInitials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

export const statusColor: Record<string, string> = {
  paid: '#00C896',
  overdue: '#FF4757',
  sent: '#2D6BE4',
  draft: '#9AA0BA',
  viewed: '#2D6BE4',
  cancelled: '#9AA0BA',
};

export const PAY_FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'annually', label: 'Annually' },
];

export const ACCOUNT_TYPES = [
  { value: 'asset', label: 'Asset' },
  { value: 'liability', label: 'Liability' },
  { value: 'equity', label: 'Equity' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
];

export const TRANSACTION_TYPES = [
  { value: 'debit', label: 'Debit' },
  { value: 'credit', label: 'Credit' },
];

export const INVOICE_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'viewed', label: 'Viewed' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const PAYROLL_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'approved', label: 'Approved' },
  { value: 'paid', label: 'Paid' },
];