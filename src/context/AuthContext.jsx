import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { loginWithCredentials, loginWithGoogle, logoutUser, signupUser } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setCurrentUser(
        user ? { ...user, role: user.user_metadata?.role || 'dealer' } : null
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
  };

  const isAuthenticated = !!currentUser;

  return (
    <AuthContext.Provider value={{ isAuthenticated, currentUser, isLoading, login, loginGoogle, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
