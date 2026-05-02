import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCustomer, getCustomerInvoices, getCustomerBalance } from '../../services/api.js';
import { formatCurrency, formatDate, getInitials } from '../../utils/formatters.js';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { PageLoader } from '../../components/ui/EmptyState.jsx';
import { ArrowLeft, Plus } from 'lucide-react';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCustomer(id), getCustomerInvoices(id), getCustomerBalance(id)])
      .then(([c, inv, bal]) => {
        setCustomer(c.data);
        setInvoices(inv.data || []);
        setBalance(bal.data?.outstanding_balance || 0);
      }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageLoader />;
  if (!customer) return <div>Customer not found</div>;

  const currency = customer.currency || 'USD';

  return (
    <div className="animate-fade" style={{ maxWidth: 820, margin: '0 auto' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
          <div>
            <h1 className="page-title">{customer.name}</h1>
            <p className="page-subtitle">{customer.email}</p>
          </div>
        </div>
        <Link to="/invoices/new" className="btn btn-primary"><Plus size={16} /> New Invoice</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        {/* Profile */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-bg)',
              color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 24, margin: '0 auto 12px',
            }}>{getInitials(customer.name)}</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{customer.name}</div>
            {customer.email && <div style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 4 }}>{customer.email}</div>}
            {customer.phone && <div style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 4 }}>{customer.phone}</div>}
          </div>
          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Outstanding Balance</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: balance > 0 ? 'var(--danger)' : 'var(--accent)' }}>
              {formatCurrency(balance, currency)}
            </div>
          </div>
        </div>

        {/* Invoices */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Invoice History</h3>
          {invoices.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-3)', padding: 32 }}>No invoices for this customer</div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Invoice</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td><Link to={`/invoices/${inv.id}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>{inv.invoice_number}</Link></td>
                      <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{formatDate(inv.issue_date)}</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(inv.total, inv.currency)}</td>
                      <td><StatusBadge status={inv.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
