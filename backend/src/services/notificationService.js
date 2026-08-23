const { supabase } = require('../config/supabase');

const NOTIFICATION_TYPES = {
  INVOICE_VIEWED: 'invoice_viewed',
  PAYMENT_RECEIVED: 'payment_received',
  INVOICE_OVERDUE: 'invoice_overdue',
  PAYROLL_DUE: 'payroll_due',
  EXPENSE_ADDED: 'expense_added',
  GENERAL: 'general',
};

const createNotification = async (userId, type, title, message, actionUrl = null) => {
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      message,
      action_url: actionUrl,
    });
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
};

const notifyInvoiceViewed = async (userId, invoice) => {
  await createNotification(
    userId,
    NOTIFICATION_TYPES.INVOICE_VIEWED,
    'Invoice Viewed',
    `Your customer viewed invoice ${invoice.invoice_number}`,
    `/invoices/${invoice.id}`
  );
};

const notifyPaymentReceived = async (userId, invoice, amount) => {
  const { formatCurrency } = require('../utils/helpers');
  await createNotification(
    userId,
    NOTIFICATION_TYPES.PAYMENT_RECEIVED,
    'Payment Received',
    `You received ${formatCurrency(amount, invoice.currency)} for invoice ${invoice.invoice_number}`,
    `/invoices/${invoice.id}`
  );
};

const notifyInvoiceOverdue = async (userId, invoice) => {
  await createNotification(
    userId,
    NOTIFICATION_TYPES.INVOICE_OVERDUE,
    'Invoice Overdue',
    `Invoice ${invoice.invoice_number} is now overdue`,
    `/invoices/${invoice.id}`
  );
};

const notifyPayrollDue = async (userId, employeeName, period) => {
  await createNotification(
    userId,
    NOTIFICATION_TYPES.PAYROLL_DUE,
    'Payroll Due',
    `Payroll run for ${employeeName} (${period}) is due`,
    '/payroll'
  );
};

const notifyExpenseAdded = async (userId, expense) => {
  const { formatCurrency } = require('../utils/helpers');
  await createNotification(
    userId,
    NOTIFICATION_TYPES.EXPENSE_ADDED,
    'Expense Added',
    `New expense: ${formatCurrency(expense.amount)} for ${expense.category}`,
    '/expenses'
  );
};

const notifyGeneral = async (userId, title, message, actionUrl = null) => {
  await createNotification(userId, NOTIFICATION_TYPES.GENERAL, title, message, actionUrl);
};

module.exports = {
  createNotification,
  notifyInvoiceViewed,
  notifyPaymentReceived,
  notifyInvoiceOverdue,
  notifyPayrollDue,
  notifyExpenseAdded,
  notifyGeneral,
  NOTIFICATION_TYPES,
};