import React from 'react';

export default function Badge({ children, variant = 'info', className = '' }) {
  const styles = {
    info:    { bg: 'var(--info-bg)',    color: 'var(--info)'    },
    warn:    { bg: 'var(--warn-bg)',    color: 'var(--warn)'    },
    success: { bg: 'var(--success-bg)', color: 'var(--success)' },
    danger:  { bg: 'var(--danger-bg)', color: 'var(--danger)'  },
    primary: { bg: 'var(--accent-dim)', color: 'var(--accent)'  },
    outline: { bg: 'transparent',       color: 'var(--text-secondary)', border: '1px solid var(--border-default)' },
    muted:   { bg: 'var(--surface-3)',  color: 'var(--text-secondary)' },
  };

  const s = styles[variant] || styles.info;

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.15rem 0.55rem',
        borderRadius: 'var(--radius-pill)',
        fontSize: '0.6875rem',
        fontWeight: '600',
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
        background: s.bg,
        color: s.color,
        border: s.border || 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}
