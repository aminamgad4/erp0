import { NextRequest, NextResponse } from 'next/server';
import { getSession, canAccessAdmin } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';
import { Company } from '@/lib/models/Company';
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

    const companyData = await request.json();
    const db = await getDb();
    
    const result = await db.collection<Company>('companies').updateOne(
      { _id: new ObjectId(params.id) },
      { 
        $set: {
          ...companyData,
          updatedAt: new Date(),
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'الشركة غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update company API error:', error);
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
    
    const result = await db.collection<Company>('companies').deleteOne(
      { _id: new ObjectId(params.id) }
    );

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'الشركة غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete company API error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}