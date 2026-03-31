import type { PropsWithChildren } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';
import { login as loginRequest, type Session } from './api';

type AuthContextValue = {
  session: Session | null;
  isReady: boolean;
  login: (payload: {
    email: string;
    password: string;
    organizationSlug?: string;
  }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = 'immo-ops-session';

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Session) : null;
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isReady: true,
      async login(payload) {
        const nextSession = await loginRequest(payload);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
        setSession(nextSession);
      },
      logout() {
        localStorage.removeItem(STORAGE_KEY);
        setSession(null);
      },
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
