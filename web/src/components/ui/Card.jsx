/**
 * Klivora Card Component
 */
export default function Card({ children, className = '', style = {}, ...props }) {
  return (
    <div className={`card ${className}`} style={style} {...props}>
      {children}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, change, changeLabel, color = 'var(--primary)', loading }) {
  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
            {label}
          </div>
          {loading ? (
            <div className="skeleton" style={{ height: 32, width: 120, borderRadius: 6 }} />
          ) : (
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
          )}
          {changeLabel && (
            <div style={{ fontSize: 12, color: change > 0 ? 'var(--accent)' : 'var(--danger)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 3 }}>
              {change > 0 ? '↑' : '↓'} {changeLabel}
            </div>
          )}
        </div>
        {Icon && (
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: `${color}18`, display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon size={22} color={color} />
          </div>
        )}
      </div>
      {/* bg gradient decoration */}
      <div style={{
        position: 'absolute', right: -20, bottom: -20,
        width: 80, height: 80, borderRadius: '50%',
        background: `${color}08`,
        pointerEvents: 'none',
      }} />
    </div>
  );
}
