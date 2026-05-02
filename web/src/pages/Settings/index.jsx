import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { updateProfile, uploadLogo } from '../../services/api.js';
import { CURRENCIES, getInitials } from '../../utils/formatters.js';
import Input, { Select, Textarea } from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import { Camera, Save, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'profile',  label: 'Business Profile' },
  { id: 'invoice',  label: 'Invoice Settings' },
  { id: 'account',  label: 'Account' },
];

export default function Settings() {
  const { user, updateProfile: ctxUpdate } = useAuth();
  const profile = user?.profile || {};
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({
    business_name: profile.business_name || '',
    currency: profile.currency || 'USD',
    tax_number: profile.tax_number || '',
    address: profile.address || { street: '', city: '', country: '' },
    invoice_prefix: profile.invoice_prefix || 'INV',
    invoice_notes: profile.invoice_notes || '',
    payment_terms: profile.payment_terms || 'Due within 30 days',
    primary_color: profile.primary_color || '#2D6BE4',
  });
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const fileRef = useRef();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setAddr = (k) => (e) => setForm((f) => ({ ...f, address: { ...f.address, [k]: e.target.value } }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(form);
      await ctxUpdate(form);
      toast.success('Settings saved!');
    } catch (err) { toast.error(err?.error || 'Failed to save'); }
    setSaving(false);
  };

  const handleLogoUpload = async (file) => {
    if (!file) return;
    setLogoUploading(true);
    try {
      await uploadLogo(file);
      toast.success('Logo updated!');
      window.location.reload();
    } catch { toast.error('Upload failed'); }
    setLogoUploading(false);
  };

  return (
    <div className="animate-fade" style={{ maxWidth: 720 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your business profile and preferences</p>
        </div>
        <Button variant="primary" icon={Save} loading={saving} onClick={handleSave}>Save Changes</Button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 28, borderBottom: '2px solid var(--border)' }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
            color: tab === t.id ? 'var(--primary)' : 'var(--text-2)',
            borderBottom: tab === t.id ? '2px solid var(--primary)' : '2px solid transparent',
            marginBottom: -2,
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Logo */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Business Logo</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{
                width: 80, height: 80, borderRadius: 16, background: 'var(--primary-bg)',
                color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 28, overflow: 'hidden', flexShrink: 0,
              }}>
                {profile.logo_url
                  ? <img src={profile.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : getInitials(form.business_name || 'My')
                }
              </div>
              <div>
                <Button variant="secondary" icon={Camera} loading={logoUploading} onClick={() => fileRef.current.click()}>
                  {logoUploading ? 'Uploading...' : 'Upload Logo'}
                </Button>
                <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>PNG or JPG, max 5MB</p>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleLogoUpload(e.target.files[0])} />
              </div>
            </div>
          </div>

          {/* Business Info */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontWeight: 700 }}>Business Information</h3>
            <Input label="Business Name" value={form.business_name} onChange={set('business_name')} placeholder="Acme Corp" />
            <Input label="Street Address" value={form.address?.street || ''} onChange={setAddr('street')} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="City" value={form.address?.city || ''} onChange={setAddr('city')} />
              <Input label="Country" value={form.address?.country || ''} onChange={setAddr('country')} />
            </div>
            <Input label="Tax / VAT Number" value={form.tax_number} onChange={set('tax_number')} placeholder="Optional" />
            <Select label="Default Currency" value={form.currency} onChange={set('currency')}>
              {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
            </Select>
          </div>
        </div>
      )}

      {tab === 'invoice' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontWeight: 700 }}>Invoice Customization</h3>
          <Input label="Invoice Prefix" value={form.invoice_prefix} onChange={set('invoice_prefix')} hint="e.g. INV-0001, BILL-0001" />
          <Input label="Default Payment Terms" value={form.payment_terms} onChange={set('payment_terms')} placeholder="Due within 30 days" />
          <Textarea label="Default Invoice Notes" value={form.invoice_notes} onChange={set('invoice_notes')} rows={3} placeholder="Thank you for your business!" />
          <div className="form-group">
            <label className="form-label">Brand Color</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input type="color" value={form.primary_color} onChange={set('primary_color')} style={{ width: 48, height: 42, border: '1.5px solid var(--border)', borderRadius: 8, cursor: 'pointer', padding: 4 }} />
              <span style={{ fontSize: 14, color: 'var(--text-2)' }}>Used on invoices and payslips</span>
            </div>
          </div>
        </div>
      )}

      {tab === 'account' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h3 style={{ fontWeight: 700 }}>Account</h3>
          <div style={{ padding: 16, background: 'var(--surface-2)', borderRadius: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Email</div>
            <div style={{ color: 'var(--text-2)', fontSize: 14, marginTop: 4 }}>{user?.email}</div>
          </div>
          <div>
            <h4 style={{ fontWeight: 700, color: 'var(--danger)', marginBottom: 8 }}>Danger Zone</h4>
            <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 12 }}>Deleting your account is irreversible. All your data will be permanently removed.</p>
            <Button variant="danger" icon={Trash2} onClick={() => { if (confirm('Are you absolutely sure? This cannot be undone.')) toast.error('Account deletion not available in demo'); }}>
              Delete Account
            </Button>
          </div>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <Button variant="primary" icon={Save} loading={saving} onClick={handleSave} className="btn-lg">Save All Changes</Button>
      </div>
    </div>
  );
}
