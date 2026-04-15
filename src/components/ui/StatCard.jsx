import React from 'react';

export default function StatCard({ label, value, trend, trendLabel, icon: Icon }) {
  return (
    <div style={{
      backgroundColor: 'var(--color-bg-card)',
      borderRadius: 'var(--radius-card)',
      padding: '1.5rem',
      border: '1px solid var(--color-border)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: '500' }}>{label}</h3>
        {Icon && <Icon size={20} style={{ color: 'var(--color-text-secondary)' }} />}
      </div>
      <div style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
        {value}
      </div>
      {trend && (
        <div style={{ fontSize: '0.875rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{
            color: trend.startsWith('+') || trend.startsWith('↑') ? 'var(--color-success-text)' : 'var(--color-danger-text)',
            fontWeight: '600'
          }}>
            {trend}
          </span>
          <span style={{ color: 'var(--color-text-secondary)' }}>{trendLabel}</span>
        </div>
      )}
    </div>
  );
}
