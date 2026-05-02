import { forwardRef } from 'react';

/**
 * Klivora Input Component
 */
const Input = forwardRef(({
  label,
  error,
  hint,
  icon: Icon,
  iconRight,
  className = '',
  containerStyle = {},
  ...props
}, ref) => {
  return (
    <div className="form-group" style={containerStyle}>
      {label && <label className="form-label" htmlFor={props.id || props.name}>{label}</label>}
      <div style={{ position: 'relative' }}>
        {Icon && (
          <div style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-3)', pointerEvents: 'none', display: 'flex',
          }}>
            <Icon size={16} />
          </div>
        )}
        <input
          ref={ref}
          className={`form-input ${error ? 'error' : ''} ${className}`}
          style={Icon ? { paddingLeft: 36 } : iconRight ? { paddingRight: 36 } : {}}
          id={props.id || props.name}
          {...props}
        />
        {iconRight && (
          <div style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-3)', display: 'flex',
          }}>
            {iconRight}
          </div>
        )}
      </div>
      {error && <span className="form-error">{error}</span>}
      {hint && !error && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{hint}</span>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;

/**
 * Textarea component
 */
export const Textarea = forwardRef(({ label, error, className = '', rows = 3, ...props }, ref) => (
  <div className="form-group">
    {label && <label className="form-label">{label}</label>}
    <textarea ref={ref} rows={rows} className={`form-input ${error ? 'error' : ''} ${className}`} {...props} />
    {error && <span className="form-error">{error}</span>}
  </div>
));
Textarea.displayName = 'Textarea';

/**
 * Select component
 */
export const Select = forwardRef(({ label, error, children, className = '', ...props }, ref) => (
  <div className="form-group">
    {label && <label className="form-label">{label}</label>}
    <select ref={ref} className={`form-input ${error ? 'error' : ''} ${className}`} {...props}>
      {children}
    </select>
    {error && <span className="form-error">{error}</span>}
  </div>
));
Select.displayName = 'Select';
