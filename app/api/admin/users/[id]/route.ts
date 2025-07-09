import { NextRequest, NextResponse } from 'next/server';
import { getSession, canAccessAdmin, hashPassword } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';
import { User, superAdminModuleAccess } from '@/lib/models/User';
import { ObjectId } from 'mongodb';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    
    if (!session.isLoggedIn || !canAccessAdmin(session.role)) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح بالوصول' },
        { status: 403 }
      );
    }

    const userData = await request.json();
    const db = await getDb();

    // Prepare update data
    const updateData: any = {
      name: userData.name,
      email: userData.email.toLowerCase(),
      role: userData.role,
      companyId: userData.companyId ? new ObjectId(userData.companyId) : undefined,
      modules: userData.role === 'super-admin' ? superAdminModuleAccess : userData.modules,
      updatedAt: new Date(),
    };

    // Update password if provided
    if (userData.password && userData.password.trim() !== '') {
      updateData.password = await hashPassword(userData.password);
    }

    const result = await db.collection<User>('users').updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update user API error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    
    if (!session.isLoggedIn || !canAccessAdmin(session.role)) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح بالوصول' },
        { status: 403 }
      );
    }

    const db = await getDb();
    
    const result = await db.collection<User>('users').deleteOne(
      { _id: new ObjectId(params.id) }
    );

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user API error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}