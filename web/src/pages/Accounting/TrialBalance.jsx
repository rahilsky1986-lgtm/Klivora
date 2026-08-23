import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTrialBalance } from '../../services/api.js';
import { formatCurrency } from '../../utils/formatters.js';
import { PageLoader } from '../../components/ui/EmptyState.jsx';
import { Download, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import toast from 'react-hot-toast';

export default function TrialBalance() {
  const { user } = useAuth();
  const currency = user?.profile?.currency || 'USD';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrialBalance().then((r) => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const exportCSV = () => {
    if (!data) return;
    const rows = [
      ['Account Code', 'Account Name', 'Type', 'Debit', 'Credit', 'Balance'],
      ...data.accounts.map((a) => [a.account_code, a.account_name, a.account_type, a.debit, a.credit, a.balance]),
      ['', '', 'TOTAL', data.total_debits, data.total_credits, data.total_debits - data.total_credits],
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'trial-balance.csv';
    a.click();
  };

  if (loading) return <PageLoader />;

  const balanced = data?.balanced ?? false;

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Trial Balance</h1>
          <p className="page-subtitle">Verify that debits equal credits</p>
        </div>
        <button className="btn btn-secondary" onClick={exportCSV}><Download size={16} /> Export CSV</button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: balanced ? 'var(--accent-bg)' : 'var(--danger-bg)', borderRadius: 8 }}>
          {balanced ? <CheckCircle size={20} color="var(--accent)" /> : <AlertTriangle size={20} color="var(--danger)" />}
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: balanced ? 'var(--accent)' : 'var(--danger)' }}>
              {balanced ? 'Trial Balance is Balanced' : 'Trial Balance is NOT Balanced'}
            </div>
            <div style={{ fontSize: 12, color: balanced ? 'var(--accent)' : 'var(--danger)' }}>
              Total Debits: {formatCurrency(data?.total_debits, currency)} | Total Credits: {formatCurrency(data?.total_credits, currency)}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Code</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Account Name</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Type</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Debit</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Credit</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {data?.accounts?.map((acc) => (
                <tr key={acc.account_id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px', fontSize: 13, color: 'var(--text-2)', fontFamily: 'monospace' }}>{acc.account_code || '—'}</td>
                  <td style={{ padding: '12px', fontWeight: 600 }}>{acc.account_name}</td>
                  <td style={{ padding: '12px', textTransform: 'capitalize', fontSize: 13, color: 'var(--text-2)' }}>{acc.account_type}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: acc.debit > 0 ? 'var(--primary)' : 'var(--text-2)' }}>{acc.debit > 0 ? formatCurrency(acc.debit, currency) : '—'}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: acc.credit > 0 ? 'var(--accent)' : 'var(--text-2)' }}>{acc.credit > 0 ? formatCurrency(acc.credit, currency) : '—'}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: acc.balance >= 0 ? 'var(--text)' : 'var(--danger)' }}>
                    {formatCurrency(Math.abs(acc.balance), currency)}
                    {acc.balance < 0 && ' (Cr)'}
                  </td>
                </tr>
              ))}
              <tr style={{ fontWeight: 800, background: 'var(--surface-2)', fontSize: 14 }}>
                <td style={{ padding: '12px' }} colSpan={3}>TOTALS</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>{formatCurrency(data?.total_debits, currency)}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>{formatCurrency(data?.total_credits, currency)}</td>
                <td style={{ padding: '12px', textAlign: 'right', color: balanced ? 'var(--accent)' : 'var(--danger)' }}>
                  {formatCurrency((data?.total_debits || 0) - (data?.total_credits || 0), currency)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}