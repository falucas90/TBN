import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

const icons = {
  info:    '💬',
  success: '✓',
  warn:    '⚠',
  error:   '✕',
};

const colors = {
  info:    { bg: 'var(--info-bg)',    border: 'rgba(96,165,250,0.2)',   text: 'var(--info)'    },
  success: { bg: 'var(--success-bg)', border: 'rgba(74,222,128,0.25)',  text: 'var(--success)' },
  warn:    { bg: 'var(--warn-bg)',    border: 'rgba(251,146,60,0.25)',  text: 'var(--warn)'    },
  error:   { bg: 'var(--danger-bg)', border: 'rgba(248,113,113,0.25)', text: 'var(--danger)'  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
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
          const c = colors[toast.type] || colors.info;
          return (
            <div key={toast.id} style={{
              background: 'var(--surface-2)',
              backdropFilter: 'blur(12px)',
              border: `1px solid ${c.border}`,
              borderLeft: `3px solid ${c.text}`,
              color: 'var(--text-primary)',
              padding: '0.75rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              fontWeight: '500', fontSize: '0.875rem',
              pointerEvents: 'auto',
              display: 'flex', alignItems: 'center', gap: '0.625rem',
              animation: 'toastIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards',
              minWidth: '240px', maxWidth: '380px',
            }}>
              <span style={{ color: c.text, fontSize: '0.9375rem', fontWeight: '700' }}>{icons[toast.type]}</span>
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
