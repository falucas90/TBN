import { createContext, useContext, useState } from 'react';
import { mockUsers } from '../data/mock-data';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const login = (email, password) => {
    const user = mockUsers.find(u => u.email === email && u.password === password);
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
