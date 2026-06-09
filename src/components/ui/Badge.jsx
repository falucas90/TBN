import React from 'react';

export default function Badge({ children, variant = 'default' }) {
  const tone =
    variant === 'success' ? 'pill--emerald' :
    variant === 'warn'    ? 'pill--amber'   :
    variant === 'primary' ? 'pill--emerald' :
    variant === 'danger'  ? 'pill--coral'   : '';
  return <span className={`pill ${tone}`}>{children}</span>;
}
