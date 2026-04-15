import React from 'react';

export default function FormField({ label, error, required, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
      {label && (
        <label style={{ fontSize: '0.875rem', fontWeight: '500', display: 'flex', justifyContent: 'space-between' }}>
          <span>{label} {required && <span style={{ color: 'var(--color-danger-text)' }}>*</span>}</span>
          {error && <span style={{ color: 'var(--color-danger-text)' }}>{error}</span>}
        </label>
      )}
      {children}
    </div>
  );
}
