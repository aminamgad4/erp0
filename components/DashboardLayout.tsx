'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  LogOut, 
  Menu, 
  X, 
  Home, 
  Users, 
  TrendingUp,
  Package,
  Settings,
  ChevronDown,
  UserCheck,
  type LucideIcon
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ModuleAccess } from '@/lib/models/User';

interface User {
  name: string;
  email: string;
  role: string;
  modules: ModuleAccess;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navigation: NavigationItem[] = [
    { name: 'الرئيسية', href: '/dashboard', icon: Home },
    ...(user?.modules?.crm === true ? [
      { name: 'إدارة العملاء', href: '/crm', icon: Users },
    ] : []),
    ...(user?.modules?.hr === true ? [
      { name: 'الموارد البشرية', href: '/hr', icon: UserCheck },
    ] : []),
    ...(user?.modules?.sales === true ? [
      { name: 'المبيعات والفواتير', href: '/sales', icon: TrendingUp },
    ] : []),
    ...(user?.modules?.inventory === true ? [
      { name: 'إدارة المخزون', href: '/inventory', icon: Package },
    ] : []),
    ...(user?.role === 'super-admin' ? [
      { name: 'الشركات', href: '/admin/companies', icon: Building2 },
      { name: 'المستخدمين', href: '/admin/users', icon: Users },
    ] : []),
  ];

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-600 bg-opacity-75 transition-opacity z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 right-0 flex flex-col max-w-xs w-full bg-white transform transition-transform duration-300 ease-in-out z-50 md:hidden ${
        sidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Mobile sidebar header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200">
          <div className="flex items-center space-x-3 space-x-reverse">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-slate-900">نظام الإدارة</span>
          </div>
          <button
            className="p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            onClick={closeSidebar}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Mobile sidebar content */}
        <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
          <nav className="px-2 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={closeSidebar}
                  className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <Icon className="ml-4 h-6 w-6 flex-shrink-0" />
                  {item.name}
                </a>
              );
            })}
          </nav>
        </div>

        {/* Mobile sidebar footer */}
        {user && (
          <div className="flex-shrink-0 border-t border-slate-200 p-4">
            <div className="flex items-center">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">
                  {user.role === 'super-admin' && 'مدير النظام'}
                  {user.role === 'owner' && 'مالك'}
                  {user.role === 'staff' && 'موظف'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="ml-3 p-2"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 border-l border-slate-200 bg-white">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <Building2 className="h-8 w-8 text-primary" />
              <span className="mr-2 text-xl font-bold text-slate-900">نظام الإدارة</span>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                  >
                    <Icon className="ml-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </a>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pr-64 flex flex-col flex-1">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-slate-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                {/* Mobile menu button */}
                <button
                  className="md:hidden p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-6 w-6" />
                </button>
                <h1 className="text-lg font-medium text-slate-900 mr-4 md:mr-0">لوحة التحكم</h1>
              </div>
              
              <div className="flex items-center space-x-4 space-x-reverse">
                {user && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center space-x-2 space-x-reverse">
                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-medium text-slate-900">{user.name}</p>
                          <p className="text-xs text-slate-500">
                            {user.role === 'super-admin' && 'مدير النظام'}
                            {user.role === 'owner' && 'مالك'}
                            {user.role === 'staff' && 'موظف'}
                          </p>
                        </div>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="ml-2 h-4 w-4" />
                        تسجيل الخروج
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}