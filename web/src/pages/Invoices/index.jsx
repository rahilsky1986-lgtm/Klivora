import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getInvoices, deleteInvoice, sendInvoice, updateInvoiceStatus } from '../../services/api.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import EmptyState, { PageLoader } from '../../components/ui/EmptyState.jsx';
import Button from '../../components/ui/Button.jsx';
import { Plus, Search, Send, Copy, Trash2, Download, Edit, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUSES = ['all', 'draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'];

export default function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);

  const load = async () => {
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search) params.search = search;
      const res = await getInvoices(params);
      setInvoices(res.data.data || []);
    } catch { toast.error('Failed to load invoices'); }
    setLoading(false);
  };

  useEffect(() => { setLoading(true); load(); }, [statusFilter, search]);

  const handleSend = async (inv) => {
    if (!inv.customers?.email) { toast.error('Customer has no email address'); return; }
    setActionLoading(inv.id + 'send');
    try {
      await sendInvoice(inv.id);
      toast.success('Invoice sent!');
      load();
    } catch (e) { toast.error(e?.error || 'Failed to send'); }
    setActionLoading(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this invoice?')) return;
    try {
      await deleteInvoice(id);
      toast.success('Invoice deleted');
      setInvoices((p) => p.filter((i) => i.id !== id));
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/invoices/new" className="btn btn-primary"><Plus size={16} /> New Invoice</Link>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Search by invoice number..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              style={{
                padding: '6px 14px', borderRadius: 20, border: '1.5px solid',
                borderColor: statusFilter === s ? 'var(--primary)' : 'var(--border)',
                background: statusFilter === s ? 'var(--primary-bg)' : 'white',
                color: statusFilter === s ? 'var(--primary)' : 'var(--text-2)',
                fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'var(--transition)',
              }}
            >{s.charAt(0).toUpperCase() + s.slice(1)}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      {invoices.length === 0 ? (
        <EmptyState
          icon="📄"
          title="No invoices yet"
          description="Create your first professional invoice and get paid faster."
          action={<Link to="/invoices/new" className="btn btn-primary"><Plus size={16} /> Create Invoice</Link>}
        />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead><tr>
              <th>Invoice</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Due</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr></thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td><Link to={`/invoices/${inv.id}`} style={{ fontWeight: 600, color: 'var(--primary)' }}>{inv.invoice_number}</Link></td>
                  <td style={{ color: 'var(--text-2)' }}>{inv.customers?.name || '—'}</td>
                  <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{formatDate(inv.issue_date)}</td>
                  <td style={{ color: inv.status === 'overdue' ? 'var(--danger)' : 'var(--text-2)', fontSize: 13 }}>{formatDate(inv.due_date) || '—'}</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(inv.total, inv.currency)}</td>
                  <td><StatusBadge status={inv.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-sm btn-icon" title="View" onClick={() => navigate(`/invoices/${inv.id}`)}><Eye size={14} /></button>
                      <button className="btn btn-ghost btn-sm btn-icon" title="Edit" onClick={() => navigate(`/invoices/${inv.id}/edit`)}><Edit size={14} /></button>
                      {inv.status === 'draft' && (
                        <button
                          className="btn btn-ghost btn-sm btn-icon"
                          title="Send"
                          onClick={() => handleSend(inv)}
                          disabled={actionLoading === inv.id + 'send'}
                        ><Send size={14} /></button>
                      )}
                      <button className="btn btn-ghost btn-sm btn-icon" title="Delete" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(inv.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
