import { Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function Callout({ children, variant = 'info', title }) {
  const styles = {
    info: { bg: 'var(--color-info-bg)', text: 'var(--color-info-text)', icon: Info },
    warn: { bg: 'var(--color-warn-bg)', text: 'var(--color-warn-text)', icon: AlertTriangle },
    success: { bg: 'var(--color-success-bg)', text: 'var(--color-success-text)', icon: CheckCircle },
    danger: { bg: 'var(--color-danger-bg)', text: 'var(--color-danger-text)', icon: XCircle },
  };

  const currentStyle = styles[variant] || styles.info;
  const Icon = currentStyle.icon;

  return (
    <div style={{
      backgroundColor: currentStyle.bg,
      color: currentStyle.text,
      padding: '1rem',
      borderRadius: 'var(--radius-input)',
      display: 'flex',
      gap: '0.75rem',
      alignItems: 'flex-start'
    }}>
      <Icon size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
      <div>
        {title && <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{title}</div>}
        <div style={{ fontSize: '0.875rem', lineHeight: '1.4' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
