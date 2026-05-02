import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../../services/api.js';
import { formatCurrency, getInitials } from '../../utils/formatters.js';
import EmptyState, { PageLoader } from '../../components/ui/EmptyState.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Input, { Select } from '../../components/ui/Input.jsx';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import { CURRENCIES } from '../../utils/formatters.js';
import toast from 'react-hot-toast';

const empty = () => ({ name: '', email: '', phone: '', currency: 'USD', address: { street: '', city: '', country: '' }, notes: '' });

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'create' | customer obj
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await getCustomers({ search, limit: 50 });
      setCustomers(res.data.data || []);
    } catch { toast.error('Failed to load customers'); }
    setLoading(false);
  };

  useEffect(() => { setLoading(true); load(); }, [search]);

  const openCreate = () => { setForm(empty()); setModal('create'); };
  const openEdit = (c) => { setForm({ ...c, address: c.address || {} }); setModal(c); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name) { toast.error('Customer name is required'); return; }
    setSaving(true);
    try {
      if (modal === 'create') {
        await createCustomer(form);
        toast.success('Customer added!');
      } else {
        await updateCustomer(modal.id, form);
        toast.success('Customer updated');
      }
      setModal(null);
      load();
    } catch (err) { toast.error(err?.error || 'Save failed'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this customer? Their invoices will remain.')) return;
    try { await deleteCustomer(id); toast.success('Customer deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setAddr = (k) => (e) => setForm((f) => ({ ...f, address: { ...f.address, [k]: e.target.value } }));

  if (loading) return <PageLoader />;

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">{customers.length} customer{customers.length !== 1 ? 's' : ''}</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={openCreate}>Add Customer</Button>
      </div>

      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 360 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
        <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {customers.length === 0 ? (
        <EmptyState icon="👥" title="No customers yet" description="Add your first customer to start creating invoices." action={<Button variant="primary" icon={Plus} onClick={openCreate}>Add Customer</Button>} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {customers.map((c) => (
            <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', background: 'var(--primary-bg)',
                  color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 15, flexShrink: 0,
                }}>{getInitials(c.name)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                  <div style={{ color: 'var(--text-3)', fontSize: 12 }}>{c.email || 'No email'}</div>
                </div>
              </div>
              {c.phone && <div style={{ fontSize: 13, color: 'var(--text-2)' }}>📞 {c.phone}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <Button variant="secondary" size="sm" icon={Eye} onClick={() => navigate(`/customers/${c.id}`)}>View</Button>
                <Button variant="ghost" size="sm" icon={Edit} onClick={() => openEdit(c)}>Edit</Button>
                <Button variant="ghost" size="sm" icon={Trash2} style={{ color: 'var(--danger)', marginLeft: 'auto' }} onClick={() => handleDelete(c.id)} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'create' ? 'Add Customer' : 'Edit Customer'}
        footer={<>
          <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={handleSave}>Save Customer</Button>
        </>}
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Full Name *" value={form.name} onChange={set('name')} placeholder="John Smith" required />
          <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="john@example.com" />
          <Input label="Phone" value={form.phone} onChange={set('phone')} placeholder="+1 555 0100" />
          <Select label="Currency" value={form.currency || 'USD'} onChange={set('currency')}>
            {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
          </Select>
          <Input label="Street" value={form.address?.street || ''} onChange={setAddr('street')} placeholder="123 Main St" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Input label="City" value={form.address?.city || ''} onChange={setAddr('city')} />
            <Input label="Country" value={form.address?.country || ''} onChange={setAddr('country')} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
