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
  markAccountLegalAcceptanceCompleted: () => void;
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

  function persistSession(nextSession: Session | null) {
    if (nextSession) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }

    setSession(nextSession);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isReady: true,
      async login(payload) {
        const nextSession = await loginRequest(payload);
        persistSession(nextSession);
      },
      markAccountLegalAcceptanceCompleted() {
        if (!session) {
          return;
        }

        persistSession({
          ...session,
          legal: {
            accountAcceptanceRequired: false,
            missingDocumentTypes: [],
          },
        });
      },
      logout() {
        persistSession(null);
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
