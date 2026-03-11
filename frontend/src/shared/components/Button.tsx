import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  children,
  disabled,
  style,
  ...rest
}) => {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: '8px',
    fontFamily: 'inherit',
    fontWeight: 700,
    letterSpacing: '0.04em',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.5 : 1,
    transition: 'all 0.2s ease',
    border: 'none',
    outline: 'none',
    width: fullWidth ? '100%' : undefined,
  };

  const sizes: Record<ButtonSize, React.CSSProperties> = {
    sm: { padding: '7px 16px', fontSize: '12px' },
    md: { padding: '11px 24px', fontSize: '14px' },
    lg: { padding: '15px 32px', fontSize: '16px' },
  };

  const variants: Record<ButtonVariant, React.CSSProperties> = {
    primary:   { background: 'linear-gradient(135deg, #D4AF37, #B8962E)', color: '#0A0A0A' },
    secondary: { background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.4)' },
    ghost:     { background: 'transparent', color: '#a0a0a0', border: '1px solid rgba(255,255,255,0.12)' },
    danger:    { background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' },
  };

  return (
    <button
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <span style={{ fontSize: '14px' }}>⟳</span> : null}
      {children}
    </button>
  );
};