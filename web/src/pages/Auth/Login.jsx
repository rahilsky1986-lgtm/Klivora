import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    setError('');
    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--background)', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 800, fontSize: 22, margin: '0 auto 16px',
          }}>C</div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Welcome back</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14, marginTop: 6 }}>Sign in to your Klivora account</p>
        </div>

        <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
              {error}
            </div>
          )}
          <Input
            label="Email address"
            type="email"
            name="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={Mail}
            autoComplete="email"
            required
          />
          <Input
            label="Password"
            type={showPw ? 'text' : 'password'}
            name="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={Lock}
            iconRight={
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            autoComplete="current-password"
            required
          />
          <div style={{ textAlign: 'right' }}>
            <Link to="/forgot-password" style={{ fontSize: 13, color: 'var(--primary)' }}>Forgot password?</Link>
          </div>
          <Button type="submit" variant="primary" loading={loading} className="w-full btn-lg">
            Sign In
          </Button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-2)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Create one free</Link>
        </p>
      </div>
    </div>
  );
}
