import React from 'react';

export default function FormField({ label, error, required, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '0' }}>
      {label && (
        <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--ash)', display: 'flex', justifyContent: 'space-between' }}>
          <span>{label} {required && <span style={{ color: 'var(--coral)' }}>*</span>}</span>
          {error && <span style={{ color: 'var(--coral)' }}>{error}</span>}
        </label>
      )}
      {children}
    </div>
  );
}
