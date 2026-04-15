import React from 'react';

export default function Button({ 
  children, 
  variant = 'primary', 
  className = '', 
  style = {},
  fullWidth = false,
  ...props 
}) {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.625rem 1rem',
    borderRadius: 'var(--radius-input)',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: 'none',
    width: fullWidth ? '100%' : 'auto',
    ...style
  };

  const variants = {
    primary: {
      backgroundColor: 'var(--color-primary-teal)',
      color: '#fff',
    },
    secondary: {
      backgroundColor: 'var(--color-bg-card)',
      color: 'var(--color-text-primary)',
      border: '1px solid var(--color-border)',
      boxShadow: 'var(--shadow-sm)'
    },
    danger: {
      backgroundColor: 'var(--color-bg-card)',
      color: 'var(--color-danger-text)',
      border: '1px solid var(--color-danger-text)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--color-text-secondary)',
    }
  };

  const combinedStyle = { ...baseStyle, ...variants[variant] };

  return (
    <button 
      className={className}
      style={combinedStyle} 
      {...props}
    >
      {children}
    </button>
  );
}
