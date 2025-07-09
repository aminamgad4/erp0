'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AccessDenied from '@/components/AccessDenied';
import { ModuleAccess } from '@/lib/models/User';

interface User {
  name: string;
  email: string;
  role: string;
  modules: ModuleAccess;
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireModule?: keyof ModuleAccess;
  requireAdmin?: boolean;
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({ 
  children, 
  requireModule, 
  requireAdmin = false,
  fallback 
}: ProtectedRouteProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAccess();
  }, [requireModule, requireAdmin]);

  const checkAccess = async () => {
    try {
      const response = await fetch('/api/auth/me');
      
      if (!response.ok) {
        router.push('/login');
        return;
      }

      const userData = await response.json();
      setUser(userData);

      // Check admin access
      if (requireAdmin && userData.role !== 'super-admin') {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      // Check module access
      if (requireModule && !userData.modules[requireModule]) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      setHasAccess(true);
    } catch (error) {
      console.error('Access check error:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    let message = 'ليس لديك صلاحية للوصول إلى هذه الصفحة';
    
    if (requireAdmin) {
      message = 'هذه الصفحة مخصصة لمديري النظام فقط';
    } else if (requireModule) {
      const moduleNames = {
        crm: 'إدارة العملاء',
        hr: 'الموارد البشرية',
        inventory: 'إدارة المخزون',
        sales: 'المبيعات'
      };
      message = `ليس لديك صلاحية للوصول إلى وحدة ${moduleNames[requireModule]}`;
    }

    return <AccessDenied message={message} />;
  }

  return <>{children}</>;
}