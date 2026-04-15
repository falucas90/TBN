import React from 'react';

export default function Badge({ children, variant = 'info', className = '' }) {
  const styles = {
    info: { bg: 'var(--color-info-bg)', text: 'var(--color-info-text)' },
    warn: { bg: 'var(--color-warn-bg)', text: 'var(--color-warn-text)' },
    success: { bg: 'var(--color-success-bg)', text: 'var(--color-success-text)' },
    danger: { bg: 'var(--color-danger-bg)', text: 'var(--color-danger-text)' },
    outline: { bg: 'transparent', text: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' },
    primary: { bg: 'var(--color-primary-teal)', text: '#ffffff' },
    white: { bg: '#ffffff', text: 'var(--color-text-primary)' }
  };

  const currentStyle = styles[variant] || styles.info;

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.125rem 0.625rem',
        borderRadius: 'var(--radius-badge)',
        fontSize: '0.75rem',
        fontWeight: '600',
        backgroundColor: currentStyle.bg,
        color: currentStyle.text,
        border: currentStyle.border || 'none',
        whiteSpace: 'nowrap'
      }}
    >
      {children}
    </span>
  );
}
