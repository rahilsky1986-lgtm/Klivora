import { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Klivora Modal Component
 */
export default function Modal({
  open, onClose, title, subtitle, children,
  size = 'md', footer,
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const widths = { sm: 400, md: 560, lg: 720, xl: 900 };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(26,26,46,0.4)', backdropFilter: 'blur(4px)',
      }} onClick={onClose} />

      {/* Modal */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: widths[size] || 560,
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        animation: 'fadeIn 0.2s ease',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
        }}>
          <div>
            {title && <h3 style={{ fontSize: 17, fontWeight: 700 }}>{title}</h3>}
            {subtitle && <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 3 }}>{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--surface-2)', border: 'none', borderRadius: 8,
              width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-2)', flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            padding: '16px 24px', borderTop: '1px solid var(--border)',
            display: 'flex', justifyContent: 'flex-end', gap: 10,
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
