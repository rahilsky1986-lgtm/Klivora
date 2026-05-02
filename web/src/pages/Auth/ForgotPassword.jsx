import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Mail } from 'lucide-react';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email'); return; }
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 22, margin: '0 auto 16px' }}>C</div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>{sent ? 'Email sent!' : 'Reset your password'}</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14, marginTop: 6 }}>
            {sent ? `Check ${email} for a password reset link.` : 'Enter your email and we\'ll send you a reset link.'}
          </p>
        </div>
        {!sent ? (
          <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>{error}</div>}
            <Input label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} icon={Mail} placeholder="you@example.com" required />
            <Button type="submit" variant="primary" loading={loading} className="w-full">Send Reset Link</Button>
          </form>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
            <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 24 }}>Didn't receive it? Check your spam folder or try again.</p>
            <Button variant="outline" onClick={() => setSent(false)}>Try again</Button>
          </div>
        )}
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14 }}>
          <Link to="/login" style={{ color: 'var(--primary)' }}>← Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}
