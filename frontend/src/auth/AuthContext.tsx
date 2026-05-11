import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { decodeJwt } from '@/shared/lib/jwt';
import type { AppUser, AuthResponse, Role } from '@/shared/types/api';
import { loginRequest, registerRequest } from './api';

interface AuthState {
  user: AppUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, role: Role) => Promise<void>;
  logout: () => void;
}

const AuthCtx = createContext<AuthState | null>(null);

const USER_KEY = 'user';
const TOKEN_KEY = 'token';

function readStoredUser(): AppUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AppUser;
  } catch {
    return null;
  }
}

// Foundation AuthResponse has no id field; the JWT subject claim is the email.
// We keep id as 0 here; HALLGATO-specific UI fetches GET /students/me to get the
// real student id when needed.
function toUser(data: AuthResponse): AppUser {
  return { id: 0, email: data.email, fullName: data.fullName, role: data.role };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AppUser | null>(() => readStoredUser());
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));

  useEffect(() => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  }, [user]);

  useEffect(() => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }, [token]);

  // On mount with a stored token, verify it isn't expired; if it is, clear auth.
  useEffect(() => {
    if (!token) return;
    const decoded = decodeJwt(token);
    if (decoded?.exp && decoded.exp * 1000 < Date.now()) {
      setUser(null);
      setToken(null);
    }
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginRequest({ email, password });
    setToken(data.token);
    setUser(toUser(data));
  }, []);

  const register = useCallback(
    async (email: string, password: string, fullName: string, role: Role) => {
      const data = await registerRequest({ email, password, fullName, role });
      setToken(data.token);
      setUser(toUser(data));
    },
    [],
  );

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo<AuthState>(
    () => ({ user, token, login, register, logout }),
    [user, token, login, register, logout],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
