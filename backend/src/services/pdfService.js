/**
 * PDF Generation Service using Puppeteer
 * Generates invoices and payslips as professional PDFs
 */

let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (e) {
  console.warn('Puppeteer not available — PDF generation disabled');
}

const formatCents = (cents, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format((cents || 0) / 100);
};

const generateInvoicePdf = async (invoice, profile) => {
  if (!puppeteer) throw new Error('PDF generation is not available');

  const customer = invoice.customers || {};
  const items = invoice.invoice_items || [];
  const currency = invoice.currency || 'USD';
  const color = profile.primary_color || '#2D6BE4';

  const itemRows = items.map((item) => `
    <tr>
      <td>${item.description || ''}</td>
      <td style="text-align:center;">${item.quantity}</td>
      <td style="text-align:right;">${formatCents(item.unit_price, currency)}</td>
      <td style="text-align:right;">${item.tax_rate ? item.tax_rate + '%' : '—'}</td>
      <td style="text-align:right;">${formatCents(item.amount, currency)}</td>
    </tr>
  `).join('');

  const statusColors = {
    paid: '#00C896', sent: '#2D6BE4', overdue: '#FF4757',
    draft: '#999', viewed: '#5352ED', cancelled: '#999',
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="utf-8">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Inter, sans-serif; color: #1A1A2E; background: white; padding: 48px; font-size: 14px; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; }
      .logo-area h1 { font-size: 24px; color: ${color}; font-weight: 700; }
      .logo-area p { color: #666; font-size: 13px; margin-top: 4px; }
      .invoice-meta { text-align: right; }
      .invoice-number { font-size: 22px; font-weight: 700; color: #1A1A2E; }
      .status-badge { display: inline-block; background: ${statusColors[invoice.status] || '#999'}; color: white; padding: 3px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 6px; }
      .parties { display: flex; gap: 64px; margin-bottom: 40px; }
      .party h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 8px; }
      .party p { font-size: 14px; line-height: 1.6; }
      .dates { display: flex; gap: 48px; background: #F8FAFF; border-radius: 10px; padding: 16px 20px; margin-bottom: 32px; }
      .date-item label { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px; }
      .date-item span { font-weight: 600; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
      thead th { background: ${color}; color: white; padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 600; }
      tbody tr:nth-child(even) td { background: #F8FAFF; }
      tbody td { padding: 10px 12px; border-bottom: 1px solid #eef0f8; font-size: 13px; }
      .totals { margin-left: auto; width: 280px; }
      .totals-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eef0f8; font-size: 13px; }
      .totals-row.total { font-weight: 700; font-size: 16px; border-bottom: none; padding-top: 12px; color: ${color}; }
      .notes { margin-top: 40px; padding: 16px; background: #F8FAFF; border-radius: 10px; border-left: 3px solid ${color}; }
      .notes h4 { font-size: 12px; color: #999; margin-bottom: 6px; }
      .footer { margin-top: 48px; text-align: center; color: #bbb; font-size: 11px; border-top: 1px solid #eef0f8; padding-top: 24px; }
    </style>
    </head>
    <body>
    <div class="header">
      <div class="logo-area">
        ${profile.logo_url ? `<img src="${profile.logo_url}" style="height:48px;margin-bottom:8px;object-fit:contain;">` : ''}
        <h1>${profile.business_name || 'Your Business'}</h1>
        <p>${profile.address?.street || ''}<br>${profile.address?.city || ''} ${profile.address?.country || ''}</p>
        ${profile.tax_number ? `<p style="margin-top:4px;color:#666;">Tax No: ${profile.tax_number}</p>` : ''}
      </div>
      <div class="invoice-meta">
        <div class="invoice-number">INVOICE</div>
        <div style="color:#666;margin:4px 0;">#${invoice.invoice_number}</div>
        <div class="status-badge">${(invoice.status || 'draft').toUpperCase()}</div>
      </div>
    </div>

    <div class="parties">
      <div class="party">
        <h3>Bill To</h3>
        <p>
          <strong>${customer.name || 'Customer'}</strong><br>
          ${customer.email || ''}<br>
          ${customer.phone || ''}<br>
          ${[customer.address?.street, customer.address?.city, customer.address?.country].filter(Boolean).join(', ')}
        </p>
      </div>
    </div>

    <div class="dates">
      <div class="date-item"><label>Invoice Date</label><span>${invoice.issue_date || '—'}</span></div>
      <div class="date-item"><label>Due Date</label><span>${invoice.due_date || 'Upon receipt'}</span></div>
    </div>

    <table>
      <thead><tr><th>Description</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Unit Price</th><th style="text-align:right;">Tax</th><th style="text-align:right;">Amount</th></tr></thead>
      <tbody>${itemRows}</tbody>
    </table>

    <div style="display:flex;justify-content:flex-end;">
      <div class="totals">
        <div class="totals-row"><span>Subtotal</span><span>${formatCents(invoice.subtotal, currency)}</span></div>
        ${(invoice.tax_amount || 0) > 0 ? `<div class="totals-row"><span>Tax</span><span>${formatCents(invoice.tax_amount, currency)}</span></div>` : ''}
        ${(invoice.discount_amount || 0) > 0 ? `<div class="totals-row"><span>Discount</span><span>-${formatCents(invoice.discount_amount, currency)}</span></div>` : ''}
        <div class="totals-row total"><span>Total</span><span>${formatCents(invoice.total, currency)}</span></div>
      </div>
    </div>

    ${invoice.notes ? `
    <div class="notes">
      <h4>Notes</h4>
      <p>${invoice.notes}</p>
    </div>` : ''}

    ${invoice.payment_terms ? `<p style="margin-top:16px;font-size:13px;color:#666;">Payment Terms: ${invoice.payment_terms}</p>` : ''}

    <div class="footer">Generated by Klivora · Free invoicing for everyone · Klivora.app</div>
    </body></html>
  `;

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });

  await browser.close();
  return pdfBuffer;
};

const generatePayslipPdf = async (run, profile) => {
  if (!puppeteer) throw new Error('PDF generation is not available');

  const employee = run.employees || {};
  const color = profile?.primary_color || '#2D6BE4';

  const formatMoney = (cents) => `$${((cents || 0) / 100).toFixed(2)}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Inter, sans-serif; color: #1A1A2E; padding: 48px; }
      .header { background: ${color}; color: white; padding: 32px; border-radius: 12px; margin-bottom: 32px; }
      .header h1 { font-size: 20px; }
      .header p { opacity: 0.8; font-size: 14px; margin-top: 4px; }
      .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eef0f8; }
      .label { color: #666; }
      .value { font-weight: 600; }
      .total { font-size: 20px; color: ${color}; font-weight: 700; }
    </style>
    </head>
    <body>
    <div class="header">
      <h1>Payslip — ${employee.name || 'Employee'}</h1>
      <p>${profile?.business_name || ''} · ${run.period_start} to ${run.period_end}</p>
    </div>
    <div class="row"><span class="label">Employee</span><span class="value">${employee.name || '—'}</span></div>
    <div class="row"><span class="label">Email</span><span class="value">${employee.email || '—'}</span></div>
    <div class="row"><span class="label">Pay Period</span><span class="value">${run.period_start} → ${run.period_end}</span></div>
    <div class="row"><span class="label">Gross Pay</span><span class="value">${formatMoney(run.gross)}</span></div>
    <div class="row"><span class="label">Deductions</span><span class="value">${formatMoney(run.deductions)}</span></div>
    <div class="row"><span class="label total">Net Pay</span><span class="value total">${formatMoney(run.net)}</span></div>
    ${run.notes ? `<p style="margin-top:24px;color:#666;font-size:13px;">Notes: ${run.notes}</p>` : ''}
    <p style="margin-top:48px;text-align:center;color:#bbb;font-size:11px;">Generated by Klivora</p>
    </body></html>
  `;

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();
  return pdfBuffer;
};

module.exports = { generateInvoicePdf, generatePayslipPdf };
