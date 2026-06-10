import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const AlertsContext = createContext(null);

export function AlertsProvider({ children }) {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const [unreadCount, setUnreadCount] = useState(0);

  const userId = currentUser?.id;

  useEffect(() => {
    if (!supabaseConfigured || !userId) return;

    const channel = supabase
      .channel('alerts-feed')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'alerts',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setUnreadCount(count => count + 1);
        addToast(`Novo alerta: ${payload.new.car_title}`, 'info');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      setUnreadCount(0);
    };
  }, [userId, addToast]);

  const clearUnread = useCallback(() => setUnreadCount(0), []);

  return (
    <AlertsContext.Provider value={{ unreadCount, clearUnread }}>
      {children}
    </AlertsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAlerts = () => useContext(AlertsContext);
