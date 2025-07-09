import { NextRequest, NextResponse } from 'next/server';
import { getSession, canAccessAdmin } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';
import { Company } from '@/lib/models/Company';

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
    const companies = await db.collection<Company>('companies')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(companies);
  } catch (error) {
    console.error('Get companies API error:', error);
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

    const companyData = await request.json();
    
    const company: Omit<Company, '_id'> = {
      ...companyData,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const db = await getDb();
    const result = await db.collection<Company>('companies').insertOne(company);

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (error) {
    console.error('Create company API error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}