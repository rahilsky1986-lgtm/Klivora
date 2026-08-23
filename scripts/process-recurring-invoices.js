#!/usr/bin/env node
/**
 * Recurring Invoices Processor
 * Run this via cron (e.g., daily at midnight) to generate recurring invoices
 * Usage: node scripts/process-recurring-invoices.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function processRecurringInvoices() {
  console.log('Starting recurring invoices processing...');
  const today = new Date().toISOString().split('T')[0];

  // Find recurring invoices due today
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('*, invoice_items(*), customers(*)')
    .eq('recurring', true)
    .lte('recurring_next_date', today);

  if (error) {
    console.error('Error fetching recurring invoices:', error);
    process.exit(1);
  }

  if (!invoices || invoices.length === 0) {
    console.log('No recurring invoices due today');
    return;
  }

  console.log(`Found ${invoices.length} recurring invoices to process`);

  for (const invoice of invoices) {
    try {
      await processSingleRecurringInvoice(invoice, today);
    } catch (err) {
      console.error(`Failed to process recurring invoice ${invoice.invoice_number}:`, err);
    }
  }

  console.log('Recurring invoices processing complete');
}

async function processSingleRecurringInvoice(original, today) {
  const { data: profile } = await supabase
    .from('users')
    .select('invoice_prefix, next_invoice_number')
    .eq('id', original.user_id)
    .single();

  const generateInvoiceNumber = (prefix, nextNumber) => {
    return `${prefix}-${String(nextNumber).padStart(4, '0')}`;
  };

  const invoice_number = generateInvoiceNumber(
    profile.invoice_prefix,
    profile.next_invoice_number
  );

  // Calculate next recurring date
  let nextDate = new Date(original.recurring_next_date);
  switch (original.recurring_interval) {
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      nextDate.setMonth(nextDate.getMonth() + 1);
  }
  const nextDateStr = nextDate.toISOString().split('T')[0];

  // Create new invoice
  const { data: newInvoice } = await supabase
    .from('invoices')
    .insert({
      user_id: original.user_id,
      customer_id: original.customer_id,
      invoice_number,
      status: 'draft',
      issue_date: today,
      due_date: addDays(today, 30), // Default 30 days from today
      subtotal: original.subtotal,
      tax_amount: original.tax_amount,
      discount_amount: original.discount_amount,
      total: original.total,
      currency: original.currency,
      notes: original.notes,
      payment_terms: original.payment_terms,
      recurring: true,
      recurring_interval: original.recurring_interval,
      recurring_next_date: nextDateStr,
    })
    .select()
    .single();

  if (original.invoice_items?.length > 0) {
    const items = original.invoice_items.map(({ id, invoice_id, ...item }) => ({
      ...item,
      invoice_id: newInvoice.id,
    }));
    await supabase.from('invoice_items').insert(items);
  }

  // Update original invoice's next date
  await supabase
    .from('invoices')
    .update({ recurring_next_date: nextDateStr })
    .eq('id', original.id);

  // Update user's invoice counter
  await supabase
    .from('users')
    .update({ next_invoice_number: (profile.next_invoice_number || 1) + 1 })
    .eq('id', original.user_id);

  console.log(`Created recurring invoice ${invoice_number} from ${original.invoice_number}`);
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

processRecurringInvoices()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });