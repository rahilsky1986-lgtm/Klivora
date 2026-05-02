import { useState, useEffect, useRef } from 'react';
import { getExpenses, createExpense, updateExpense, deleteExpense, uploadReceipt } from '../../services/api.js';
import { formatCurrency, formatDate, EXPENSE_CATEGORIES, toCents, toDollars } from '../../utils/formatters.js';
import EmptyState, { PageLoader } from '../../components/ui/EmptyState.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Input, { Select, Textarea } from '../../components/ui/Input.jsx';
import { Plus, Search, Edit, Trash2, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';

const empty = () => ({ date: today(), amount: '', category: 'Other', description: '', vendor: '', billable: false });

export default function Expenses() {
  const { user } = useAuth();
  const currency = user?.profile?.currency || 'USD';
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('');
  const fileRef = useRef();

  const load = async () => {
    try {
      const res = await getExpenses({ limit: 50, category: filter || undefined });
      setExpenses(res.data.data || []);
    } catch { toast.error('Failed to load expenses'); }
    setLoading(false);
  };

  useEffect(() => { setLoading(true); load(); }, [filter]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.category) { toast.error('Amount and category are required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, amount: toCents(form.amount) };
      if (modal === 'create') { await createExpense(payload); toast.success('Expense added!'); }
      else { await updateExpense(modal.id, payload); toast.success('Expense updated'); }
      setModal(null);
      load();
    } catch (err) { toast.error(err?.error || 'Save failed'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return;
    try { await deleteExpense(id); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const handleReceiptUpload = async (expenseId, file) => {
    if (!file) return;
    try {
      await uploadReceipt(expenseId, file);
      toast.success('Receipt uploaded!');
      load();
    } catch { toast.error('Upload failed'); }
  };

  const openCreate = () => { setForm(empty()); setModal('create'); };
  const openEdit = (exp) => { setForm({ ...exp, amount: toDollars(exp.amount) }); setModal(exp); };

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  if (loading) return <PageLoader />;

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle">Total: {formatCurrency(totalExpenses, currency)}</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={openCreate}>Add Expense</Button>
      </div>

      {/* Category Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['', ...EXPENSE_CATEGORIES].map((cat) => (
          <button key={cat} onClick={() => setFilter(cat)}
            style={{ padding: '5px 14px', borderRadius: 20, border: '1.5px solid', fontSize: 13, cursor: 'pointer', transition: 'var(--transition)', fontWeight: 500,
              borderColor: filter === cat ? 'var(--primary)' : 'var(--border)',
              background: filter === cat ? 'var(--primary-bg)' : 'white',
              color: filter === cat ? 'var(--primary)' : 'var(--text-2)',
            }}>
            {cat || 'All'}
          </button>
        ))}
      </div>

      {expenses.length === 0 ? (
        <EmptyState icon="💸" title="No expenses yet" description="Track your business expenses to understand your spending." action={<Button variant="primary" icon={Plus} onClick={openCreate}>Add Expense</Button>} />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Date</th><th>Vendor</th><th>Category</th><th>Description</th><th>Amount</th><th>Receipt</th><th>Actions</th></tr></thead>
            <tbody>
              {expenses.map((exp) => (
                <tr key={exp.id}>
                  <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{formatDate(exp.date)}</td>
                  <td style={{ fontWeight: 600 }}>{exp.vendor || '—'}</td>
                  <td><span className="badge badge-neutral">{exp.category}</span></td>
                  <td style={{ color: 'var(--text-2)', fontSize: 13, maxWidth: 200 }}>{exp.description || '—'}</td>
                  <td style={{ fontWeight: 700, color: 'var(--danger)' }}>-{formatCurrency(exp.amount, currency)}</td>
                  <td>
                    {exp.receipt_url
                      ? <a href={exp.receipt_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontSize: 13 }}>View</a>
                      : <button className="btn btn-ghost btn-sm" style={{ fontSize: 12 }} onClick={() => { fileRef.current._expId = exp.id; fileRef.current.click(); }}>
                          <Camera size={13} /> Upload
                        </button>
                    }
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(exp)}><Edit size={14} /></button>
                      <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(exp.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Hidden file input for receipt upload */}
      <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }}
        onChange={(e) => { if (e.target.files[0]) handleReceiptUpload(e.target._expId, e.target.files[0]); e.target.value = ''; }} />

      {/* Modal */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Add Expense' : 'Edit Expense'}
        footer={<><Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button><Button variant="primary" loading={saving} onClick={handleSave}>Save</Button></>}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Date *" type="date" value={form.date} onChange={set('date')} />
            <Input label="Amount *" type="number" step="0.01" min="0" value={form.amount} onChange={set('amount')} placeholder="0.00" />
          </div>
          <Select label="Category *" value={form.category} onChange={set('category')}>
            {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Input label="Vendor" value={form.vendor} onChange={set('vendor')} placeholder="e.g. Amazon, Uber" />
          <Textarea label="Description" value={form.description} onChange={set('description')} rows={2} placeholder="What was this expense for?" />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.billable} onChange={set('billable')} />
            Billable to a customer
          </label>
        </form>
      </Modal>
    </div>
  );
}

function today() { return new Date().toISOString().split('T')[0]; }
