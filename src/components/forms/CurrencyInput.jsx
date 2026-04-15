import React from 'react';

export default function CurrencyInput({ value, onChange, ...props }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <span style={{
        position: 'absolute',
        left: '12px',
        color: 'var(--color-text-secondary)',
        fontSize: '0.875rem'
      }}>
        €
      </span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '0.625rem 0.625rem 0.625rem 28px',
          borderRadius: 'var(--radius-input)',
          border: '1px solid var(--color-border)',
          fontSize: '0.875rem',
          outline: 'none',
          transition: 'border-color 0.2s',
          fontFamily: 'inherit'
        }}
        {...props}
      />
    </div>
  );
}
