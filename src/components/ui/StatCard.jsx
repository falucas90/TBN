import React from 'react';

export default function StatCard({ label, value, trend, trendLabel, icon: Icon }) {
  const isPositive = trend && (trend.startsWith('+') || trend.startsWith('↑'));
  const isNegative = trend && (trend.startsWith('-') || trend.startsWith('↓'));

  return (
    <div style={{
      background: 'var(--surface-1)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.25rem 1.5rem',
      border: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
          {label}
        </span>
        {Icon && (
          <div style={{
            width: '32px', height: '32px', borderRadius: 'var(--radius-sm)',
            background: 'var(--accent-dim)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={16} color="var(--accent)" />
          </div>
        )}
      </div>

      <div style={{ fontSize: '2rem', fontWeight: '700', lineHeight: 1, letterSpacing: '-0.03em' }}>
        {value}
      </div>

      {trend && (
        <div style={{ fontSize: '0.8125rem', display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
          <span style={{
            color: isPositive ? 'var(--success)' : isNegative ? 'var(--danger)' : 'var(--text-secondary)',
            fontWeight: '600',
          }}>
            {trend}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>{trendLabel}</span>
        </div>
      )}
    </div>
  );
}
