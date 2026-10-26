import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthSession, LoginRequest, Permission, RegisterRequest, User } from '@/types';
import { ROLE_PERMISSIONS } from '@/constants/permissions';
import { DEMO_CREDENTIALS } from '@/constants/config';
import { authRepository, onUnauthorized } from '@/services';
import { readStoredSession, writeStoredSession } from '@/services/api/apiClient';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  /** True until the stored session has been checked on first paint. */
  initialising: boolean;
  login: (payload: LoginRequest) => Promise<User>;
  loginAsDemo: () => Promise<User>;
  register: (payload: RegisterRequest) => Promise<User>;
  logout: () => Promise<void>;
  can: (permission: Permission) => boolean;
  canAny: (permissions: Permission[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function isLive(session: AuthSession | null): session is AuthSession {
  return Boolean(session && session.expiresAt > Date.now());
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initialising, setInitialising] = useState(true);

  // Restore a previous session on boot.
  useEffect(() => {
    const session = readStoredSession();
    if (isLive(session)) {
      setUser(session.user);
    } else if (session) {
      writeStoredSession(null);
    }
    setInitialising(false);
  }, []);

  // The Axios interceptor calls this once a 401 survives the refresh attempt.
  useEffect(() => {
    onUnauthorized(() => {
      setUser(null);
      writeStoredSession(null);
    });
  }, []);

  const login = useCallback(async (payload: LoginRequest) => {
    const session = await authRepository.login(payload);
    setUser(session.user);
    return session.user;
  }, []);

  const loginAsDemo = useCallback(
    () => login({ email: DEMO_CREDENTIALS.email, password: DEMO_CREDENTIALS.password }),
    [login],
  );

  const register = useCallback(async (payload: RegisterRequest) => {
    const session = await authRepository.register(payload);
    setUser(session.user);
    return session.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authRepository.logout();
    } finally {
      setUser(null);
      writeStoredSession(null);
    }
  }, []);

  const can = useCallback(
    (permission: Permission) => (user ? ROLE_PERMISSIONS[user.role].includes(permission) : false),
    [user],
  );

  const canAny = useCallback(
    (permissions: Permission[]) => permissions.some((permission) => can(permission)),
    [can],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      initialising,
      login,
      loginAsDemo,
      register,
      logout,
      can,
      canAny,
    }),
    [user, initialising, login, loginAsDemo, register, logout, can, canAny],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>.');
  return context;
}
