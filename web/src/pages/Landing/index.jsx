import { Link } from 'react-router-dom';
import { CheckCircle, FileText, Users, BarChart2, Briefcase, Shield, Zap, Globe } from 'lucide-react';

const FEATURES = [
  { icon: FileText, title: 'Professional Invoicing', desc: 'Create, send, and track invoices with automatic numbering, PDF export, and payment links.' },
  { icon: Users,    title: 'Customer Management',   desc: 'Organize all your customers, track outstanding balances, and view invoice history.' },
  { icon: BarChart2,title: 'Accounting & Reports',  desc: 'Chart of accounts, P&L, Balance Sheet, and tax summary — always up to date.' },
  { icon: Briefcase,title: 'Payroll',               desc: 'Manage employees, run payroll, calculate deductions, and generate payslips.' },
  { icon: Shield,   title: 'Expense Tracking',      desc: 'Log expenses by category, upload receipts with OCR extraction, and track billable items.' },
  { icon: Zap,      title: 'Stripe Payments',       desc: 'Accept card payments directly on your invoices. Get paid faster, automatically.' },
];

const WHY = [
  'Free forever — no hidden fees',
  'No credit card required',
  'Bank-level encryption with Supabase',
  'Works on web and mobile',
  'PDF invoices and payslips',
  'Offline mobile support',
];

export default function Landing() {
  return (
    <div style={{ fontFamily: 'var(--font)', color: 'var(--text)', background: 'var(--background)', minHeight: '100vh' }}>
      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: 64, background: 'white',
        borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #2D6BE4, #5A8EEA)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 800, fontSize: 18,
          }}>C</div>
          <span style={{ fontWeight: 800, fontSize: 20 }}>Klivora</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link to="/login" className="btn btn-ghost">Sign In</Link>
          <Link to="/register" className="btn btn-primary">Get Started Free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        padding: '96px 48px 80px', textAlign: 'center', maxWidth: 800, margin: '0 auto',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'var(--primary-bg)', color: 'var(--primary)',
          padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
          marginBottom: 24,
        }}>
          <Globe size={14} /> Free forever · No credit card required
        </div>
        <h1 style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.15, marginBottom: 20, letterSpacing: '-1px' }}>
          Invoicing, Accounting &<br />
          <span style={{ color: 'var(--primary)' }}>Payroll — All Free.</span>
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text-2)', maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.7 }}>
          Klivora is a professional invoicing and accounting platform for freelancers and small businesses. No pricing plans. No feature gates. Just powerful tools — free.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register" className="btn btn-primary btn-lg" style={{ fontSize: 16 }}>
            Create Free Account
          </Link>
          <Link to="/login" className="btn btn-outline btn-lg" style={{ fontSize: 16 }}>
            Sign In
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '48px 48px 80px', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 32, fontWeight: 800, marginBottom: 12 }}>
          Everything you need to run your business
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-2)', marginBottom: 48, fontSize: 16 }}>
          One platform. All the tools. Zero cost.
        </p>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 20,
        }}>
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card" style={{ display: 'flex', gap: 16 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={22} color="var(--primary)" />
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>
                <div style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.6 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Klivora */}
      <section style={{ background: 'var(--primary)', padding: '64px 48px', textAlign: 'center' }}>
        <h2 style={{ color: 'white', fontSize: 32, fontWeight: 800, marginBottom: 40 }}>
          Why thousands choose Klivora
        </h2>
        <div style={{
          display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16, maxWidth: 700, margin: '0 auto 48px',
        }}>
          {WHY.map((item) => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'white', fontSize: 14 }}>
              <CheckCircle size={18} color="#00C896" />
              {item}
            </div>
          ))}
        </div>
        <Link to="/register" className="btn btn-lg" style={{ background: 'white', color: 'var(--primary)', fontWeight: 700, fontSize: 15 }}>
          Start for Free — No Credit Card
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ padding: '32px 48px', borderTop: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
        © {new Date().getFullYear()} Klivora · Built with ❤️ for small businesses everywhere
      </footer>
    </div>
  );
}
