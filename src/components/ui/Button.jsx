import React from 'react';

export default function Button({ children, variant = 'default', size, fullWidth, className = '', ...props }) {
  const cls = [
    'btn',
    variant === 'primary' ? 'btn--primary' : '',
    variant === 'ghost' ? 'btn--ghost' : '',
    variant === 'danger' ? 'btn--danger' : '',
    size === 'sm' ? 'btn--sm' : '',
    size === 'lg' ? 'btn--lg' : '',
    className,
  ].filter(Boolean).join(' ');
  return (
    <button className={cls} style={fullWidth ? { width: '100%' } : undefined} {...props}>
      {children}
    </button>
  );
}
