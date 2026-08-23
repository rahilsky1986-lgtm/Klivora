import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getNotifications, markNotificationRead, markAllRead } from '../../services/api.js';
import { formatDate } from '../../utils/formatters.js';
import { Bell, Check, CheckCheck, X, ChevronDown, ChevronRight } from 'lucide-react';
import { Colors } from '../../constants/Colors';

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const load = async () => {
    try {
      const res = await getNotifications();
      const data = res.data || [];
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.read).length);
    } catch (e) {
      console.error('Failed to load notifications', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Close dropdown when clicking outside
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const notificationIcon = (
    <div className="relative" ref={dropdownRef}>
      <button
        className="btn btn-ghost btn-icon relative"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        aria-label="Notifications"
      >
        <Bell size={20} color={unreadCount > 0 ? Colors.danger : Colors.text2} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {dropdownOpen && (
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
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
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
  );

  return { notificationIcon, unreadCount, load };
}

export function useNotifications() {
  return Notifications();
}