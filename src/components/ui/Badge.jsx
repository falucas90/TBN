import React from 'react';

export default function Badge({ children, variant = 'info', className = '' }) {
  const styles = {
    info:    { background: 'var(--slate-2)',    color: 'var(--ash)',    border: '1px solid var(--hairline)' },
    warn:    { background: 'var(--amber-12)',   color: 'var(--amber)',  border: '1px solid rgba(184,132,18,0.25)' },
    success: { background: 'var(--emerald-12)', color: 'var(--emerald)', border: '1px solid rgba(14,140,106,0.25)' },
    danger:  { background: 'var(--coral-12)',  color: 'var(--coral)',  border: '1px solid rgba(201,75,75,0.25)' },
    primary: { background: 'var(--emerald-12)', color: 'var(--emerald)', border: '1px solid rgba(14,140,106,0.25)' },
    outline: { background: 'transparent',       color: 'var(--ash)',    border: '1px solid var(--hairline)' },
    muted:   { background: 'var(--slate-2)',    color: 'var(--dust)',   border: '1px solid var(--hairline)' },
  };

  const s = styles[variant] || styles.info;

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: '22px',
        padding: '0 9px',
        borderRadius: 'var(--r-full)',
        fontSize: '11px',
        fontWeight: '500',
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
        background: s.background,
        color: s.color,
        border: s.border,
      }}
    >
      {children}
    </span>
  );
}
