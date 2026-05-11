import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '../api/client';

export type Role = 'ADMIN' | 'OKTATO' | 'HALLGATO';
export interface User {
  email: string;
  fullName: string;
  role: Role;
}

interface AuthState {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, role: Role) => Promise<void>;
  logout: () => void;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setUser({ email: data.email, fullName: data.fullName, role: data.role });
  };

  const register = async (email: string, password: string, fullName: string, role: Role) => {
    const { data } = await api.post('/auth/register', { email, password, fullName, role });
    localStorage.setItem('token', data.token);
    setUser({ email: data.email, fullName: data.fullName, role: data.role });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return <AuthCtx.Provider value={{ user, login, register, logout }}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
