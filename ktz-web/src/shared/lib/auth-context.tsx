'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthSession, loadSession, clearSession } from './auth-store';

interface AuthContextValue {
  session: AuthSession | null;
  logout: () => void;
  refresh: (s: AuthSession) => void;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  logout: () => {},
  refresh: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    setSession(loadSession());
  }, []);

  const logout = () => {
    clearSession();
    setSession(null);
    window.location.href = '/login';
  };

  const refresh = (s: AuthSession) => {
    setSession(s);
  };

  return (
    <AuthContext.Provider value={{ session, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
