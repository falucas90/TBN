import React from 'react';

export default function Card({ children, className = '', style = {}, noPadding = false, hover = false }) {
  const [isHovered, setIsHovered] = React.useState(false);
  return (
    <div
      className={className}
      onMouseEnter={() => hover && setIsHovered(true)}
      onMouseLeave={() => hover && setIsHovered(false)}
      style={{
        backgroundColor: 'var(--graphite)',
        borderRadius: 'var(--r-lg)',
        padding: noPadding ? '0' : '1.5rem',
        border: `1px solid ${isHovered ? 'var(--hairline-strong)' : 'var(--hairline)'}`,
        transition: 'border-color var(--t-fast) var(--ease)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
