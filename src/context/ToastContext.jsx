import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        zIndex: 9999,
        pointerEvents: 'none'
      }}>
        {toasts.map(toast => {
          const bgColors = {
            info: 'var(--color-bg-card)',
            success: 'var(--color-success-bg)',
            warn: 'var(--color-warn-bg)',
            error: 'var(--color-danger-bg)'
          };
          const textColors = {
            info: 'var(--color-text-primary)',
            success: 'var(--color-success-text)',
            warn: 'var(--color-warn-text)',
            error: 'var(--color-danger-text)'
          };
          const borderProps = {
            info: '1px solid var(--color-border)',
            success: '1px solid var(--color-success-text)',
            warn: '1px solid var(--color-warn-text)',
            error: '1px solid var(--color-danger-text)'
          };
          
          return (
            <div key={toast.id} style={{
              backgroundColor: bgColors[toast.type] || bgColors.info,
              color: textColors[toast.type] || textColors.info,
              padding: '0.75rem 1.25rem',
              borderRadius: 'var(--radius-input)',
              boxShadow: 'var(--shadow-md)',
              border: borderProps[toast.type],
              fontWeight: '500',
              fontSize: '0.875rem',
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              animation: 'toast-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }}>
              {toast.message}
            </div>
          );
        })}
      </div>
      <style>
        {`
          @keyframes toast-slide-up {
            0% { opacity: 0; transform: translateY(20px) scale(0.95); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}
      </style>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
