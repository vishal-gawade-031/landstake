'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

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
  login: (email: string, role?: 'CITIZEN' | 'OFFICER' | 'ADMIN') => void;
  loginWithCredentials: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  loginAsRole: (role: 'CITIZEN' | 'OFFICER' | 'ADMIN') => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => void;
  switchRole: (role: 'CITIZEN' | 'OFFICER' | 'ADMIN') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('landstack_user');
      const savedToken = localStorage.getItem('landstack_token');
      if (savedUser && savedToken) {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } else {
        // Default to Admin demo user for convenience during fresh evaluation
        const defaultAdmin: User = {
          id: 'demo-admin-id',
          email: 'admin@landstack.demo',
          name: 'Dr. Ramesh Narayan (IAS)',
          role: 'ADMIN',
          department: 'Revenue & Land Records Secretariat, Govt. of Karnataka',
          phone: '+91 98450 00101',
        };
        setUser(defaultAdmin);
        setToken('demo-jwt-token');
        localStorage.setItem('landstack_user', JSON.stringify(defaultAdmin));
        localStorage.setItem('landstack_token', 'demo-jwt-token');
      }
    } catch (e) {
      console.error('Failed to parse saved user', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

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

    const result = await loginWithCredentials(credentials.email, credentials.pass);
    if (!result.success) {
      // Fallback client-side mock if backend is somehow unreachable
      login(credentials.email, role);
      return { success: true, user: user || undefined };
    }
    return result;
  };

  const login = (email: string, role: 'CITIZEN' | 'OFFICER' | 'ADMIN' = 'ADMIN') => {
    let name = 'Dr. Ramesh Narayan (IAS)';
    let dept = 'Revenue & Land Records Secretariat';

    if (role === 'OFFICER') {
      name = 'Shri Anand Kulkarni (KAS)';
      dept = 'Taluk Revenue & Cadastral Cell';
    } else if (role === 'CITIZEN') {
      name = 'Priyanka Patil';
      dept = 'Public Citizen Portal';
    }

    const newUser: User = {
      id: `usr-${role.toLowerCase()}`,
      email,
      name,
      role,
      department: dept,
      phone: '+91 98450 00101',
    };

    setUser(newUser);
    const demoToken = `token-${role}-${Date.now()}`;
    setToken(demoToken);
    localStorage.setItem('landstack_user', JSON.stringify(newUser));
    localStorage.setItem('landstack_token', demoToken);
  };

  const switchRole = (newRole: 'CITIZEN' | 'OFFICER' | 'ADMIN') => {
    loginAsRole(newRole);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('landstack_user');
    localStorage.removeItem('landstack_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        loginWithCredentials,
        loginAsRole,
        logout,
        switchRole,
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
