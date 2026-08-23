import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard, FileText, Users, Receipt, BookOpen,
  Briefcase, BarChart2, Settings, LogOut, Menu, X, ChevronRight,
  Bell, Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getInitials } from '../../utils/formatters.js';
import { getNotifications, markNotificationRead, markAllRead } from '../../services/api.js';
import { formatDate } from '../../utils/formatters.js';
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
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const notifDropdownRef = useRef(null);

  const profile = user?.profile;
  const businessName = profile?.business_name || 'My Business';

  const loadNotifications = async () => {
    try {
      const res = await getNotifications();
      const data = res.data || [];
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.read).length);
    } catch (e) {
      console.error('Failed to load notifications', e);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.error('Failed to mark as read', e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error('Failed to mark all as read', e);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notifDropdownOpen]);

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

          {/* Notifications */}
          <div className="relative" ref={notifDropdownRef}>
            <button
              className="btn btn-ghost btn-icon relative"
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              aria-label="Notifications"
            >
              <Bell size={18} color={unreadCount > 0 ? '#FF4757' : 'var(--text-2)'} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden animate-fade">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-sm text-primary hover:underline">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No notifications</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50' : ''}`}
                        onClick={() => {
                          if (n.action_url) window.location.href = n.action_url;
                          if (!n.read) handleMarkRead(n.id);
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{n.title}</span>
                              {!n.read && <span className="w-2 h-2 bg-primary rounded-full" />}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{formatDate(n.created_at)}</p>
                          </div>
                          {!n.read && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id); }}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              aria-label="Mark as read"
                            >
                              <Check size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
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
