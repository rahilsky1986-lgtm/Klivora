import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getInvoice, sendInvoice, updateInvoiceStatus, downloadInvoicePdf, duplicateInvoice, createPaymentLink } from '../../services/api.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { PageLoader } from '../../components/ui/EmptyState.jsx';
import { ArrowLeft, Send, Download, Copy, CreditCard, Edit, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import toast from 'react-hot-toast';

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const load = () => getInvoice(id).then((r) => { setInvoice(r.data); setLoading(false); });
  useEffect(() => { load(); }, [id]);

  const act = (name, fn) => async () => {
    setActionLoading(name);
    try { await fn(); await load(); toast.success(`Done!`); }
    catch (e) { toast.error(e?.error || 'Action failed'); }
    setActionLoading(null);
  };

  if (loading) return <PageLoader />;
  if (!invoice) return <div>Invoice not found</div>;

  const currency = invoice.currency || 'USD';
  const profile = user?.profile;
  const color = profile?.primary_color || '#2D6BE4';

  return (
    <div className="animate-fade" style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
          <div>
            <h1 className="page-title">{invoice.invoice_number}</h1>
            <p className="page-subtitle">{invoice.customers?.name || 'No customer'}</p>
          </div>
          <StatusBadge status={invoice.status} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="ghost" size="sm" icon={Edit} onClick={() => navigate(`/invoices/${id}/edit`)}>Edit</Button>
          <Button variant="secondary" size="sm" icon={Download} loading={actionLoading === 'pdf'} onClick={act('pdf', () => downloadInvoicePdf(id, invoice.invoice_number))}>PDF</Button>
          <Button variant="secondary" size="sm" icon={Copy} loading={actionLoading === 'dup'} onClick={act('dup', () => duplicateInvoice(id))}>Duplicate</Button>
          {invoice.status === 'draft' && (
            <Button variant="primary" size="sm" icon={Send} loading={actionLoading === 'send'}
              onClick={act('send', () => sendInvoice(id))}>Send Invoice</Button>
          )}
          {invoice.status !== 'paid' && (
            <Button variant="success" size="sm" icon={CheckCircle} loading={actionLoading === 'paid'}
              onClick={act('paid', () => updateInvoiceStatus(id, 'paid'))}>Mark Paid</Button>
          )}
          {!invoice.stripe_payment_url && invoice.status !== 'paid' && (
            <Button variant="outline" size="sm" icon={CreditCard} loading={actionLoading === 'pay'}
              onClick={act('pay', async () => { const r = await createPaymentLink(id); window.open(r.data.payment_url, '_blank'); })}>
              Payment Link
            </Button>
          )}
        </div>
      </div>

      {/* Invoice Document */}
      <div className="card" style={{ padding: 48 }}>
        {/* Invoice Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 48 }}>
          <div>
            {profile?.logo_url && <img src={profile.logo_url} alt="Logo" style={{ height: 48, objectFit: 'contain', marginBottom: 12 }} />}
            <div style={{ fontWeight: 800, fontSize: 20, color: color }}>{profile?.business_name || 'Your Business'}</div>
            {profile?.address?.street && <div style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 4 }}>{profile.address.street}</div>}
            {(profile?.address?.city || profile?.address?.country) && (
              <div style={{ color: 'var(--text-2)', fontSize: 13 }}>{profile?.address?.city} {profile?.address?.country}</div>
            )}
            {profile?.tax_number && <div style={{ color: 'var(--text-3)', fontSize: 12, marginTop: 4 }}>Tax No: {profile.tax_number}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>INVOICE</div>
            <div style={{ color: 'var(--text-2)', marginTop: 4 }}>#{invoice.invoice_number}</div>
            <div style={{ marginTop: 8 }}><StatusBadge status={invoice.status} /></div>
          </div>
        </div>

        {/* Bill To + Dates */}
        <div style={{ display: 'flex', gap: 48, marginBottom: 40 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Bill To</div>
            <div style={{ fontWeight: 700 }}>{invoice.customers?.name || '—'}</div>
            {invoice.customers?.email && <div style={{ color: 'var(--text-2)', fontSize: 13 }}>{invoice.customers.email}</div>}
            {invoice.customers?.phone && <div style={{ color: 'var(--text-2)', fontSize: 13 }}>{invoice.customers.phone}</div>}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Details</div>
            <div style={{ fontSize: 13 }}><span style={{ color: 'var(--text-3)' }}>Issued: </span><strong>{formatDate(invoice.issue_date)}</strong></div>
            {invoice.due_date && <div style={{ fontSize: 13 }}><span style={{ color: 'var(--text-3)' }}>Due: </span><strong>{formatDate(invoice.due_date)}</strong></div>}
          </div>
        </div>

        {/* Line Items */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
          <thead>
            <tr style={{ background: color + '14' }}>
              {['Description', 'Qty', 'Unit Price', 'Tax', 'Amount'].map((h) => (
                <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Description' ? 'left' : 'right', fontSize: 12, fontWeight: 700, color: color }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoice.invoice_items?.map((item, idx) => (
              <tr key={item.id || idx} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 14px' }}>{item.description}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text-2)' }}>{item.quantity}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text-2)' }}>{formatCurrency(item.unit_price, currency)}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text-2)' }}>{item.tax_rate ? `${item.tax_rate}%` : '—'}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.amount, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: 280 }}>
            {[
              ['Subtotal', invoice.subtotal],
              invoice.tax_amount > 0 && ['Tax', invoice.tax_amount],
              invoice.discount_amount > 0 && ['Discount', -invoice.discount_amount],
            ].filter(Boolean).map(([label, amt]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 14, color: 'var(--text-2)' }}>
                <span>{label}</span><span>{formatCurrency(amt, currency)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontWeight: 800, fontSize: 18, color: color }}>
              <span>Total</span><span>{formatCurrency(invoice.total, currency)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div style={{ marginTop: 32, padding: 16, background: 'var(--surface-2)', borderRadius: 10, borderLeft: `3px solid ${color}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 6 }}>NOTES</div>
            <div style={{ color: 'var(--text-2)', fontSize: 14 }}>{invoice.notes}</div>
          </div>
        )}
        {invoice.payment_terms && (
          <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-3)' }}>Payment Terms: {invoice.payment_terms}</div>
        )}
        {invoice.stripe_payment_url && invoice.status !== 'paid' && (
          <a href={invoice.stripe_payment_url} target="_blank" rel="noopener noreferrer"
            className="btn btn-primary" style={{ marginTop: 24, display: 'inline-flex' }}>
            <CreditCard size={16} /> Pay Online
          </a>
        )}
      </div>
    </div>
  );
}
