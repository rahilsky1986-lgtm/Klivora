import { forwardRef } from 'react';

/**
 * Klivora Button Component
 * Variants: primary | secondary | success | danger | ghost | outline
 * Sizes: sm | (default) | lg | icon
 */
const Button = forwardRef(({
  variant = 'primary',
  size = '',
  loading = false,
  icon: Icon,
  iconRight,
  children,
  className = '',
  ...props
}, ref) => {
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : size === 'icon' ? 'btn-icon' : '';
  const variantClass = `btn-${variant}`;

  return (
    <button
      ref={ref}
      className={`btn ${variantClass} ${sizeClass} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span style={{
          width: 14, height: 14, border: '2px solid currentColor',
          borderTopColor: 'transparent', borderRadius: '50%',
          animation: 'spin 0.7s linear infinite', flexShrink: 0,
        }} />
      ) : Icon ? (
        <Icon size={size === 'sm' ? 14 : 16} />
      ) : null}
      {children}
      {iconRight && !loading && <iconRight.type size={16} />}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
