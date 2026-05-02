import { useState, useEffect } from 'react';
import { getAccounts, createAccount, deleteAccount, getTransactions, createTransaction } from '../../services/api.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import EmptyState, { PageLoader } from '../../components/ui/EmptyState.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Input, { Select, Textarea } from '../../components/ui/Input.jsx';
import { Plus, Trash2, BookOpen, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';

const ACCOUNT_TYPES = ['asset', 'liability', 'equity', 'income', 'expense'];

export default function Accounting() {
  const { user } = useAuth();
  const currency = user?.profile?.currency || 'USD';
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('accounts'); // 'accounts' | 'transactions'
  const [modal, setModal] = useState(null); // 'account' | 'transaction' | null
  const [accountForm, setAccountForm] = useState({ name: '', type: 'asset', code: '', description: '' });
  const [txnForm, setTxnForm] = useState({ account_id: '', date: today(), amount: '', type: 'debit', description: '', reference: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [acc, txn] = await Promise.all([getAccounts(), getTransactions({ limit: 50 })]);
      setAccounts(acc.data || []);
      setTransactions(txn.data.data || []);
    } catch { toast.error('Failed to load'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    if (!accountForm.name || !accountForm.type) { toast.error('Name and type required'); return; }
    setSaving(true);
    try { await createAccount(accountForm); toast.success('Account created'); setModal(null); load(); }
    catch (err) { toast.error(err?.error || 'Failed'); }
    setSaving(false);
  };

  const handleDeleteAccount = async (id) => {
    if (!confirm('Delete this account?')) return;
    try { await deleteAccount(id); toast.success('Account deleted'); load(); }
    catch { toast.error('Cannot delete — account has transactions'); }
  };

  const handleSaveTxn = async (e) => {
    e.preventDefault();
    if (!txnForm.amount) { toast.error('Amount required'); return; }
    setSaving(true);
    try {
      await createTransaction({ ...txnForm, amount: Math.round(parseFloat(txnForm.amount) * 100) });
      toast.success('Transaction recorded');
      setModal(null);
      load();
    } catch (err) { toast.error(err?.error || 'Failed'); }
    setSaving(false);
  };

  const grouped = ACCOUNT_TYPES.reduce((acc, t) => ({ ...acc, [t]: accounts.filter((a) => a.type === t) }), {});

  if (loading) return <PageLoader />;

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Accounting</h1>
          <p className="page-subtitle">Chart of accounts & transactions</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" icon={Plus} onClick={() => setModal('transaction')}>Add Transaction</Button>
          <Button variant="primary" icon={Plus} onClick={() => setModal('account')}>Add Account</Button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '2px solid var(--border)' }}>
        {['accounts', 'transactions'].map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: 14, color: tab === t ? 'var(--primary)' : 'var(--text-2)',
            borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent',
            marginBottom: -2, transition: 'var(--transition)',
          }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {tab === 'accounts' && (
        accounts.length === 0 ? (
          <EmptyState icon="📒" title="No accounts yet" description="Complete onboarding to seed default accounts, or add them manually." action={<Button variant="primary" icon={Plus} onClick={() => setModal('account')}>Add Account</Button>} />
        ) : (
          ACCOUNT_TYPES.map((type) => grouped[type]?.length > 0 && (
            <div key={type} style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
                {type.charAt(0).toUpperCase() + type.slice(1)}s
              </h3>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Code</th><th>Name</th><th>Type</th><th>Description</th><th></th></tr></thead>
                  <tbody>
                    {grouped[type].map((acc) => (
                      <tr key={acc.id}>
                        <td style={{ color: 'var(--text-3)', fontSize: 13 }}>{acc.code || '—'}</td>
                        <td style={{ fontWeight: 600 }}>{acc.name}</td>
                        <td><StatusBadge status={acc.type} /></td>
                        <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{acc.description || '—'}</td>
                        <td>{!acc.is_system && <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteAccount(acc.id)}><Trash2 size={14} /></button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )
      )}

      {tab === 'transactions' && (
        transactions.length === 0 ? (
          <EmptyState icon="💳" title="No transactions" description="Record journal entries and bank transactions here." action={<Button variant="primary" icon={Plus} onClick={() => setModal('transaction')}>Add Transaction</Button>} />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Date</th><th>Description</th><th>Account</th><th>Type</th><th>Amount</th></tr></thead>
              <tbody>
                {transactions.map((txn) => (
                  <tr key={txn.id}>
                    <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{formatDate(txn.date)}</td>
                    <td>{txn.description || '—'}</td>
                    <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{txn.accounts?.name || '—'}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: txn.type === 'debit' ? 'var(--primary)' : 'var(--accent)' }}>
                        {txn.type === 'debit' ? <ArrowDownCircle size={14} /> : <ArrowUpCircle size={14} />}
                        {txn.type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{formatCurrency(txn.amount, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Account Modal */}
      <Modal open={modal === 'account'} onClose={() => setModal(null)} title="Add Account"
        footer={<><Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button><Button variant="primary" loading={saving} onClick={handleSaveAccount}>Create Account</Button></>}>
        <form onSubmit={handleSaveAccount} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Select label="Account Type *" value={accountForm.type} onChange={(e) => setAccountForm((f) => ({ ...f, type: e.target.value }))}>
            {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </Select>
          <Input label="Account Name *" value={accountForm.name} onChange={(e) => setAccountForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Checking Account" />
          <Input label="Account Code" value={accountForm.code} onChange={(e) => setAccountForm((f) => ({ ...f, code: e.target.value }))} placeholder="e.g. 1010" />
        </form>
      </Modal>

      {/* Transaction Modal */}
      <Modal open={modal === 'transaction'} onClose={() => setModal(null)} title="Add Transaction"
        footer={<><Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button><Button variant="primary" loading={saving} onClick={handleSaveTxn}>Save Transaction</Button></>}>
        <form onSubmit={handleSaveTxn} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Select label="Account" value={txnForm.account_id} onChange={(e) => setTxnForm((f) => ({ ...f, account_id: e.target.value }))}>
            <option value="">No specific account</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Date" type="date" value={txnForm.date} onChange={(e) => setTxnForm((f) => ({ ...f, date: e.target.value }))} />
            <Input label="Amount *" type="number" step="0.01" value={txnForm.amount} onChange={(e) => setTxnForm((f) => ({ ...f, amount: e.target.value }))} />
          </div>
          <Select label="Type" value={txnForm.type} onChange={(e) => setTxnForm((f) => ({ ...f, type: e.target.value }))}>
            <option value="debit">Debit</option>
            <option value="credit">Credit</option>
          </Select>
          <Input label="Description" value={txnForm.description} onChange={(e) => setTxnForm((f) => ({ ...f, description: e.target.value }))} />
          <Input label="Reference" value={txnForm.reference} onChange={(e) => setTxnForm((f) => ({ ...f, reference: e.target.value }))} />
        </form>
      </Modal>
    </div>
  );
}

function today() { return new Date().toISOString().split('T')[0]; }
