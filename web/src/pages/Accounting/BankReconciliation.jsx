import { useState, useEffect } from 'react';
import { getAccounts, getBankReconciliation } from '../../services/api.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { PageLoader } from '../../components/ui/EmptyState.jsx';
import Button from '../../components/ui/Button.jsx';
import Input, { Select } from '../../components/ui/Input.jsx';
import { Download, CheckCircle, AlertTriangle, HelpCircle, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import toast from 'react-hot-toast';

export default function BankReconciliation() {
  const { user } = useAuth();
  const currency = user?.profile?.currency || 'USD';
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({
    account_id: '',
    statement_date: new Date().toISOString().split('T')[0],
    statement_ending_balance: '',
  });
  const [reconciling, setReconciling] = useState(false);

  const loadAccounts = async () => {
    try {
      const res = await getAccounts();
      setAccounts(res.data || []);
    } catch { toast.error('Failed to load accounts'); }
  };

  useEffect(() => { loadAccounts(); }, []);

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleReconcile = async (e) => {
    e.preventDefault();
    if (!form.account_id || !form.statement_date || !form.statement_ending_balance) {
      toast.error('All fields are required');
      return;
    }
    setReconciling(true);
    try {
      const res = await getBankReconciliation(form);
      setResult(res.data);
    } catch (err) {
      toast.error(err?.error || 'Reconciliation failed');
    }
    setReconciling(false);
  };

  const exportCSV = () => {
    if (!result) return;
    const rows = [
      ['Account', 'Statement Date', 'Statement Balance', 'Book Balance', 'Difference', 'Status'],
      [result.account.name, formatDate(result.statement_date), formatCurrency(result.statement_ending_balance, currency), formatCurrency(result.book_balance, currency), formatCurrency(Math.abs(result.difference), currency), result.reconciled ? 'Reconciled' : 'Out of Balance'],
      [],
      ['Date', 'Description', 'Reference', 'Type', 'Amount', 'Running Balance'],
      ...result.transactions.map((t) => [
        formatDate(t.date),
        t.description || '',
        t.reference || '',
        t.type,
        formatCurrency(t.amount, currency),
        formatCurrency(t.running_balance || 0, currency),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `reconciliation-${result.account.name}-${result.statement_date}.csv`;
    a.click();
  };

  return (
    <div className="animate-fade" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Bank Reconciliation</h1>
          <p className="page-subtitle">Match your bank statement to your books</p>
        </div>
      </div>

      {/* Form */}
      <div className="card" style={{ marginBottom: 24 }}>
        <form onSubmit={handleReconcile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <Select label="Account *" value={form.account_id} onChange={setField('account_id')}>
              <option value="">Select account...</option>
              {accounts
                .filter((a) => ['asset', 'liability'].includes(a.type)) // Only balance sheet accounts
                .map((a) => <option key={a.id} value={a.id}>{a.name} ({a.code || '—'}) - {a.type}</option>)}
            </Select>
            <Input label="Statement Date *" type="date" value={form.statement_date} onChange={setField('statement_date')} />
            <Input label="Statement Ending Balance *" type="number" step="0.01" value={form.statement_ending_balance} onChange={setField('statement_ending_balance')} placeholder="0.00" />
          </div>
          <Button variant="primary" loading={reconciling} type="submit" style={{ alignSelf: 'flex-start' }}>
            Reconcile
          </Button>
        </form>
      </div>

      {/* Result */}
      {result && (
        <>
          <div className="card" style={{ marginBottom: 24, background: result.reconciled ? 'var(--accent-bg)' : 'var(--danger-bg)', border: `1px solid ${result.reconciled ? 'var(--accent)' : 'var(--danger)'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16 }}>
              {result.reconciled ? <CheckCircle size={28} color="var(--accent)" /> : <AlertTriangle size={28} color="var(--danger)" />}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: result.reconciled ? 'var(--accent)' : 'var(--danger)' }}>
                  {result.reconciled ? 'Reconciled!' : 'Out of Balance'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>
                  Difference: <strong style={{ color: result.reconciled ? 'var(--accent)' : 'var(--danger)' }}>{formatCurrency(Math.abs(result.difference), currency)}</strong>
                  {result.difference > 0 && ' (Bank > Books)'}
                  {result.difference < 0 && ' (Books > Bank)'}
                </div>
              </div>
              <Button variant="secondary" icon={Download} onClick={exportCSV}>Export CSV</Button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 8 }}>Statement Balance</div>
              <div style={{ fontWeight: 800, fontSize: 24, color: 'var(--text)' }}>{formatCurrency(result.statement_ending_balance, currency)}</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 8 }}>Book Balance</div>
              <div style={{ fontWeight: 800, fontSize: 24, color: 'var(--text)' }}>{formatCurrency(result.book_balance, currency)}</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 8 }}>Difference</div>
              <div style={{ fontWeight: 800, fontSize: 24, color: result.difference === 0 ? 'var(--accent)' : 'var(--danger)' }}>
                {formatCurrency(Math.abs(result.difference), currency)}
              </div>
            </div>
          </div>

          {/* Cleared Transactions */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Cleared Transactions ({result.transactions?.length || 0})</h3>
              <HelpCircle size={16} color="var(--text-3)" title="Transactions up to statement date that match your books" />
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-2)' }}>
                    <th style={{ padding: '10px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Date</th>
                    <th style={{ padding: '10px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Description</th>
                    <th style={{ padding: '10px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Reference</th>
                    <th style={{ padding: '10px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Type</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Amount</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Running Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {result.transactions?.map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px', fontSize: 13, color: 'var(--text-2)' }}>{formatDate(t.date)}</td>
                      <td style={{ padding: '10px' }}>{t.description || '—'}</td>
                      <td style={{ padding: '10px', fontSize: 12, color: 'var(--text-3)', fontFamily: 'monospace' }}>{t.reference || '—'}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700,
                          background: t.type === 'debit' ? 'var(--primary-bg)' : 'var(--accent-bg)',
                          color: t.type === 'debit' ? 'var(--primary)' : 'var(--accent)',
                        }}>{t.type.toUpperCase()}</span>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600, color: t.type === 'debit' ? 'var(--primary)' : 'var(--accent)' }}>
                        {formatCurrency(t.amount, currency)}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600, color: (t.running_balance || 0) >= 0 ? 'var(--text)' : 'var(--danger)' }}>
                        {formatCurrency(Math.abs(t.running_balance || 0), currency)}
                        {(t.running_balance || 0) < 0 && ' (Cr)'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Uncleared Transactions */}
          {(result.uncleared_transactions?.length || 0) > 0 && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>Uncleared Transactions ({result.uncleared_transactions.length})</h3>
                <span style={{ fontSize: 12, color: 'var(--warning)' }}>After statement date</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-2)' }}>
                      <th style={{ padding: '10px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Date</th>
                      <th style={{ padding: '10px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Description</th>
                      <th style={{ padding: '10px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Type</th>
                      <th style={{ padding: '10px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.uncleared_transactions.map((t) => (
                      <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px', fontSize: 13, color: 'var(--text-2)' }}>{formatDate(t.date)}</td>
                        <td style={{ padding: '10px' }}>{t.description || '—'}</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700,
                            background: t.type === 'debit' ? 'var(--primary-bg)' : 'var(--accent-bg)',
                            color: t.type === 'debit' ? 'var(--primary)' : 'var(--accent)',
                          }}>{t.type.toUpperCase()}</span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600, color: t.type === 'debit' ? 'var(--primary)' : 'var(--accent)' }}>
                          {formatCurrency(t.amount, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!result.reconciled && result.difference !== 0 && (
            <div className="card" style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 16 }}>
                <AlertTriangle size={20} color="var(--warning)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--warning)' }}>Reconciliation Out of Balance</div>
                  <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4, lineHeight: 1.5 }}>
                    The difference of <strong>{formatCurrency(Math.abs(result.difference), currency)}</strong> needs investigation. Common causes:
                    <ul style={{ marginTop: 8, paddingLeft: 20, fontSize: 13, color: 'var(--text-2)' }}>
                      <li>Missing transactions in your books</li>
                      <li>Duplicate entries</li>
                      <li>Incorrect amounts</li>
                      <li>Timing differences (outstanding checks/deposits)</li>
                      <li>Bank fees or interest not recorded</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}