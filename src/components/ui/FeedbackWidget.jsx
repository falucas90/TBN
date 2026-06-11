import { useState, useEffect, useRef, useId } from 'react';
import { MessageSquare } from 'lucide-react';
import Button from './Button';
import { useToast } from '../../context/ToastContext';
import { submitFeedback } from '../../services/feedbackService';
import { useMediaQuery } from '../../lib/useMediaQuery';

const CATEGORIES = [
  { value: 'bug', label: 'Problema' },
  { value: 'sugestao', label: 'Sugestão' },
  { value: 'outro', label: 'Outro' },
];

export default function FeedbackWidget() {
  const { addToast } = useToast();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('bug');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const dialogRef = useRef(null);
  const titleId = useId();
  const categoryId = useId();
  const messageId = useId();

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.focus();
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const close = () => {
    setOpen(false);
  };

  const handleSubmit = async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      addToast('Escreva uma mensagem antes de enviar.', 'warn');
      return;
    }
    setSubmitting(true);
    try {
      await submitFeedback({ category, message: trimmed });
      addToast('Obrigado! Recebemos o seu feedback.', 'success');
      setOpen(false);
      setCategory('bug');
      setMessage('');
    } catch {
      addToast('Não foi possível enviar o feedback. Tente novamente.', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label="Enviar feedback"
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          right: '1.5rem',
          bottom: isMobile ? 'calc(72px + 1.5rem)' : '1.5rem',
          zIndex: 900,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          height: '44px',
          width: isMobile ? '44px' : undefined,
          justifyContent: isMobile ? 'center' : 'flex-start',
          padding: isMobile ? '0' : '0 1rem',
          borderRadius: 'var(--r-lg)',
          border: '1px solid var(--hairline)',
          background: 'var(--emerald)',
          color: 'var(--bone)',
          fontWeight: '600',
          fontSize: '13px',
          fontFamily: 'inherit',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
        }}
      >
        <MessageSquare size={16} strokeWidth={2} style={{ flexShrink: 0 }} />
        {!isMobile && <span>Enviar feedback</span>}
      </button>

      {open && (
        <div
          onClick={close}
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
            <h2 id={titleId} style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.25rem', color: 'var(--bone)' }}>
              Enviar feedback
            </h2>

            <div style={{ marginBottom: '1.25rem' }}>
              <label htmlFor={categoryId} style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--ash)', marginBottom: '6px' }}>
                Categoria
              </label>
              <select
                id={categoryId}
                className="select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: '100%' }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label htmlFor={messageId} style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--ash)', marginBottom: '6px' }}>
                A sua mensagem
              </label>
              <textarea
                id={messageId}
                className="textarea"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Descreva o problema ou a sua sugestão…"
                style={{ width: '100%', boxSizing: 'border-box' }}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <Button variant="ghost" onClick={close} disabled={submitting}>Cancelar</Button>
              <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'A enviar…' : 'Enviar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
