import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Mail, Lock, Building2, Eye, EyeOff } from 'lucide-react';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', business_name: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Email and password are required'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    setError('');
    try {
      await signUp(form.email, form.password, form.business_name);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Check your inbox!</h2>
          <p style={{ color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 24 }}>
            We sent a confirmation email to <strong>{form.email}</strong>. Click the link in the email to activate your account, then sign in.
          </p>
          <Link to="/login" className="btn btn-primary btn-lg">Go to Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 800, fontSize: 22, margin: '0 auto 16px',
          }}>C</div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Create your account</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14, marginTop: 6 }}>Free forever. No credit card needed.</p>
        </div>

        <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
              {error}
            </div>
          )}
          <Input
            label="Business name (optional)"
            type="text"
            name="business_name"
            placeholder="Your Business Name"
            value={form.business_name}
            onChange={set('business_name')}
            icon={Building2}
          />
          <Input
            label="Email address"
            type="email"
            name="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={set('email')}
            icon={Mail}
            required
          />
          <Input
            label="Password"
            type={showPw ? 'text' : 'password'}
            name="password"
            placeholder="At least 8 characters"
            value={form.password}
            onChange={set('password')}
            icon={Lock}
            hint="Minimum 8 characters"
            iconRight={
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            required
          />
          <Button type="submit" variant="primary" loading={loading} className="w-full btn-lg">
            Create Free Account
          </Button>
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
            By creating an account you agree to our Terms of Service.
          </p>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-2)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
