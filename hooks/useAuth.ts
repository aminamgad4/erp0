'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ModuleAccess } from '@/lib/models/User';

interface User {
  name: string;
  email: string;
  role: string;
  modules: ModuleAccess;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    isAuthenticated: false,
  });
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      
      if (response.ok) {
        const userData = await response.json();
        setAuthState({
          user: userData,
          loading: false,
          isAuthenticated: true,
        });
      } else {
        setAuthState({
          user: null,
          loading: false,
          isAuthenticated: false,
        });
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setAuthState({
        user: null,
        loading: false,
        isAuthenticated: false,
      });
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        await checkAuth(); // Refresh auth state
        router.push('/dashboard');
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'حدث خطأ في الاتصال بالخادم' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setAuthState({
        user: null,
        loading: false,
        isAuthenticated: false,
      });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const hasModuleAccess = (module: keyof ModuleAccess): boolean => {
    return authState.user?.modules[module] === true;
  };

  const isAdmin = (): boolean => {
    return authState.user?.role === 'super-admin';
  };

  const isOwner = (): boolean => {
    return authState.user?.role === 'owner';
  };

  return {
    ...authState,
    login,
    logout,
    hasModuleAccess,
    isAdmin,
    isOwner,
    refresh: checkAuth,
  };
}