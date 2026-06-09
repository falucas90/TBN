import React from 'react';

export default function StatCard({ label, value, trend, trendLabel, icon: Icon }) {
  const isPositive = trend && (trend.startsWith('+') || trend.startsWith('↑'));
  const isNegative = trend && (trend.startsWith('-') || trend.startsWith('↓'));

  return (
    <div style={{
      background: 'var(--graphite)',
      borderRadius: 'var(--r-lg)',
      padding: '20px',
      border: '1px solid var(--hairline)',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: 'var(--dust)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {label}
        </span>
        {Icon && (
          <div style={{
            width: '32px', height: '32px', borderRadius: 'var(--r-sm)',
            background: 'var(--emerald-12)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={16} color="var(--emerald)" />
          </div>
        )}
      </div>

      <div style={{ fontSize: '34px', fontWeight: '500', lineHeight: 1.1, letterSpacing: '-0.03em', color: 'var(--bone)', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>

      {trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '12px', borderTop: '1px solid var(--hairline)', marginTop: '4px' }}>
          <span style={{
            fontSize: '12px',
            color: isPositive ? 'var(--emerald)' : isNegative ? 'var(--coral)' : 'var(--ash)',
            fontWeight: '600',
          }}>
            {trend}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--dust)' }}>{trendLabel}</span>
        </div>
      )}
    </div>
  );
}
