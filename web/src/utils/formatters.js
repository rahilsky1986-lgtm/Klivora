/**
 * Klivora Web — Utility Formatters
 */

/**
 * Format cents to a currency string
 * @param {number} cents
 * @param {string} currency
 */
export const formatCurrency = (cents, currency = 'USD') => {
  if (cents === null || cents === undefined) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format((cents || 0) / 100);
};

/**
 * Convert dollars (string/number) to cents integer
 */
export const toCents = (dollars) => {
  if (!dollars) return 0;
  return Math.round(parseFloat(String(dollars).replace(/,/g, '')) * 100);
};

/**
 * Convert cents to dollar string (no currency symbol)
 */
export const toDollars = (cents) => {
  if (!cents) return '0.00';
  return ((cents || 0) / 100).toFixed(2);
};

/**
 * Format a date string to a readable format
 */
export const formatDate = (dateStr, opts = {}) => {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
    return date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', ...opts,
    });
  } catch {
    return dateStr;
  }
};

/**
 * Format a date string to a short format (Apr 19)
 */
export const formatDateShort = (dateStr) => {
  return formatDate(dateStr, { month: 'short', day: 'numeric', year: undefined });
};

/**
 * Check if a date is past (overdue)
 */
export const isPast = (dateStr) => {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
};

/**
 * Days until or since a date
 */
export const daysFromNow = (dateStr) => {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.round(diff / (1000 * 60 * 60 * 24));
};

/**
 * Invoice status config
 */
export const INVOICE_STATUS = {
  draft:     { label: 'Draft',     className: 'badge-neutral' },
  sent:      { label: 'Sent',      className: 'badge-primary' },
  viewed:    { label: 'Viewed',    className: 'badge-primary' },
  paid:      { label: 'Paid',      className: 'badge-success' },
  overdue:   { label: 'Overdue',   className: 'badge-danger' },
  cancelled: { label: 'Cancelled', className: 'badge-neutral' },
};

export const getStatusBadgeClass = (status) =>
  INVOICE_STATUS[status]?.className || 'badge-neutral';

export const getStatusLabel = (status) =>
  INVOICE_STATUS[status]?.label || status;

/**
 * Expense categories
 */
export const EXPENSE_CATEGORIES = [
  'Advertising', 'Bank Fees', 'Equipment', 'Insurance',
  'Legal & Professional', 'Meals & Entertainment', 'Office Supplies',
  'Rent', 'Software & Subscriptions', 'Travel', 'Utilities',
  'Wages & Salaries', 'Other',
];

/**
 * Common currencies
 */
export const CURRENCIES = [
  { code: 'USD', label: 'USD — US Dollar' },
  { code: 'EUR', label: 'EUR — Euro' },
  { code: 'GBP', label: 'GBP — British Pound' },
  { code: 'CAD', label: 'CAD — Canadian Dollar' },
  { code: 'AUD', label: 'AUD — Australian Dollar' },
  { code: 'JPY', label: 'JPY — Japanese Yen' },
  { code: 'NGN', label: 'NGN — Nigerian Naira' },
  { code: 'KES', label: 'KES — Kenyan Shilling' },
  { code: 'ZAR', label: 'ZAR — South African Rand' },
  { code: 'INR', label: 'INR — Indian Rupee' },
  { code: 'PKR', label: 'PKR — Pakistani Rupee' },
  { code: 'BRL', label: 'BRL — Brazilian Real' },
];

/**
 * Truncate text
 */
export const truncate = (str, max = 40) => {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '...' : str;
};

/**
 * Get initials from a name
 */
export const getInitials = (name = '') => {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
};
