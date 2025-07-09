import { NextRequest, NextResponse } from 'next/server';
import { getSession, canAccessAdmin, hashPassword } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';
import { User, defaultModuleAccess, superAdminModuleAccess } from '@/lib/models/User';
import { Company } from '@/lib/models/Company';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session.isLoggedIn || !canAccessAdmin(session.role)) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح بالوصول' },
        { status: 403 }
      );
    }

    const db = await getDb();
    
    // Get users with company information
    const users = await db.collection<User>('users')
      .aggregate([
        {
          $lookup: {
            from: 'companies',
            localField: 'companyId',
            foreignField: '_id',
            as: 'company'
          }
        },
        {
          $addFields: {
            companyName: { $arrayElemAt: ['$company.nameAr', 0] }
          }
        },
        {
          $project: {
            password: 0,
            company: 0
          }
        },
        {
          $sort: { createdAt: -1 }
        }
      ])
      .toArray();

    return NextResponse.json(users);
  } catch (error) {
    console.error('Get users API error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session.isLoggedIn || !canAccessAdmin(session.role)) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح بالوصول' },
        { status: 403 }
      );
    }

    const userData = await request.json();
    
    // Check if user already exists
    const db = await getDb();
    const existingUser = await db.collection<User>('users').findOne({
      email: userData.email.toLowerCase()
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'هذا البريد الإلكتروني مستخدم بالفعل' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Determine modules based on role
    const modules = userData.role === 'super-admin' 
      ? superAdminModuleAccess 
      : userData.modules || defaultModuleAccess;

    const user: Omit<User, '_id'> = {
      name: userData.name,
      email: userData.email.toLowerCase(),
      password: hashedPassword,
      role: userData.role,
      companyId: userData.companyId ? new ObjectId(userData.companyId) : undefined,
      modules,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<User>('users').insertOne(user);

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (error) {
    console.error('Create user API error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}