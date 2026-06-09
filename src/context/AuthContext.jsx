import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabase';
import { loginWithCredentials, loginWithGoogle, logoutUser, signupUser } from '../services/authService';

const AuthContext = createContext(null);

const MOCK_USER = { id: 'mock', email: 'dev@local', role: 'admin' };

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(supabaseConfigured ? null : MOCK_USER);
  const [isLoading, setIsLoading] = useState(supabaseConfigured);

  useEffect(() => {
    if (!supabaseConfigured) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setCurrentUser(
        user ? { ...user, role: user.app_metadata?.role || 'dealer' } : null
      );
      setIsLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    await loginWithCredentials(email, password);
  };

  const loginGoogle = async () => {
    await loginWithGoogle();
  };

  const signup = async (email, password, metadata) => {
    await signupUser(email, password, metadata);
  };

  const logout = async () => {
    await logoutUser();
    setCurrentUser(null);
  };

  const isAuthenticated = !!currentUser;

  return (
    <AuthContext.Provider value={{ isAuthenticated, currentUser, isLoading, login, loginGoogle, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
