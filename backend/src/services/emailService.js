const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const formatCents = (cents, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
};

const sendInvoice = async (invoice, profile) => {
  if (!resend) {
    console.warn('Email not sent: RESEND_API_KEY not configured');
    return;
  }

  const customer = invoice.customers;
  const items = invoice.invoice_items || [];
  const currency = invoice.currency || 'USD';

  const itemRows = items.map((item) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #f0f0f0;">${item.description}</td>
      <td style="padding:8px;border-bottom:1px solid #f0f0f0;text-align:center;">${item.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #f0f0f0;text-align:right;">${formatCents(item.unit_price, currency)}</td>
      <td style="padding:8px;border-bottom:1px solid #f0f0f0;text-align:right;">${formatCents(item.amount, currency)}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><style>
      body { font-family: Inter, sans-serif; background: #F8FAFF; margin: 0; padding: 20px; }
      .card { background: white; max-width: 600px; margin: 0 auto; border-radius: 12px; padding: 40px; box-shadow: 0 2px 12px rgba(45,107,228,0.08); }
      h1 { color: #2D6BE4; margin: 0 0 8px; }
      .meta { color: #777; font-size: 14px; margin-bottom: 32px; }
      table { width: 100%; border-collapse: collapse; margin: 24px 0; }
      th { background: #F8FAFF; padding: 10px 8px; text-align: left; font-size: 13px; color: #666; }
      .total-row td { font-weight: 700; font-size: 16px; color: #1A1A2E; padding: 12px 8px; }
      .paid-badge { display: inline-block; background: #00C896; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
      .cta { display: block; background: #2D6BE4; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; text-align: center; font-weight: 600; margin: 24px 0; }
      .footer { color: #999; font-size: 12px; text-align: center; margin-top: 32px; }
    </style></head>
    <body>
    <div class="card">
      <h1>Invoice ${invoice.invoice_number}</h1>
      <div class="meta">
        From: <strong>${profile.business_name || 'Your Business'}</strong><br>
        To: <strong>${customer?.name || 'Customer'}</strong><br>
        Due: <strong>${invoice.due_date || 'Upon receipt'}</strong>
      </div>

      <table>
        <thead>
          <tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Amount</th></tr>
        </thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr><td colspan="3" style="padding:8px;text-align:right;color:#666;">Subtotal</td><td style="padding:8px;text-align:right;">${formatCents(invoice.subtotal, currency)}</td></tr>
          ${invoice.tax_amount > 0 ? `<tr><td colspan="3" style="padding:8px;text-align:right;color:#666;">Tax</td><td style="padding:8px;text-align:right;">${formatCents(invoice.tax_amount, currency)}</td></tr>` : ''}
          ${invoice.discount_amount > 0 ? `<tr><td colspan="3" style="padding:8px;text-align:right;color:#666;">Discount</td><td style="padding:8px;text-align:right;">-${formatCents(invoice.discount_amount, currency)}</td></tr>` : ''}
          <tr class="total-row"><td colspan="3" style="padding:12px 8px;text-align:right;">Total</td><td style="padding:12px 8px;text-align:right;">${formatCents(invoice.total, currency)}</td></tr>
        </tfoot>
      </table>

      ${invoice.stripe_payment_url ? `<a href="${invoice.stripe_payment_url}" class="cta">💳 Pay Now</a>` : ''}
      ${invoice.notes ? `<p style="color:#666;font-size:14px;">Note: ${invoice.notes}</p>` : ''}

      <div class="footer">Powered by Klivora · Free invoicing for everyone</div>
    </div>
    </body></html>
  `;

  await resend.emails.send({
    from: process.env.FROM_EMAIL || 'invoices@Klivora.app',
    to: customer?.email,
    subject: `Invoice ${invoice.invoice_number} from ${profile.business_name || 'Klivora'}`,
    html,
  });
};

const sendPaymentConfirmation = async (invoice, profile, amountPaid) => {
  if (!resend || !invoice.customers?.email) return;

  await resend.emails.send({
    from: process.env.FROM_EMAIL || 'invoices@Klivora.app',
    to: invoice.customers.email,
    subject: `Payment confirmed — Invoice ${invoice.invoice_number}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:500px;margin:0 auto;padding:32px;">
        <h2 style="color:#00C896;">✅ Payment Received</h2>
        <p>Hi ${invoice.customers.name},</p>
        <p>We've received your payment of <strong>${formatCents(amountPaid, invoice.currency)}</strong> for invoice <strong>${invoice.invoice_number}</strong>.</p>
        <p>Thank you for your business!</p>
        <p style="color:#999;font-size:12px;">— ${profile.business_name || 'Klivora'}</p>
      </div>
    `,
  });
};

module.exports = { sendInvoice, sendPaymentConfirmation };
