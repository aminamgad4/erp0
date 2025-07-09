export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import UsersManager from '@/components/UsersManager';

export default async function UsersPage() {
  const session = await getSession();

  if (!session.isLoggedIn || session.role !== 'super-admin') {
    redirect('/dashboard');
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">إدارة المستخدمين</h1>
          <p className="text-slate-600 mt-1">
            إضافة وإدارة المستخدمين وصلاحياتهم
          </p>
        </div>
        <UsersManager />
      </div>
    </DashboardLayout>
  );
}