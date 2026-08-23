const { supabase } = require('../config/supabase');
const { getFrontendUrl } = require('../utils/helpers');
const emailService = require('../services/emailService');
const notificationService = require('../services/notificationService');

let stripe;
let stripeAvailable = false;

try {
  const Stripe = require('stripe');
  const { stripe: stripeConfig } = require('../config/stripe');
  if (stripeConfig?.secretKey) {
    stripe = Stripe(stripeConfig.secretKey, { apiVersion: '2023-10-16' });
    stripeAvailable = true;
  }
} catch {
  console.warn('Stripe not configured or not available');
}

const unavailable = (req, res) =>
  res.status(503).json({
    error: 'Online payments are not available. Please arrange payment manually and mark the invoice as paid.',
  });

const createPaymentLink = async (req, res, next) => {
  if (!stripeAvailable) return unavailable(req, res);

  try {
    const { invoice_id } = req.body;
    if (!invoice_id) return res.status(400).json({ error: 'invoice_id is required' });

    const { data: invoice } = await supabase
      .from('invoices')
      .select('*, customers(*), invoice_items(*)')
      .eq('id', invoice_id)
      .eq('user_id', req.userId)
      .single();

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (invoice.status === 'paid') return res.status(400).json({ error: 'Invoice already paid' });

    const { data: profile } = await supabase
      .from('users')
      .select('business_name, email')
      .eq('id', req.userId)
      .single();

    const lineItems = invoice.invoice_items?.map((item) => ({
      price_data: {
        currency: (invoice.currency || 'USD').toLowerCase(),
        product_data: { name: item.description || 'Line Item' },
        unit_amount: item.unit_price,
      },
      quantity: item.quantity,
    })) || [];

    if (lineItems.length === 0) {
      lineItems.push({
        price_data: {
          currency: (invoice.currency || 'USD').toLowerCase(),
          product_data: { name: invoice.invoice_number },
          unit_amount: invoice.total,
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: `${getFrontendUrl()}/invoices/${invoice.id}?payment=success`,
      cancel_url: `${getFrontendUrl()}/invoices/${invoice.id}?payment=cancelled`,
      customer_email: invoice.customers?.email || profile?.email,
      metadata: { invoice_id: invoice.id, user_id: req.userId },
    });

    await supabase
      .from('invoices')
      .update({ stripe_payment_url: session.url, stripe_payment_intent_id: session.payment_intent })
      .eq('id', invoice_id);

    res.json({ url: session.url, payment_intent: session.payment_intent });
  } catch (err) {
    next(err);
  }
};

const handleWebhook = async (req, res) => {
  if (!stripeAvailable) return res.status(503).send('Stripe not configured');

  const sig = req.headers['stripe-signature'];
  const { stripe: stripeConfig } = require('../config/stripe');
  const webhookSecret = stripeConfig?.webhookSecret;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const invoiceId = session.metadata?.invoice_id;
    const paymentIntentId = session.payment_intent;

    if (invoiceId) {
      // Get invoice details for notifications
      const { data: invoice } = await supabase
        .from('invoices')
        .select('*, customers(*)')
        .eq('id', invoiceId)
        .single();

      await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          stripe_payment_intent_id: paymentIntentId,
        })
        .eq('id', invoiceId);

      await supabase.from('payments').insert({
        invoice_id: invoiceId,
        amount: session.amount_total,
        currency: session.currency?.toUpperCase() || 'USD',
        stripe_payment_intent_id: paymentIntentId,
        stripe_charge_id: session.payment_intent,
        status: 'succeeded',
        paid_at: new Date().toISOString(),
      });

      // Create transaction for revenue
      await supabase.from('transactions').insert({
        user_id: session.metadata?.user_id,
        date: new Date().toISOString().split('T')[0],
        amount: session.amount_total,
        type: 'credit',
        description: `Invoice payment: ${session.metadata?.invoice_id}`,
        reference: paymentIntentId,
      });

      // Send notifications and email
      if (invoice) {
        const { data: profile } = await supabase
          .from('users')
          .select('business_name')
          .eq('id', session.metadata?.user_id)
          .single();

        await notificationService.notifyPaymentReceived(
          session.metadata?.user_id,
          invoice,
          session.amount_total
        );

        if (profile?.business_name && invoice.customers?.email) {
          await emailService.sendPaymentConfirmation(invoice, profile, session.amount_total);
        }
      }
    }
  }

  res.json({ received: true });
};

const history = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*, invoices(invoice_number)')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data || []);
  } catch (err) {
    next(err);
  }
};

module.exports = { createPaymentLink, handleWebhook, history };