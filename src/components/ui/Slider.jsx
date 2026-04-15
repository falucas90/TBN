import React from 'react';

export default function Slider({ value, min, max, onChange, label, unit = '' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
        {label && <span style={{ fontWeight: '500' }}>{label}</span>}
        <span style={{ color: 'var(--color-text-secondary)' }}>{value}{unit}</span>
      </div>
      <input 
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          cursor: 'pointer',
          accentColor: 'var(--color-primary-teal)',
          height: '6px',
          borderRadius: '3px',
          appearance: 'auto'
        }}
      />
    </div>
  );
}
