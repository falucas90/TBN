import React, { createContext, useContext, useState, useCallback } from 'react';
import { Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

const ToastContext = createContext(null);

const config = {
  info:    { Icon: Info,          color: 'var(--emerald)',  bg: 'var(--graphite)', border: 'rgba(14,140,106,0.2)' },
  success: { Icon: CheckCircle,   color: 'var(--emerald)',  bg: 'var(--graphite)', border: 'rgba(14,140,106,0.25)' },
  warn:    { Icon: AlertTriangle, color: 'var(--amber)',    bg: 'var(--graphite)', border: 'rgba(184,132,18,0.25)' },
  danger:  { Icon: XCircle,       color: 'var(--coral)',    bg: 'var(--graphite)', border: 'rgba(201,75,75,0.25)' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    // normalize legacy 'error' type
    const normalizedType = type === 'error' ? 'danger' : type;
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type: normalizedType }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}

      <div style={{
        position: 'fixed', bottom: '1.5rem', right: '1.5rem',
        display: 'flex', flexDirection: 'column', gap: '0.5rem',
        zIndex: 9999, pointerEvents: 'none',
      }}>
        {toasts.map(toast => {
          const c = config[toast.type] || config.info;
          return (
            <div key={toast.id} style={{
              background: c.bg,
              border: `1px solid ${c.border}`,
              borderLeft: `3px solid ${c.color}`,
              color: 'var(--bone)',
              padding: '0.75rem 1.25rem',
              borderRadius: 'var(--r-md)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              fontWeight: '500', fontSize: '13px',
              pointerEvents: 'auto',
              display: 'flex', alignItems: 'center', gap: '0.625rem',
              animation: 'toastIn 0.25s cubic-bezier(0.16,1,0.3,1) forwards',
              minWidth: '240px', maxWidth: '380px',
            }}>
              <c.Icon size={15} color={c.color} strokeWidth={2} style={{ flexShrink: 0 }} />
              {toast.message}
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(20px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0)   scale(1);    }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
