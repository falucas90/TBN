import React from 'react';

export default function Button({
  children,
  variant = 'primary',
  className = '',
  style = {},
  fullWidth = false,
  size = 'md',
  ...props
}) {
  const sizes = {
    sm: { padding: '0.375rem 0.75rem', fontSize: '0.8125rem' },
    md: { padding: '0.5625rem 1rem',   fontSize: '0.875rem'  },
    lg: { padding: '0.75rem 1.375rem', fontSize: '0.9375rem' },
  };

  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    borderRadius: 'var(--radius-sm)',
    fontWeight: '500',
    cursor: 'pointer',
    border: 'none',
    transition: 'all var(--t-base) var(--ease)',
    letterSpacing: '-0.01em',
    whiteSpace: 'nowrap',
    width: fullWidth ? '100%' : 'auto',
    ...sizes[size],
    ...style,
  };

  const variants = {
    primary: {
      background: 'var(--accent)',
      color: '#0a1a0f',
      fontWeight: '600',
    },
    secondary: {
      background: 'var(--surface-3)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-default)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid transparent',
    },
    danger: {
      background: 'var(--danger-bg)',
      color: 'var(--danger)',
      border: '1px solid rgba(248,113,113,0.25)',
    },
  };

  return (
    <button
      className={className}
      style={{ ...base, ...variants[variant] }}
      onMouseEnter={e => {
        if (variant === 'primary') e.currentTarget.style.background = 'var(--accent-hover)';
        else if (variant === 'secondary') e.currentTarget.style.background = 'var(--surface-3)';
        else if (variant === 'ghost') e.currentTarget.style.background = 'var(--surface-3)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = variants[variant].background;
      }}
      {...props}
    >
      {children}
    </button>
  );
}
