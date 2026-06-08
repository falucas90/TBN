import React from 'react';

export default function CurrencyInput({ value, onChange, ...props }) {
  const handleFocus = e => {
    e.target.parentElement.style.boxShadow = '0 0 0 3px var(--accent-dim)';
    e.target.parentElement.style.borderColor = 'var(--accent)';
  };
  const handleBlur = e => {
    e.target.parentElement.style.boxShadow = 'none';
    e.target.parentElement.style.borderColor = 'var(--border-default)';
  };

  return (
    <div style={{
      position: 'relative', display: 'flex', alignItems: 'center',
      background: 'var(--surface-2)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-sm)',
      transition: 'border-color var(--t-base), box-shadow var(--t-base)',
    }}>
      <span style={{
        position: 'absolute', left: '12px',
        color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '600',
        pointerEvents: 'none',
      }}>
        €
      </span>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={{
          width: '100%', background: 'transparent', border: 'none',
          color: 'var(--text-primary)',
          padding: '0.625rem 0.75rem 0.625rem 2rem',
          fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit',
        }}
        {...props}
      />
    </div>
  );
}
