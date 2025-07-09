'use client';

import { Users, Package, TrendingUp, BarChart3, Calendar, type LucideIcon } from 'lucide-react';
import ModuleCard from '@/components/ModuleCard';
import { ModuleAccess } from '@/lib/models/User';

interface DashboardModulesProps {
  modules: ModuleAccess;
}

interface ModuleConfig {
  key: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  enabled: boolean;
  href: string;
}

export default function DashboardModules({ modules }: DashboardModulesProps) {
  const modulesList: ModuleConfig[] = [
    {
      key: 'crm',
      title: 'إدارة العملاء',
      description: 'إدارة العملاء والعلاقات التجارية',
      icon: Users,
      color: 'bg-blue-500',
      enabled: modules.crm === true,
      href: '/crm',
    },
    {
      key: 'hr',
      title: 'الموارد البشرية',
      description: 'إدارة الموظفين والرواتب',
      icon: Calendar,
      color: 'bg-green-500',
      enabled: modules.hr === true,
      href: '/hr',
    },
    {
      key: 'inventory',
      title: 'إدارة المخزون',
      description: 'تتبع المنتجات والمخزون',
      icon: Package,
      color: 'bg-purple-500',
      enabled: modules.inventory === true,
      href: '/inventory',
    },
    {
      key: 'sales',
      title: 'المبيعات',
      description: 'إدارة المبيعات والفواتير',
      icon: TrendingUp,
      color: 'bg-orange-500',
      enabled: modules.sales === true,
      href: '/sales',
    },
  ];

  const availableModules = modulesList.filter(module => module.enabled);

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900 mb-4">
        الوحدات المتاحة
      </h2>
      {availableModules.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {availableModules.map((module) => (
            <ModuleCard key={module.key} module={module} />
          ))}
        </div>
      ) : (
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border text-center">
          <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            لا توجد وحدات متاحة
          </h3>
          <p className="text-slate-600 text-sm md:text-base">
            يرجى التواصل مع المدير لتفعيل الوحدات المطلوبة
          </p>
        </div>
      )}
    </div>
  );
}