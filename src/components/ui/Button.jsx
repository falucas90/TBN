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
    sm: { height: '28px', padding: '0 10px', fontSize: '12px', borderRadius: 'var(--r-sm)' },
    md: { height: '36px', padding: '0 14px', fontSize: '13px', borderRadius: 'var(--r-md)' },
    lg: { height: '44px', padding: '0 20px', fontSize: '15px', borderRadius: 'var(--r-md)' },
  };

  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: 'var(--font-display)',
    fontWeight: '500',
    cursor: 'pointer',
    border: '1px solid transparent',
    letterSpacing: '-0.005em',
    whiteSpace: 'nowrap',
    width: fullWidth ? '100%' : 'auto',
    transition: 'background var(--t-fast) var(--ease), border-color var(--t-fast) var(--ease)',
    ...sizes[size],
    ...style,
  };

  const variants = {
    primary: {
      background: 'var(--emerald)',
      color: '#FFFFFF',
      borderColor: 'var(--emerald)',
      fontWeight: '600',
    },
    secondary: {
      background: 'var(--slate)',
      color: 'var(--bone)',
      borderColor: 'var(--hairline)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--ash)',
      borderColor: 'transparent',
    },
    danger: {
      background: 'var(--graphite)',
      color: 'var(--coral)',
      borderColor: 'var(--hairline)',
    },
  };

  const hoverVariants = {
    primary: { background: '#0A7A5B', borderColor: '#0A7A5B' },
    secondary: { background: '#ECEAE2', borderColor: 'var(--hairline-strong)' },
    ghost: { background: 'var(--slate)', borderColor: 'var(--hairline)', color: 'var(--bone)' },
    danger: { background: 'var(--coral-12)', borderColor: 'rgba(201,75,75,0.3)' },
  };

  const v = variants[variant] || variants.secondary;
  const hv = hoverVariants[variant] || hoverVariants.secondary;

  return (
    <button
      className={className}
      style={{ ...base, ...v }}
      onMouseEnter={e => {
        Object.assign(e.currentTarget.style, hv);
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = v.background;
        e.currentTarget.style.borderColor = v.borderColor;
        e.currentTarget.style.color = v.color;
      }}
      {...props}
    >
      {children}
    </button>
  );
}
