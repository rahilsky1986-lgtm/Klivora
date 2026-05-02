// Payments module — Stripe removed (not available in this region).
// These handlers return a clear message so any leftover route calls
// fail gracefully instead of crashing.

const unavailable = (req, res) =>
  res.status(503).json({
    error: 'Online payments are not available. Please arrange payment manually and mark the invoice as paid.',
  });

module.exports = { createPaymentLink: unavailable, handleWebhook: unavailable, history: unavailable };
