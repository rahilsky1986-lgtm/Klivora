#!/usr/bin/env node
/**
 * Overdue Invoices Checker
 * Run this via cron (e.g., daily at 9 AM) to check for overdue invoices
 * and create notifications
 * Usage: node scripts/check-overdue-invoices.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkOverdueInvoices() {
  console.log('Checking for overdue invoices...');
  const today = new Date().toISOString().split('T')[0];

  // Find invoices that are overdue (status is 'sent' or 'viewed' and due_date < today)
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('id, invoice_number, customer_id, due_date, status, user_id, total, currency, customers(name)')
    .in('status', ['sent', 'viewed'])
    .lt('due_date', today);

  if (error) {
    console.error('Error fetching invoices:', error);
    process.exit(1);
  }

  if (!invoices || invoices.length === 0) {
    console.log('No overdue invoices found');
    return;
  }

  console.log(`Found ${invoices.length} overdue invoices`);

  for (const invoice of invoices) {
    try {
      // Update status to overdue
      await supabase
        .from('invoices')
        .update({ status: 'overdue' })
        .eq('id', invoice.id);

      // Create notification for the user
      await supabase.from('notifications').insert({
        user_id: invoice.user_id,
        type: 'invoice_overdue',
        title: 'Invoice Overdue',
        message: `Invoice ${invoice.invoice_number} for ${invoice.customers?.name || 'customer'} is now overdue`,
        action_url: `/invoices/${invoice.id}`,
      });

      console.log(`Marked ${invoice.invoice_number} as overdue`);
    } catch (err) {
      console.error(`Failed to process overdue invoice ${invoice.invoice_number}:`, err);
    }
  }

  console.log('Overdue check complete');
}

checkOverdueInvoices()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });