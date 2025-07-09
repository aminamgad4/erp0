export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import CompaniesManager from '@/components/CompaniesManager';

export default async function CompaniesPage() {
  const session = await getSession();

  if (!session.isLoggedIn || session.role !== 'super-admin') {
    redirect('/dashboard');
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">إدارة الشركات</h1>
          <p className="text-slate-600 mt-1">
            إضافة وإدارة الشركات المسجلة في النظام
          </p>
        </div>
        <CompaniesManager />
      </div>
    </DashboardLayout>
  );
}