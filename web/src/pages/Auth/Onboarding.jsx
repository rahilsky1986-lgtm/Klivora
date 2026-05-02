import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { completeOnboarding } from '../../services/api.js';
import { CURRENCIES } from '../../utils/formatters.js';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Input.jsx';
import toast from 'react-hot-toast';

const STEPS = [
  { id: 1, title: 'Welcome to Klivora!', subtitle: 'Let\'s set up your business profile in 5 quick steps.' },
  { id: 2, title: 'Business Information',  subtitle: 'Tell us the basics about your business.' },
  { id: 3, title: 'Currency & Tax',        subtitle: 'Configure your default currency and tax number.' },
  { id: 4, title: 'Invoice Preferences',   subtitle: 'Customize how your invoices look and are numbered.' },
  { id: 5, title: 'You\'re all set!',      subtitle: 'Your Klivora account is ready to go.' },
];

export default function Onboarding() {
  const { updateProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    business_name: '', address: { street: '', city: '', country: '' },
    currency: 'USD', tax_number: '',
    invoice_prefix: 'INV', payment_terms: 'Due within 30 days', invoice_notes: '',
  });

  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));
  const setAddr = (k, v) => setData((d) => ({ ...d, address: { ...d.address, [k]: v } }));

  const handleFinish = async () => {
    setLoading(true);
    try {
      await completeOnboarding(data);
      await updateProfile({ ...data, onboarding_complete: true });
      toast.success('Welcome to Klivora! 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Setup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentStep = STEPS[step - 1];
  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 500 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 22, margin: '0 auto 16px' }}>C</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>Step {step} of {STEPS.length}</div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>{currentStep.title}</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14, marginTop: 6 }}>{currentStep.subtitle}</p>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginBottom: 28, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'var(--primary)', borderRadius: 2, transition: 'width 0.4s ease' }} />
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {step === 1 && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>👋</div>
              <p style={{ color: 'var(--text-2)', lineHeight: 1.7 }}>
                We'll walk you through setting up your account. This takes about <strong>2 minutes</strong> and you can always change everything later in Settings.
              </p>
            </div>
          )}
          {step === 2 && (
            <>
              <Input label="Business Name" value={data.business_name} onChange={(e) => set('business_name', e.target.value)} placeholder="Acme Corp" />
              <Input label="Street Address" value={data.address.street} onChange={(e) => setAddr('street', e.target.value)} placeholder="123 Main St" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Input label="City" value={data.address.city} onChange={(e) => setAddr('city', e.target.value)} placeholder="New York" />
                <Input label="Country" value={data.address.country} onChange={(e) => setAddr('country', e.target.value)} placeholder="USA" />
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <Select label="Default Currency" value={data.currency} onChange={(e) => set('currency', e.target.value)}>
                {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
              </Select>
              <Input label="Tax / VAT Number (optional)" value={data.tax_number} onChange={(e) => set('tax_number', e.target.value)} placeholder="e.g. US123456789" />
            </>
          )}
          {step === 4 && (
            <>
              <Input label="Invoice Prefix" value={data.invoice_prefix} onChange={(e) => set('invoice_prefix', e.target.value)} hint="Invoices will be numbered e.g. INV-0001" placeholder="INV" />
              <Input label="Default Payment Terms" value={data.payment_terms} onChange={(e) => set('payment_terms', e.target.value)} placeholder="Due within 30 days" />
              <div className="form-group">
                <label className="form-label">Default Invoice Notes (optional)</label>
                <textarea className="form-input" rows={3} value={data.invoice_notes} onChange={(e) => set('invoice_notes', e.target.value)} placeholder="Thank you for your business!" />
              </div>
            </>
          )}
          {step === 5 && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🚀</div>
              <p style={{ color: 'var(--text-2)', lineHeight: 1.7 }}>
                Your Klivora account is set up and ready. Head to your dashboard to create your first invoice!
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', marginTop: 8 }}>
            {step > 1 ? (
              <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>← Back</Button>
            ) : <div />}
            {step < STEPS.length ? (
              <Button variant="primary" onClick={() => setStep((s) => s + 1)}>Continue →</Button>
            ) : (
              <Button variant="primary" loading={loading} onClick={handleFinish}>Go to Dashboard →</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
