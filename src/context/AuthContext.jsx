import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabase';
import { loginWithCredentials, loginWithGoogle, logoutUser, signupUser } from '../services/authService';

const AuthContext = createContext(null);

const MOCK_USER = { id: 'mock', email: 'dev@local', role: 'dealer' };
const MOCK_COMPANY_INFO = { companyId: 'mock-company', companyRole: 'owner' };
const MOCK_SESSION_KEY = 'crivo.mock.session';

function loadMockSession() {
  try {
    const raw = localStorage.getItem(MOCK_SESSION_KEY);
    return raw ? { ...MOCK_USER, ...JSON.parse(raw) } : MOCK_USER;
  } catch {
    return MOCK_USER;
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(supabaseConfigured ? null : loadMockSession());
  const [isLoading, setIsLoading] = useState(supabaseConfigured);
  const [companyInfo, setCompanyInfo] = useState(supabaseConfigured ? null : MOCK_COMPANY_INFO);

  // Company membership lives in profiles (single source of truth, never
  // stale like a JWT claim). Platform admins have no company.
  useEffect(() => {
    if (!supabaseConfigured) return;
    if (!currentUser?.id || currentUser.role === 'admin') {
      setCompanyInfo(null);
      return;
    }
    let cancelled = false;
    supabase
      .from('profiles')
      .select('company_id, company_role')
      .eq('id', currentUser.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setCompanyInfo(
          data?.company_id ? { companyId: data.company_id, companyRole: data.company_role } : null
        );
      });
    return () => { cancelled = true; };
  }, [currentUser?.id, currentUser?.role]);

  useEffect(() => {
    if (!supabaseConfigured) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      if (user && user.app_metadata?.status === 'inactive') {
        supabase.auth.signOut();
        setCurrentUser(null);
        setIsLoading(false);
        return;
      }
      setCurrentUser(
        user ? { ...user, role: user.app_metadata?.role || 'dealer' } : null
      );
      setIsLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Resolves with the logged-in user (including role) so callers can route
  // admins to the admin view immediately, before onAuthStateChange fires.
  const login = async (email, password) => {
    if (!supabaseConfigured) {
      const role = email.toLowerCase().includes('admin') ? 'admin' : 'dealer';
      const mock = { ...MOCK_USER, email, role, user_metadata: { full_name: email.split('@')[0] } };
      localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify({ email, role, user_metadata: mock.user_metadata }));
      setCurrentUser(mock);
      return mock;
    }
    const user = await loginWithCredentials(email, password);
    return user ? { ...user, role: user.app_metadata?.role || 'dealer' } : null;
  };

  const loginGoogle = async () => {
    await loginWithGoogle();
  };

  const signup = async (email, password, metadata) => {
    await signupUser(email, password, metadata);
  };

  const logout = async () => {
    await logoutUser();
    localStorage.removeItem(MOCK_SESSION_KEY);
    setCurrentUser(null);
  };

  const isAuthenticated = !!currentUser;
  const companyId = companyInfo?.companyId ?? null;
  const companyRole = companyInfo?.companyRole ?? null;

  return (
    <AuthContext.Provider value={{ isAuthenticated, currentUser, isLoading, companyId, companyRole, login, loginGoogle, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
