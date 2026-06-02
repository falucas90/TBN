import React from 'react';

export default function Card({ children, className = '', style = {}, noPadding = false, hover = false }) {
  const [isHovered, setIsHovered] = React.useState(false);
  return (
    <div
      className={className}
      onMouseEnter={() => hover && setIsHovered(true)}
      onMouseLeave={() => hover && setIsHovered(false)}
      style={{
        backgroundColor: isHovered ? 'var(--surface-2)' : 'var(--surface-1)',
        borderRadius: 'var(--radius-lg)',
        padding: noPadding ? '0' : '1.5rem',
        border: `1px solid ${isHovered ? 'var(--border-strong)' : 'var(--border-subtle)'}`,
        transition: 'background var(--t-base) var(--ease), border-color var(--t-base) var(--ease)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
