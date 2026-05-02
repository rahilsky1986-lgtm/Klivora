import { useState, useEffect } from 'react';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, getPayrollRuns, runPayroll, updatePayrollStatus, downloadPayslip } from '../../services/api.js';
import { formatCurrency, formatDate, toCents, toDollars } from '../../utils/formatters.js';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import EmptyState, { PageLoader } from '../../components/ui/EmptyState.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Input, { Select } from '../../components/ui/Input.jsx';
import { Plus, Trash2, Edit, Download, Play, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Payroll() {
  const { user } = useAuth();
  const currency = user?.profile?.currency || 'USD';
  const [employees, setEmployees] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('employees');
  const [empModal, setEmpModal] = useState(null);
  const [runModal, setRunModal] = useState(false);
  const [empForm, setEmpForm] = useState({ name: '', email: '', salary: '', frequency: 'monthly', tax_info: { tax_rate: '20' } });
  const [runForm, setRunForm] = useState({ employee_id: '', period_start: '', period_end: '', gross: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const load = async () => {
    try {
      const [emp, rns] = await Promise.all([getEmployees(), getPayrollRuns()]);
      setEmployees(emp.data || []);
      setRuns(rns.data || []);
    } catch { toast.error('Failed to load'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setE = (k) => (e) => setEmpForm((f) => ({ ...f, [k]: e.target.value }));
  const setR = (k) => (e) => setRunForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    if (!empForm.name || !empForm.salary) { toast.error('Name and salary required'); return; }
    setSaving(true);
    try {
      const payload = { ...empForm, salary: toCents(empForm.salary), tax_info: empForm.tax_info };
      if (empModal === 'create') { await createEmployee(payload); toast.success('Employee added!'); }
      else { await updateEmployee(empModal.id, payload); toast.success('Employee updated'); }
      setEmpModal(null);
      load();
    } catch (err) { toast.error(err?.error || 'Failed'); }
    setSaving(false);
  };

  const handleRunPayroll = async (e) => {
    e.preventDefault();
    if (!runForm.employee_id || !runForm.gross) { toast.error('Employee and gross pay required'); return; }
    setSaving(true);
    try {
      await runPayroll({ ...runForm, gross: toCents(runForm.gross) });
      toast.success('Payroll run created!');
      setRunModal(false);
      setTab('runs');
      load();
    } catch (err) { toast.error(err?.error || 'Failed'); }
    setSaving(false);
  };

  const handleMarkPaid = async (id, employee) => {
    setActionLoading(id);
    try { await updatePayrollStatus(id, 'paid'); toast.success('Marked as paid'); load(); }
    catch { toast.error('Failed'); }
    setActionLoading(null);
  };

  const handleDownloadPayslip = async (id, empName) => {
    try { await downloadPayslip(id, empName); }
    catch { toast.error('PDF generation failed — check backend'); }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payroll</h1>
          <p className="page-subtitle">{employees.length} employee{employees.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" icon={Play} onClick={() => setRunModal(true)}>Run Payroll</Button>
          <Button variant="primary" icon={Plus} onClick={() => { setEmpForm({ name:'',email:'',salary:'',frequency:'monthly',tax_info:{tax_rate:'20'} }); setEmpModal('create'); }}>Add Employee</Button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '2px solid var(--border)' }}>
        {['employees', 'runs'].map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: 14,
            color: tab === t ? 'var(--primary)' : 'var(--text-2)',
            borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent',
            marginBottom: -2,
          }}>{t === 'employees' ? 'Employees' : 'Payroll Runs'}</button>
        ))}
      </div>

      {tab === 'employees' && (
        employees.length === 0 ? (
          <EmptyState icon="👷" title="No employees" description="Add your first employee to start running payroll." action={<Button variant="primary" icon={Plus} onClick={() => setEmpModal('create')}>Add Employee</Button>} />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Salary</th><th>Frequency</th><th>Tax Rate</th><th>Actions</th></tr></thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id}>
                    <td style={{ fontWeight: 600 }}>{emp.name}</td>
                    <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{emp.email || '—'}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(emp.salary, currency)}</td>
                    <td><span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>{emp.frequency}</span></td>
                    <td>{emp.tax_info?.tax_rate || 0}%</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setEmpForm({ ...emp, salary: toDollars(emp.salary), tax_info: emp.tax_info || { tax_rate: '20' } }); setEmpModal(emp); }}><Edit size={14} /></button>
                        <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--danger)' }} onClick={async () => { if (confirm('Remove employee?')) { await deleteEmployee(emp.id); load(); } }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'runs' && (
        runs.length === 0 ? (
          <EmptyState icon="💼" title="No payroll runs" description="Run payroll to generate payslips for your employees." action={<Button variant="primary" icon={Play} onClick={() => setRunModal(true)}>Run Payroll</Button>} />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Employee</th><th>Period</th><th>Gross</th><th>Deductions</th><th>Net</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id}>
                    <td style={{ fontWeight: 600 }}>{run.employees?.name || '—'}</td>
                    <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{formatDate(run.period_start)} → {formatDate(run.period_end)}</td>
                    <td>{formatCurrency(run.gross, currency)}</td>
                    <td style={{ color: 'var(--danger)' }}>-{formatCurrency(run.deductions, currency)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{formatCurrency(run.net, currency)}</td>
                    <td><StatusBadge status={run.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-sm btn-icon" title="Download Payslip" onClick={() => handleDownloadPayslip(run.id, run.employees?.name)}><Download size={14} /></button>
                        {run.status !== 'paid' && (
                          <button className="btn btn-ghost btn-sm btn-icon" title="Mark Paid" style={{ color: 'var(--accent)' }} disabled={actionLoading === run.id} onClick={() => handleMarkPaid(run.id, run.employees)}><CheckCircle size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Employee Modal */}
      <Modal open={!!empModal} onClose={() => setEmpModal(null)} title={empModal === 'create' ? 'Add Employee' : 'Edit Employee'}
        footer={<><Button variant="ghost" onClick={() => setEmpModal(null)}>Cancel</Button><Button variant="primary" loading={saving} onClick={handleSaveEmployee}>Save</Button></>}>
        <form onSubmit={handleSaveEmployee} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Full Name *" value={empForm.name} onChange={setE('name')} placeholder="Jane Smith" />
          <Input label="Email" type="email" value={empForm.email} onChange={setE('email')} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Salary *" type="number" step="0.01" value={empForm.salary} onChange={setE('salary')} placeholder="0.00" />
            <Select label="Frequency" value={empForm.frequency} onChange={setE('frequency')}>
              {['weekly','biweekly','monthly','annually'].map((f) => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
            </Select>
          </div>
          <Input label="Tax Rate %" type="number" step="0.1" value={empForm.tax_info?.tax_rate || ''} onChange={(e) => setEmpForm((f) => ({ ...f, tax_info: { ...f.tax_info, tax_rate: e.target.value } }))} placeholder="20" />
          <Input label="Start Date" type="date" value={empForm.start_date || ''} onChange={setE('start_date')} />
        </form>
      </Modal>

      {/* Run Payroll Modal */}
      <Modal open={runModal} onClose={() => setRunModal(false)} title="Run Payroll"
        footer={<><Button variant="ghost" onClick={() => setRunModal(false)}>Cancel</Button><Button variant="primary" loading={saving} onClick={handleRunPayroll}>Create Payroll Run</Button></>}>
        <form onSubmit={handleRunPayroll} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Select label="Employee *" value={runForm.employee_id} onChange={setR('employee_id')}>
            <option value="">Select employee...</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name} — {formatCurrency(e.salary, currency)}</option>)}
          </Select>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Period Start *" type="date" value={runForm.period_start} onChange={setR('period_start')} />
            <Input label="Period End *" type="date" value={runForm.period_end} onChange={setR('period_end')} />
          </div>
          <Input label="Gross Pay *" type="number" step="0.01" value={runForm.gross} onChange={setR('gross')} placeholder="0.00" hint="Deductions will be calculated based on employee's tax rate" />
          <Input label="Notes" value={runForm.notes} onChange={setR('notes')} placeholder="Optional notes" />
        </form>
      </Modal>
    </div>
  );
}
