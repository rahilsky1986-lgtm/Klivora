import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, FileText, Users, Receipt, BookOpen,
  Briefcase, BarChart2, Settings, LogOut, Menu, X, ChevronRight,
  Bell,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getInitials } from '../../utils/formatters.js';
import toast from 'react-hot-toast';

const NAV = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/invoices',   icon: FileText,         label: 'Invoices' },
  { to: '/customers',  icon: Users,            label: 'Customers' },
  { to: '/expenses',   icon: Receipt,          label: 'Expenses' },
  { to: '/accounting', icon: BookOpen,         label: 'Accounting' },
  { to: '/payroll',    icon: Briefcase,        label: 'Payroll' },
  { to: '/reports',    icon: BarChart2,        label: 'Reports' },
  { to: '/settings',   icon: Settings,         label: 'Settings' },
];

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const profile = user?.profile;
  const businessName = profile?.business_name || 'My Business';

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out');
    navigate('/');
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 800, fontSize: 16,
          }}>C</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--text)' }}>Klivora</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Free Accounting</div>
          </div>
        </div>
      </div>

      {/* User */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'var(--primary-bg)', color: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 13, flexShrink: 0,
          }}>
            {profile?.logo_url
              ? <img src={profile.logo_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              : getInitials(businessName)
            }
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{businessName}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 12px', overflowY: 'auto' }}>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 10, marginBottom: 2,
              fontSize: 14, fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--primary)' : 'var(--text-2)',
              background: isActive ? 'var(--primary-bg)' : 'transparent',
              textDecoration: 'none', transition: 'var(--transition)',
            })}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Sign Out */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
        <button onClick={handleSignOut} className="btn btn-ghost w-full" style={{ justifyContent: 'flex-start', gap: 10 }}>
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="app-layout">
      {/* Desktop Sidebar */}
      <aside className="app-sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99 }}>
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }}
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="app-sidebar open" style={{ display: 'flex', flexDirection: 'column', position: 'absolute', left: 0, top: 0, height: '100%', zIndex: 100, boxShadow: 'var(--shadow-lg)' }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <main className="app-main">
        {/* Header */}
        <header className="app-header">
          <button
            className="btn btn-ghost btn-icon"
            style={{ display: 'none', marginRight: 8 }}
            id="mobile-menu-btn"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>

          <div style={{ flex: 1 }} />

          {/* Notifications (placeholder) */}
          <button className="btn btn-ghost btn-icon" title="Notifications">
            <Bell size={18} />
          </button>
        </header>

        {/* Page Content */}
        <div className="page-content">
          <Outlet />
        </div>
      </main>

      {/* Mobile menu button CSS override */}
      <style>{`
        @media (max-width: 768px) {
          #mobile-menu-btn { display: flex !important; }
          .app-sidebar:not(.open) { display: none !important; }
        }
      `}</style>
    </div>
  );
}
