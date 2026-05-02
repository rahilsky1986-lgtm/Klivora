/**
 * Klivora Empty State Component
 */
export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="empty-state animate-fade">
      <div className="empty-state-icon">{icon || '📭'}</div>
      <h3>{title || 'Nothing here yet'}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

/**
 * Loading spinner
 */
export function LoadingSpinner({ size = 32, message }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, gap: 16 }}>
      <div style={{
        width: size, height: size,
        border: '3px solid var(--border)',
        borderTopColor: 'var(--primary)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      {message && <p style={{ color: 'var(--text-2)', fontSize: 14 }}>{message}</p>}
    </div>
  );
}

/**
 * Page Loading state
 */
export function PageLoader() {
  return <LoadingSpinner size={40} message="Loading..." />;
}
