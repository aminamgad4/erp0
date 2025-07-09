import { NextRequest, NextResponse } from 'next/server';
import { getSession, checkModuleAccess } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';
import { Contact } from '@/lib/models/CRM';
import { ObjectId } from 'mongodb';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    
    if (!session.isLoggedIn || !checkModuleAccess(session.modules, 'crm')) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح بالوصول' },
        { status: 403 }
      );
    }

    const contactData = await request.json();
    const db = await getDb();
    
    // Build query filter
    let filter: any = { _id: new ObjectId(params.id) };
    
    // Add company filter for non-super-admin users
    if (session.role !== 'super-admin' && session.companyId) {
      filter.companyId = new ObjectId(session.companyId);
    }

    // Validate type if provided
    if (contactData.type && !['customer', 'supplier'].includes(contactData.type)) {
      return NextResponse.json(
        { success: false, message: 'نوع جهة الاتصال غير صحيح' },
        { status: 400 }
      );
    }

    // Check if contact exists and user has access
    const existingContact = await db.collection<Contact>('contacts').findOne(filter);
    if (!existingContact) {
      return NextResponse.json(
        { success: false, message: 'جهة الاتصال غير موجودة' },
        { status: 404 }
      );
    }

    // Check for duplicate email if email is being changed
    if (contactData.email && contactData.email.toLowerCase() !== existingContact.email) {
      const duplicateContact = await db.collection<Contact>('contacts').findOne({
        email: contactData.email.toLowerCase(),
        companyId: existingContact.companyId,
        isActive: true,
        _id: { $ne: new ObjectId(params.id) }
      });

      if (duplicateContact) {
        return NextResponse.json(
          { success: false, message: 'يوجد جهة اتصال بهذا البريد الإلكتروني بالفعل' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    // Update only provided fields
    if (contactData.name) updateData.name = contactData.name.trim();
    if (contactData.phone) updateData.phone = contactData.phone.trim();
    if (contactData.email) updateData.email = contactData.email.toLowerCase().trim();
    if (contactData.address !== undefined) updateData.address = contactData.address.trim();
    if (contactData.type) updateData.type = contactData.type;
    if (contactData.notes !== undefined) updateData.notes = contactData.notes.trim();
    if (contactData.balance !== undefined) updateData.balance = parseFloat(contactData.balance) || 0;

    const result = await db.collection<Contact>('contacts').updateOne(
      filter,
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'جهة الاتصال غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update contact API error:', error);
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
    
    if (!session.isLoggedIn || !checkModuleAccess(session.modules, 'crm')) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح بالوصول' },
        { status: 403 }
      );
    }

    const db = await getDb();
    
    // Build query filter
    let filter: any = { _id: new ObjectId(params.id) };
    
    // Add company filter for non-super-admin users
    if (session.role !== 'super-admin' && session.companyId) {
      filter.companyId = new ObjectId(session.companyId);
    }

    // Soft delete by setting isActive to false
    const result = await db.collection<Contact>('contacts').updateOne(
      filter,
      { 
        $set: { 
          isActive: false,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'جهة الاتصال غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete contact API error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}