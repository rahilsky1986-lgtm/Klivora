import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getDashboardSummary } from '../../services/api.js';
import { formatCurrency, formatDate, getStatusLabel, getStatusBadgeClass } from '../../utils/formatters.js';
import { StatCard } from '../../components/ui/Card.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import { PageLoader } from '../../components/ui/EmptyState.jsx';
import Button from '../../components/ui/Button.jsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DollarSign, Clock, AlertCircle, TrendingDown, Plus, Receipt, Users } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardSummary().then((r) => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const profile = user?.profile;
  const businessName = profile?.business_name || 'your business';
  const currency = profile?.currency || 'USD';

  if (loading) return <PageLoader />;

  const summary = data || {};

  return (
    <div className="animate-fade">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Good {getGreeting()}, {businessName.split(' ')[0]}! 👋
          </h1>
          <p className="page-subtitle">Here's your financial overview</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/invoices/new" className="btn btn-primary">
            <Plus size={16} /> New Invoice
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard
          label="Total Revenue"
          value={formatCurrency(summary.total_revenue, currency)}
          icon={DollarSign}
          color="var(--accent)"
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(summary.outstanding, currency)}
          icon={Clock}
          color="var(--primary)"
        />
        <StatCard
          label="Overdue"
          value={formatCurrency(summary.overdue, currency)}
          icon={AlertCircle}
          color="var(--danger)"
        />
        <StatCard
          label="Total Expenses"
          value={formatCurrency(summary.total_expenses, currency)}
          icon={TrendingDown}
          color="var(--warning)"
        />
      </div>

      {/* Chart + Recent */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, marginBottom: 20 }}>
        {/* Revenue Chart */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Revenue vs Expenses</h3>
          {summary.monthly_chart?.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={summary.monthly_chart} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 100}`} />
                <Tooltip
                  formatter={(v, name) => [formatCurrency(v, currency), name === 'revenue' ? 'Revenue' : 'Expenses']}
                  contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', fontSize: 13 }}
                />
                <Legend wrapperStyle={{ fontSize: 13 }} />
                <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} name="revenue" />
                <Bar dataKey="expenses" fill="var(--warning)" radius={[4, 4, 0, 0]} name="expenses" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 32 }}>📊</span>
              <span style={{ fontSize: 14 }}>No data yet — create an invoice to get started</span>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { to: '/invoices/new', icon: '📄', label: 'New Invoice',      sub: 'Create and send an invoice' },
              { to: '/expenses',     icon: '💸', label: 'Add Expense',      sub: 'Log a business expense' },
              { to: '/customers',    icon: '👥', label: 'Add Customer',     sub: 'Add a new customer' },
              { to: '/payroll',      icon: '💼', label: 'Run Payroll',      sub: 'Process employee payments' },
              { to: '/reports',      icon: '📊', label: 'View Reports',     sub: 'P&L, Balance Sheet' },
            ].map(({ to, icon, label, sub }) => (
              <Link key={to} to={to} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                borderRadius: 10, border: '1px solid var(--border)', textDecoration: 'none',
                color: 'var(--text)', transition: 'var(--transition)',
                background: 'var(--surface)',
              }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <span style={{ fontSize: 20 }}>{icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{sub}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Invoices + Expenses */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent Invoices */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Recent Invoices</h3>
            <Link to="/invoices" style={{ fontSize: 13, color: 'var(--primary)' }}>View all →</Link>
          </div>
          {summary.recent_invoices?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {summary.recent_invoices.map((inv) => (
                <Link key={inv.id} to={`/invoices/${inv.id}`} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none', color: 'inherit',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{inv.invoice_number}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{inv.customers?.name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{formatCurrency(inv.total, inv.currency)}</div>
                    <StatusBadge status={inv.status} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-3)', fontSize: 14 }}>
              No invoices yet. <Link to="/invoices/new" style={{ color: 'var(--primary)' }}>Create one</Link>
            </div>
          )}
        </div>

        {/* Recent Expenses */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Recent Expenses</h3>
            <Link to="/expenses" style={{ fontSize: 13, color: 'var(--primary)' }}>View all →</Link>
          </div>
          {summary.recent_expenses?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {summary.recent_expenses.map((exp) => (
                <div key={exp.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 0', borderBottom: '1px solid var(--border)',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{exp.category}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{exp.vendor || formatDate(exp.date)}</div>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--danger)' }}>
                    -{formatCurrency(exp.amount, currency)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-3)', fontSize: 14 }}>
              No expenses yet. <Link to="/expenses" style={{ color: 'var(--primary)' }}>Add one</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
