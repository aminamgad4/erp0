'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users, Package, TrendingUp, UserCheck, Building, FileText, Calendar, Settings, type LucideIcon } from 'lucide-react';

interface ModuleContentProps {
  module: string;
  userRole: string;
  companyId?: string;
}

interface TabConfig {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface ModuleConfig {
  title: string;
  icon: LucideIcon;
  color: string;
  tabs: TabConfig[];
}

export default function ModuleContent({ module, userRole, companyId }: ModuleContentProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const getModuleConfig = (): ModuleConfig | null => {
    switch (module) {
      case 'crm':
        return {
          title: 'إدارة العملاء',
          icon: Users,
          color: 'bg-blue-500',
          tabs: [
            { id: 'overview', label: 'نظرة عامة', icon: Building },
            { id: 'customers', label: 'العملاء', icon: Users },
            { id: 'leads', label: 'العملاء المحتملون', icon: UserCheck },
            { id: 'reports', label: 'التقارير', icon: FileText },
          ]
        };
      case 'hr':
        return {
          title: 'الموارد البشرية',
          icon: UserCheck,
          color: 'bg-green-500',
          tabs: [
            { id: 'overview', label: 'نظرة عامة', icon: Building },
            { id: 'employees', label: 'الموظفون', icon: Users },
            { id: 'attendance', label: 'الحضور والانصراف', icon: Calendar },
            { id: 'payroll', label: 'الرواتب', icon: TrendingUp },
            { id: 'reports', label: 'التقارير', icon: FileText },
          ]
        };
      case 'inventory':
        return {
          title: 'إدارة المخزون',
          icon: Package,
          color: 'bg-purple-500',
          tabs: [
            { id: 'overview', label: 'نظرة عامة', icon: Building },
            { id: 'products', label: 'المنتجات', icon: Package },
            { id: 'categories', label: 'الفئات', icon: Settings },
            { id: 'stock', label: 'المخزون', icon: FileText },
            { id: 'reports', label: 'التقارير', icon: FileText },
          ]
        };
      case 'sales':
        return {
          title: 'المبيعات',
          icon: TrendingUp,
          color: 'bg-orange-500',
          tabs: [
            { id: 'overview', label: 'نظرة عامة', icon: Building },
            { id: 'orders', label: 'الطلبات', icon: FileText },
            { id: 'invoices', label: 'الفواتير', icon: FileText },
            { id: 'customers', label: 'العملاء', icon: Users },
            { id: 'reports', label: 'التقارير', icon: FileText },
          ]
        };
      default:
        return null;
    }
  };

  const config = getModuleConfig();
  if (!config) return null;

  const MainIcon = config.icon;

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className={`${config.color} p-3 rounded-lg text-white`}>
              <MainIcon className="w-8 h-8" />
            </div>
            <div>
              <CardTitle className="text-2xl">{config.title}</CardTitle>
              <CardDescription>
                إدارة شاملة لجميع عمليات {config.title.toLowerCase()}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Module Navigation */}
      <div className="border-b border-slate-200 overflow-x-auto">
        <nav className="flex space-x-4 md:space-x-8 space-x-reverse min-w-max">
          {config.tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 space-x-reverse py-4 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <TabIcon className="w-4 h-4 flex-shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Module Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <Card>
              <CardHeader className="pb-3 p-4 md:p-6">
                <CardTitle className="text-lg">إحصائيات سريعة</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">العناصر النشطة</span>
                    <span className="font-semibold">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">هذا الشهر</span>
                    <span className="font-semibold">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">المجموع</span>
                    <span className="font-semibold">0</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 p-4 md:p-6">
                <CardTitle className="text-lg">الإجراءات السريعة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-4 md:p-6 pt-0">
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة جديد
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="w-4 h-4 ml-2" />
                  عرض التقارير
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Settings className="w-4 h-4 ml-2" />
                  الإعدادات
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 p-4 md:p-6">
                <CardTitle className="text-lg">النشاط الأخير</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                <div className="text-center py-8 text-slate-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>لا توجد أنشطة حديثة</p>
                  <p className="text-xs md:text-sm">ابدأ بإضافة البيانات لرؤية النشاط هنا</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab !== 'overview' && (
          <Card>
            <CardHeader className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {config.tabs.find(tab => tab.id === activeTab)?.label}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    إدارة {config.tabs.find(tab => tab.id === activeTab)?.label}
                  </CardDescription>
                </div>
                <Button size="sm" className="text-sm">
                  <Plus className="w-4 h-4 ml-2" />
                  <span className="hidden sm:inline">إضافة جديد</span>
                  <span className="sm:hidden">إضافة</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <div className="text-center py-12 text-slate-500">
                <Package className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  لا توجد بيانات
                </h3>
                <p className="mb-4 text-sm md:text-base">
                  لم يتم إضافة أي عناصر بعد. ابدأ بإضافة العنصر الأول.
                </p>
                <Button size="sm">
                  <Plus className="w-4 h-4 ml-2" />
                  <span className="hidden sm:inline">إضافة العنصر الأول</span>
                  <span className="sm:hidden">إضافة</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}