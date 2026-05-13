import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setToken } from '../api/client';

export type Role = 'admin' | 'coach' | 'parent';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: Role;
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: { email: string; password: string; name: string; phone?: string; role: Role }) => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const me = await api.get<User>('/auth/me');
          setUser(me);
        }
      } catch {
        await setToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = async (email: string, password: string) => {
    const res = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
    await setToken(res.token);
    setUser(res.user);
  };

  const signUp = async (data: { email: string; password: string; name: string; phone?: string; role: Role }) => {
    const res = await api.post<{ token: string; user: User }>('/auth/signup', data);
    await setToken(res.token);
    setUser(res.user);
  };

  const signOut = async () => {
    await setToken(null);
    setUser(null);
  };

  return <Ctx.Provider value={{ user, loading, signIn, signUp, signOut }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
