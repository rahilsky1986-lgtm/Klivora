import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getInvoice, createInvoice, updateInvoice, getCustomers } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { toCents, toDollars, CURRENCIES, formatCurrency } from '../../utils/formatters.js';
import Input, { Select, Textarea } from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import { PageLoader } from '../../components/ui/EmptyState.jsx';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const emptyItem = () => ({ description: '', quantity: '1', unit_price: '', tax_rate: '0' });

export default function InvoiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = !!id;

  const [form, setForm] = useState({
    customer_id: '', issue_date: today(), due_date: '', currency: user?.profile?.currency || 'USD',
    notes: user?.profile?.invoice_notes || '', payment_terms: user?.profile?.payment_terms || 'Due within 30 days',
    discount_amount: '0',
  });
  const [items, setItems] = useState([emptyItem()]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEdit);

  useEffect(() => {
    getCustomers({ limit: 100 }).then((r) => setCustomers(r.data.data || []));
    if (isEdit) {
      getInvoice(id).then((r) => {
        const inv = r.data;
        setForm({
          customer_id: inv.customer_id || '',
          issue_date: inv.issue_date || today(),
          due_date: inv.due_date || '',
          currency: inv.currency || 'USD',
          notes: inv.notes || '',
          payment_terms: inv.payment_terms || '',
          discount_amount: toDollars(inv.discount_amount || 0),
        });
        setItems(inv.invoice_items?.map((i) => ({
          description: i.description,
          quantity: String(i.quantity),
          unit_price: toDollars(i.unit_price),
          tax_rate: String(i.tax_rate || 0),
        })) || [emptyItem()]);
        setPageLoading(false);
      });
    }
  }, [id]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setItem = (idx, k) => (e) => setItems((items) => items.map((item, i) => i === idx ? { ...item, [k]: e.target.value } : item));
  const addItem = () => setItems((i) => [...i, emptyItem()]);
  const removeItem = (idx) => setItems((i) => i.filter((_, j) => j !== idx));

  // Totals
  const calcTotals = () => {
    let subtotal = 0, taxAmt = 0;
    for (const item of items) {
      const qty = parseFloat(item.quantity) || 0;
      const price = toCents(item.unit_price || 0);
      const taxRate = parseFloat(item.tax_rate) || 0;
      const lineAmt = Math.round(qty * price);
      subtotal += lineAmt;
      taxAmt += Math.round(lineAmt * (taxRate / 100));
    }
    const discount = toCents(form.discount_amount || 0);
    return { subtotal, taxAmt, discount, total: Math.max(0, subtotal + taxAmt - discount) };
  };

  const { subtotal, taxAmt, discount, total } = calcTotals();
  const currency = form.currency || 'USD';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!items.some((i) => i.description && i.unit_price)) {
      toast.error('Add at least one line item');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        discount_amount: toCents(form.discount_amount || 0),
        items: items.map((i) => ({
          description: i.description,
          quantity: parseFloat(i.quantity) || 1,
          unit_price: toCents(i.unit_price || 0),
          tax_rate: parseFloat(i.tax_rate) || 0,
        })),
      };
      if (isEdit) {
        await updateInvoice(id, payload);
        toast.success('Invoice updated');
        navigate(`/invoices/${id}`);
      } else {
        const res = await createInvoice(payload);
        toast.success('Invoice created!');
        navigate(`/invoices/${res.data.id}`);
      }
    } catch (err) {
      toast.error(err?.error || 'Failed to save invoice');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return <PageLoader />;

  return (
    <div className="animate-fade" style={{ maxWidth: 860, margin: '0 auto' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
          <div>
            <h1 className="page-title">{isEdit ? 'Edit Invoice' : 'New Invoice'}</h1>
            <p className="page-subtitle">{isEdit ? 'Update invoice details' : 'Create a professional invoice'}</p>
          </div>
        </div>
        <Button type="submit" form="invoice-form" variant="primary" loading={loading}>
          {isEdit ? 'Save Changes' : 'Create Invoice'}
        </Button>
      </div>

      <form id="invoice-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Customer & Dates */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18 }}>Invoice Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Customer</label>
              <select className="form-input" value={form.customer_id} onChange={set('customer_id')}>
                <option value="">Select customer...</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <Input label="Issue Date" type="date" value={form.issue_date} onChange={set('issue_date')} />
            <Input label="Due Date" type="date" value={form.due_date} onChange={set('due_date')} />
            <Select label="Currency" value={form.currency} onChange={set('currency')}>
              {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
            </Select>
          </div>
        </div>

        {/* Line Items */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18 }}>Line Items</h3>
          <div style={{ marginBottom: 12, display: 'grid', gridTemplateColumns: '1fr 80px 120px 80px 48px', gap: 8, alignItems: 'center' }}>
            <span className="form-label">Description</span>
            <span className="form-label" style={{ textAlign:'center' }}>Qty</span>
            <span className="form-label" style={{ textAlign:'right' }}>Unit Price</span>
            <span className="form-label" style={{ textAlign:'right' }}>Tax %</span>
            <span/>
          </div>
          {items.map((item, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 80px 48px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <input className="form-input" placeholder="Description of service or product" value={item.description} onChange={setItem(idx, 'description')} />
              <input className="form-input" type="number" min="0" step="0.01" placeholder="1" value={item.quantity} onChange={setItem(idx, 'quantity')} style={{ textAlign: 'center' }} />
              <input className="form-input" type="number" min="0" step="0.01" placeholder="0.00" value={item.unit_price} onChange={setItem(idx, 'unit_price')} style={{ textAlign: 'right' }} />
              <input className="form-input" type="number" min="0" max="100" step="0.01" placeholder="0" value={item.tax_rate} onChange={setItem(idx, 'tax_rate')} style={{ textAlign: 'right' }} />
              <button type="button" className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--danger)' }} onClick={() => removeItem(idx)} disabled={items.length === 1}><Trash2 size={14} /></button>
            </div>
          ))}
          <button type="button" className="btn btn-secondary btn-sm" onClick={addItem} style={{ marginTop: 8 }}>
            <Plus size={14} /> Add Line Item
          </button>

          {/* Totals */}
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: 260, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-2)' }}>
                <span>Subtotal</span><span>{formatCurrency(subtotal, currency)}</span>
              </div>
              {taxAmt > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-2)' }}>
                  <span>Tax</span><span>{formatCurrency(taxAmt, currency)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, color: 'var(--text-2)' }}>
                <span>Discount</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>$</span>
                  <input className="form-input" type="number" min="0" step="0.01" value={form.discount_amount} onChange={set('discount_amount')} style={{ width: 80, textAlign: 'right', height: 32, padding: '0 8px', fontSize: 13 }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800, color: 'var(--primary)', borderTop: '2px solid var(--border)', paddingTop: 10, marginTop: 4 }}>
                <span>Total</span><span>{formatCurrency(total, currency)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18 }}>Notes & Terms</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Textarea label="Invoice Notes" value={form.notes} onChange={set('notes')} rows={3} placeholder="e.g. Thank you for your business!" />
            <Textarea label="Payment Terms" value={form.payment_terms} onChange={set('payment_terms')} rows={3} placeholder="e.g. Due within 30 days" />
          </div>
        </div>
      </form>
    </div>
  );
}

function today() {
  return new Date().toISOString().split('T')[0];
}
