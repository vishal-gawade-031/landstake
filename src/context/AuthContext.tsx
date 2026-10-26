'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'CITIZEN' | 'OFFICER' | 'ADMIN';
  department?: string | null;
  phone?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginWithCredentials: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  loginAsRole: (role: 'CITIZEN' | 'OFFICER' | 'ADMIN') => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => void;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem('landstack_user');
      localStorage.removeItem('landstack_token');
      document.cookie = 'landstack_token=; path=/; max-age=0; SameSite=Lax';
    } catch (e) {
      console.error('Error during logout', e);
    }
  }, []);

  // Validate session on mount with server-side /api/auth/me
  useEffect(() => {
    async function validateSession() {
      try {
        const savedToken = localStorage.getItem('landstack_token');
        if (savedToken) {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${savedToken}` },
          });
          const data = await res.json();
          if (data.success && data.data) {
            setUser(data.data);
            setToken(savedToken);
            document.cookie = `landstack_token=${savedToken}; path=/; max-age=604800; SameSite=Lax`;
          } else {
            // Token expired or invalid
            logout();
          }
        } else {
          setUser(null);
          setToken(null);
        }
      } catch (e) {
        console.error('Failed to validate session', e);
        logout();
      } finally {
        setIsLoading(false);
      }
    }
    validateSession();
  }, [logout]);

  const loginWithCredentials = async (email: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const loggedUser: User = data.data.user;
        const jwtToken: string = data.data.token;
        setUser(loggedUser);
        setToken(jwtToken);
        localStorage.setItem('landstack_user', JSON.stringify(loggedUser));
        localStorage.setItem('landstack_token', jwtToken);
        document.cookie = `landstack_token=${jwtToken}; path=/; max-age=604800; SameSite=Lax`;
        return { success: true, user: loggedUser };
      } else {
        return { success: false, error: data.message || 'Authentication failed' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during login' };
    }
  };

  const loginAsRole = async (role: 'CITIZEN' | 'OFFICER' | 'ADMIN') => {
    const credentials = {
      ADMIN: { email: 'admin@landstack.demo', pass: 'admin123' },
      OFFICER: { email: 'officer@landstack.demo', pass: 'officer123' },
      CITIZEN: { email: 'citizen@landstack.demo', pass: 'citizen123' },
    }[role];

    return await loginWithCredentials(credentials.email, credentials.pass);
  };

  // Authenticated fetch wrapper that automatically attaches the Bearer token
  const fetchWithAuth = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem('landstack_token') : null);
      const headers = new Headers(options.headers || {});
      if (currentToken && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${currentToken}`);
      }
      return fetch(url, { ...options, headers });
    },
    [token]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        loginWithCredentials,
        loginAsRole,
        logout,
        fetchWithAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

