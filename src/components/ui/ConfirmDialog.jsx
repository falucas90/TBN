import { useState, useEffect, useRef, useId } from 'react';
import Button from './Button';

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  confirmText,
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const [typed, setTyped] = useState('');
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    setTyped('');
    dialogRef.current?.focus();
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  const confirmDisabled = Boolean(confirmText) && typed !== confirmText;

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '1rem',
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--graphite)', border: '1px solid var(--hairline)',
          borderRadius: 'var(--r-lg)', padding: '1.5rem', width: '100%',
          maxWidth: '420px', outline: 'none',
        }}
      >
        <h2 id={titleId} style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem', color: danger ? 'var(--coral)' : 'var(--bone)' }}>
          {title}
        </h2>
        {description && (
          <p style={{ color: 'var(--ash)', fontSize: '13px', lineHeight: 1.5, marginBottom: '1.25rem' }}>
            {description}
          </p>
        )}
        {confirmText && (
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--ash)', marginBottom: '6px' }}>
              Escreva <strong style={{ color: 'var(--bone)' }}>{confirmText}</strong> para confirmar
            </label>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              style={{
                height: '36px', padding: '0 12px', borderRadius: 'var(--r-md)',
                border: '1px solid var(--hairline)', fontSize: '13px', fontFamily: 'inherit',
                outline: 'none', width: '100%', boxSizing: 'border-box',
                background: 'var(--obsidian)', color: 'var(--bone)',
              }}
            />
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="ghost" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={confirmDisabled}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
