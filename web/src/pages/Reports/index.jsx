import { useState, useEffect } from 'react';
import { getProfitLoss, getBalanceSheet, getTaxSummary } from '../../services/api.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { PageLoader } from '../../components/ui/EmptyState.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { Download, TrendingUp, TrendingDown, Scale } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import toast from 'react-hot-toast';

export default function Reports() {
  const { user } = useAuth();
  const currency = user?.profile?.currency || 'USD';
  const [tab, setTab] = useState('pl');
  const [loading, setLoading] = useState(true);
  const [pl, setPl] = useState(null);
  const [bs, setBs] = useState(null);
  const [tax, setTax] = useState(null);
  const [dateRange, setDateRange] = useState({ start: yearStart(), end: today() });
  const [taxYear, setTaxYear] = useState(String(new Date().getFullYear()));

  const load = async () => {
    setLoading(true);
    try {
      const [plRes, bsRes, taxRes] = await Promise.all([
        getProfitLoss({ start_date: dateRange.start, end_date: dateRange.end }),
        getBalanceSheet(),
        getTaxSummary({ year: taxYear }),
      ]);
      setPl(plRes.data);
      setBs(bsRes.data);
      setTax(taxRes.data);
    } catch { toast.error('Failed to load reports'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [dateRange, taxYear]);

  const exportCSV = (data, name) => {
    const rows = Object.entries(data).map(([k, v]) => `${k},${v}`);
    const csv = ['Key,Value', ...rows].join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `${name}.csv`;
    a.click();
  };

  if (loading) return <PageLoader />;

  const Section = ({ title, value, sub, color = 'var(--text)', icon: Icon }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', align:'center', gap: 10 }}>
        {Icon && <Icon size={18} color={color} />}
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{title}</div>
          {sub && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{sub}</div>}
        </div>
      </div>
      <div style={{ fontWeight: 800, fontSize: 18, color }}>{formatCurrency(value, currency)}</div>
    </div>
  );

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Financial insights for your business</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 28, borderBottom: '2px solid var(--border)' }}>
        {[{ id:'pl', label:'Profit & Loss' }, { id:'bs', label:'Balance Sheet' }, { id:'tax', label:'Tax Summary' }].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
            color: tab === t.id ? 'var(--primary)' : 'var(--text-2)',
            borderBottom: tab === t.id ? '2px solid var(--primary)' : '2px solid transparent',
            marginBottom: -2,
          }}>{t.label}</button>
        ))}
      </div>

      {/* P&L */}
      {tab === 'pl' && pl && (
        <div style={{ maxWidth: 700 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap' }}>
            <Input label="From" type="date" value={dateRange.start} onChange={(e) => setDateRange((d) => ({ ...d, start: e.target.value }))} />
            <Input label="To" type="date" value={dateRange.end} onChange={(e) => setDateRange((d) => ({ ...d, end: e.target.value }))} />
            <Button variant="secondary" size="sm" icon={Download} onClick={() => exportCSV(pl, 'profit-loss')}>Export CSV</Button>
          </div>
          <div className="card">
            <h3 style={{ fontWeight: 800, marginBottom: 8 }}>Profit & Loss Statement</h3>
            <p style={{ color: 'var(--text-3)', fontSize: 13, marginBottom: 24 }}>{formatDate(dateRange.start)} → {formatDate(dateRange.end)}</p>
            <Section title="Total Revenue" value={pl.total_revenue} icon={TrendingUp} color="var(--accent)" />
            <Section title="Total Expenses" value={-pl.total_expenses} icon={TrendingDown} color="var(--danger)" />
            {pl.expenses_by_category && Object.entries(pl.expenses_by_category).map(([cat, amt]) => (
              <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 8px 24px', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--text-2)' }}>
                <span>{cat}</span><span>-{formatCurrency(amt, currency)}</span>
              </div>
            ))}
            <Section title="Net Profit / Loss" value={pl.net_profit} color={pl.net_profit >= 0 ? 'var(--accent)' : 'var(--danger)'} icon={Scale} sub="Revenue - Expenses" />
          </div>
        </div>
      )}

      {/* Balance Sheet */}
      {tab === 'bs' && bs && (
        <div style={{ maxWidth: 700 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Button variant="secondary" size="sm" icon={Download} onClick={() => exportCSV(bs, 'balance-sheet')}>Export CSV</Button>
          </div>
          <div className="card">
            <h3 style={{ fontWeight: 800, marginBottom: 24 }}>Balance Sheet</h3>
            <Section title="Total Assets" value={bs.assets} icon={TrendingUp} color="var(--accent)" />
            <Section title="Total Liabilities" value={-bs.liabilities} icon={TrendingDown} color="var(--danger)" />
            <Section title="Net Worth (Equity)" value={bs.net_worth} color={bs.net_worth >= 0 ? 'var(--accent)' : 'var(--danger)'} icon={Scale} sub="Assets - Liabilities" />
          </div>
        </div>
      )}

      {/* Tax Summary */}
      {tab === 'tax' && tax && (
        <div style={{ maxWidth: 700 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 24 }}>
            <Input label="Tax Year" type="number" value={taxYear} onChange={(e) => setTaxYear(e.target.value)} style={{ width: 120 }} />
            <Button variant="secondary" size="sm" icon={Download} onClick={() => exportCSV(tax, 'tax-summary')}>Export CSV</Button>
          </div>
          <div className="card">
            <h3 style={{ fontWeight: 800, marginBottom: 4 }}>Tax Summary {tax.year}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24 }}>Estimated figures based on recorded data. Consult a tax professional.</p>
            <Section title="Gross Revenue" value={tax.total_revenue} icon={TrendingUp} color="var(--accent)" />
            <Section title="Total Expenses (Deductible)" value={-tax.total_expenses} icon={TrendingDown} color="var(--danger)" />
            <Section title="Net Taxable Income" value={tax.net_profit} color={tax.net_profit >= 0 ? 'var(--text)' : 'var(--danger)'} />
            <Section title="Tax Collected on Invoices" value={tax.tax_collected} color="var(--warning)" />
            <Section title="Estimated Tax Due (~25%)" value={tax.estimated_tax} color="var(--warning)" sub="Rough estimate only — consult your accountant" />
          </div>
        </div>
      )}
    </div>
  );
}

function today() { return new Date().toISOString().split('T')[0]; }
function yearStart() { return `${new Date().getFullYear()}-01-01`; }
