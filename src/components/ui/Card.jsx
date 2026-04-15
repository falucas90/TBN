import React from 'react';

export default function Card({ children, className = '', style = {}, noPadding = false }) {
  return (
    <div
      className={className}
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-card)',
        padding: noPadding ? '0' : '1.5rem',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--color-border)',
        ...style
      }}
    >
      {children}
    </div>
  );
}
