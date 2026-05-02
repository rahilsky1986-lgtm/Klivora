/**
 * Utility helpers for Klivora backend
 */

/**
 * Format amount from cents to display string
 * @param {number} cents
 * @param {string} currency
 */
const formatCurrency = (cents, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100);
};

/**
 * Convert dollars to cents (safe integer math)
 * @param {number|string} dollars
 */
const toCents = (dollars) => {
  return Math.round(parseFloat(dollars) * 100);
};

/**
 * Convert cents to dollars
 * @param {number} cents
 */
const toDollars = (cents) => {
  return (cents / 100).toFixed(2);
};

/**
 * Generate invoice number
 * @param {string} prefix e.g. "INV"
 * @param {number} nextNumber e.g. 42
 */
const generateInvoiceNumber = (prefix = 'INV', nextNumber = 1) => {
  return `${prefix}-${String(nextNumber).padStart(4, '0')}`;
};

/**
 * Calculate invoice totals from line items
 * @param {Array} items - Array of { quantity, unit_price, tax_rate }
 * @param {number} discountAmount - discount in cents
 */
const calculateInvoiceTotals = (items, discountAmount = 0) => {
  let subtotal = 0;
  let taxAmount = 0;

  for (const item of items) {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseInt(item.unit_price) || 0;
    const taxRate = parseFloat(item.tax_rate) || 0;
    const lineAmount = Math.round(qty * price);
    const lineTax = Math.round(lineAmount * (taxRate / 100));
    subtotal += lineAmount;
    taxAmount += lineTax;
  }

  const total = subtotal + taxAmount - (parseInt(discountAmount) || 0);
  return { subtotal, tax_amount: taxAmount, total: Math.max(0, total) };
};

/**
 * Calculate payroll deductions and net pay
 * @param {number} gross - gross pay in cents
 * @param {object} taxInfo - { tax_rate, other_deductions }
 */
const calculatePayroll = (gross, taxInfo = {}) => {
  const taxRate = parseFloat(taxInfo.tax_rate) || 0;
  const otherDeductions = parseInt(taxInfo.other_deductions) || 0;
  const taxDeduction = Math.round(gross * (taxRate / 100));
  const totalDeductions = taxDeduction + otherDeductions;
  const net = gross - totalDeductions;
  return { gross, deductions: totalDeductions, net: Math.max(0, net) };
};

/**
 * Paginate Supabase query results
 * @param {number} page - 1-indexed
 * @param {number} limit
 */
const getPagination = (page = 1, limit = 20) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  return { from, to };
};

/**
 * Standard success response
 */
const success = (res, data, statusCode = 200) => {
  return res.status(statusCode).json(data);
};

/**
 * Standard error response
 */
const fail = (res, message, statusCode = 400) => {
  return res.status(statusCode).json({ error: message });
};

module.exports = {
  formatCurrency,
  toCents,
  toDollars,
  generateInvoiceNumber,
  calculateInvoiceTotals,
  calculatePayroll,
  getPagination,
  success,
  fail,
};
