import { useState, useEffect } from 'react';
import { getGeneralLedger, getAccounts } from '../../services/api.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { PageLoader } from '../../components/ui/EmptyState.jsx';
import { Download, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import toast from 'react-hot-toast';

export default function GeneralLedger() {
  const { user } = useAuth();
  const currency = user?.profile?.currency || 'USD';
  const [data, setData] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ account_id: '', start_date: '', end_date: '' });
  const [expanded, setExpanded] = useState({});

  const load = async () => {
    try {
      const [ledgerRes, accountsRes] = await Promise.all([
        getGeneralLedger(filter),
        getAccounts(),
      ]);
      setData(ledgerRes.data);
      setAccounts(accountsRes.data || []);
    } catch (e) {
      console.error('Failed to load general ledger', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const exportCSV = () => {
    if (!data) return;
    const rows = [
      ['Date', 'Account', 'Description', 'Reference', 'Type', 'Amount', 'Running Balance'],
      ...data.accounts.flatMap((acc) =>
        acc.entries.map((e) => [
          formatDate(e.date),
          acc.account_name,
          e.description || '',
          e.reference || '',
          e.type,
          formatCurrency(e.amount, currency),
          formatCurrency(e.running_balance, currency),
        ])
      ),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'general-ledger.csv';
    a.click();
  };

  const toggleExpand = (accountId) => {
    setExpanded((prev) => ({ ...prev, [accountId]: !prev[accountId] }));
  };

  if (loading) return <PageLoader />;

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">General Ledger</h1>
          <p className="page-subtitle">Detailed transaction history by account</p>
        </div>
        <button className="btn btn-secondary" onClick={exportCSV}><Download size={16} /> Export CSV</button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
          <label className="form-label">Account</label>
          <select className="form-input" value={filter.account_id} onChange={(e) => setFilter((f) => ({ ...f, account_id: e.target.value }))}>
            <option value="">All Accounts</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.code || '—'})</option>)}
          </select>
        </div>
        <div className="form-group" style={{ minWidth: 180 }}>
          <label className="form-label">From Date</label>
          <input className="form-input" type="date" value={filter.start_date} onChange={(e) => setFilter((f) => ({ ...f, start_date: e.target.value }))} />
        </div>
        <div className="form-group" style={{ minWidth: 180 }}>
          <label className="form-label">To Date</label>
          <input className="form-input" type="date" value={filter.end_date} onChange={(e) => setFilter((f) => ({ ...f, end_date: e.target.value }))} />
        </div>
      </div>

      {data?.accounts?.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-2)' }}>
          No transactions found for the selected filters.
        </div>
      ) : (
        data?.accounts?.map((acc) => {
          const isExpanded = expanded[acc.account_id];
          const totalDebits = acc.entries.filter((e) => e.type === 'debit').reduce((s, e) => s + e.amount, 0);
          const totalCredits = acc.entries.filter((e) => e.type === 'credit').reduce((s, e) => s + e.amount, 0);
          const finalBalance = acc.entries[acc.entries.length - 1]?.running_balance || 0;

          return (
            <div key={acc.account_id} className="card" style={{ marginBottom: 16 }}>
              <button
                className="w-full"
                onClick={() => toggleExpand(acc.account_id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: 0, background: 'none', border: 'none', cursor: 'pointer',
                  textAlign: 'left', width: '100%',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0' }}>
                  <span style={{ fontSize: 18 }}>📒</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{acc.account_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                      {acc.account_code && `Code: ${acc.account_code} • `}
                      Type: {acc.account_type} • Entries: {acc.entries.length}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 16px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--primary)' }}>Debits: {formatCurrency(totalDebits, currency)}</div>
                  <div style={{ fontWeight: 600, color: 'var(--accent)' }}>Credits: {formatCurrency(totalCredits, currency)}</div>
                  <div style={{ fontWeight: 700, color: finalBalance >= 0 ? 'var(--text)' : 'var(--danger)' }}>
                    Balance: {formatCurrency(Math.abs(finalBalance), currency)} {finalBalance < 0 && '(Cr)'}
                  </div>
                  {isExpanded ? <ChevronUp size={18} color="var(--text-2)" /> : <ChevronDown size={18} color="var(--text-2)" />}
                </div>
              </button>

              {isExpanded && (
                <div style={{ borderTop: '1px solid var(--border)', marginTop: -8, paddingTop: 16 }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: 'var(--surface-2)' }}>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Date</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Description</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Reference</th>
                          <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Type</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Amount</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Running Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {acc.entries.map((e) => (
                          <tr key={e.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '10px 12px', color: 'var(--text-2)' }}>{formatDate(e.date)}</td>
                            <td style={{ padding: '10px 12px' }}>{e.description || '—'}</td>
                            <td style={{ padding: '10px 12px', color: 'var(--text-3)', fontFamily: 'monospace' }}>{e.reference || '—'}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                              <span style={{
                                display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700,
                                background: e.type === 'debit' ? 'var(--primary-bg)' : 'var(--accent-bg)',
                                color: e.type === 'debit' ? 'var(--primary)' : 'var(--accent)',
                              }}>
                                {e.type.toUpperCase()}
                              </span>
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: e.type === 'debit' ? 'var(--primary)' : 'var(--accent)' }}>
                              {formatCurrency(e.amount, currency)}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: e.running_balance >= 0 ? 'var(--text)' : 'var(--danger)' }}>
                              {formatCurrency(Math.abs(e.running_balance), currency)}
                              {e.running_balance < 0 && ' (Cr)'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}