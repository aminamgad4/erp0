'use client';

import { useState, useEffect } from 'react';
import { Users, TrendingUp, Package, UserCheck } from 'lucide-react';

interface DashboardStatsProps {
  userId: string;
  companyId?: string;
}

interface Stats {
  customers: number;
  sales: number;
  products: number;
  employees: number;
}

export default function DashboardStats({ userId, companyId }: DashboardStatsProps) {
  const [stats, setStats] = useState<Stats>({
    customers: 0,
    sales: 0,
    products: 0,
    employees: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [userId, companyId]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-4 md:p-6 rounded-lg shadow-sm border animate-pulse">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-slate-200 rounded w-20 mb-2"></div>
                <div className="h-8 bg-slate-200 rounded w-16"></div>
              </div>
              <div className="bg-slate-200 p-3 rounded-lg w-12 h-12"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">العملاء النشطون</p>
            <p className="text-xl md:text-2xl font-bold text-slate-900">{stats.customers.toLocaleString()}</p>
          </div>
          <div className="bg-blue-100 p-2 md:p-3 rounded-lg">
            <Users className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">المبيعات الشهرية</p>
            <p className="text-xl md:text-2xl font-bold text-slate-900">₪{stats.sales.toLocaleString()}</p>
          </div>
          <div className="bg-green-100 p-2 md:p-3 rounded-lg">
            <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">المنتجات</p>
            <p className="text-xl md:text-2xl font-bold text-slate-900">{stats.products.toLocaleString()}</p>
          </div>
          <div className="bg-purple-100 p-2 md:p-3 rounded-lg">
            <Package className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">الموظفون</p>
            <p className="text-xl md:text-2xl font-bold text-slate-900">{stats.employees.toLocaleString()}</p>
          </div>
          <div className="bg-orange-100 p-2 md:p-3 rounded-lg">
            <UserCheck className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
          </div>
        </div>
      </div>
    </div>
  );
}