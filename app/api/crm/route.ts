import { NextRequest, NextResponse } from 'next/server';
import { getSession, checkModuleAccess } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';
import { Contact } from '@/lib/models/CRM';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session.isLoggedIn || !checkModuleAccess(session.modules, 'crm')) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح بالوصول' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'customer' | 'supplier' | null (all)

    const db = await getDb();
    
    // Build query filter
    let filter: any = {
      isActive: true
    };

    // Add company filter for non-super-admin users
    if (session.role !== 'super-admin' && session.companyId) {
      filter.companyId = new ObjectId(session.companyId);
    }

    // Add type filter if specified
    if (type && (type === 'customer' || type === 'supplier')) {
      filter.type = type;
    }

    const contacts = await db.collection<Contact>('contacts')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(contacts);
  } catch (error) {
    console.error('Get contacts API error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session.isLoggedIn || !checkModuleAccess(session.modules, 'crm')) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح بالوصول' },
        { status: 403 }
      );
    }

    if (!session.companyId && session.role !== 'super-admin') {
      return NextResponse.json(
        { success: false, message: 'يجب أن تكون مرتبطاً بشركة' },
        { status: 400 }
      );
    }

    const contactData = await request.json();
    
    // Validate required fields
    if (!contactData.name || !contactData.phone || !contactData.email || !contactData.type) {
      return NextResponse.json(
        { success: false, message: 'جميع الحقول المطلوبة يجب ملؤها' },
        { status: 400 }
      );
    }

    // Validate type
    if (!['customer', 'supplier'].includes(contactData.type)) {
      return NextResponse.json(
        { success: false, message: 'نوع جهة الاتصال غير صحيح' },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    // Check if contact with same email already exists in the company
    const companyId = session.role === 'super-admin' && contactData.companyId 
      ? new ObjectId(contactData.companyId)
      : new ObjectId(session.companyId!);

    const existingContact = await db.collection<Contact>('contacts').findOne({
      email: contactData.email.toLowerCase(),
      companyId: companyId,
      isActive: true
    });

    if (existingContact) {
      return NextResponse.json(
        { success: false, message: 'يوجد جهة اتصال بهذا البريد الإلكتروني بالفعل' },
        { status: 400 }
      );
    }

    const contact: Omit<Contact, '_id'> = {
      name: contactData.name.trim(),
      phone: contactData.phone.trim(),
      email: contactData.email.toLowerCase().trim(),
      address: contactData.address?.trim() || '',
      type: contactData.type,
      notes: contactData.notes?.trim() || '',
      balance: parseFloat(contactData.balance) || 0,
      companyId: companyId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: new ObjectId(session.userId),
    };

    const result = await db.collection<Contact>('contacts').insertOne(contact);

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (error) {
    console.error('Create contact API error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}