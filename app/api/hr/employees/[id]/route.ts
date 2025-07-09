import { NextRequest, NextResponse } from 'next/server';
import { getSession, checkModuleAccess } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';
import { Employee } from '@/lib/models/HR';
import { ObjectId } from 'mongodb';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    
    if (!session.isLoggedIn || !checkModuleAccess(session.modules, 'hr')) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح بالوصول' },
        { status: 403 }
      );
    }

    const employeeData = await request.json();
    const db = await getDb();
    
    // Build query filter
    let filter: any = { _id: new ObjectId(params.id) };
    
    // Add company filter for non-super-admin users
    if (session.role !== 'super-admin' && session.companyId) {
      filter.companyId = new ObjectId(session.companyId);
    }

    // Check if employee exists and user has access
    const existingEmployee = await db.collection<Employee>('employees').findOne(filter);
    if (!existingEmployee) {
      return NextResponse.json(
        { success: false, message: 'الموظف غير موجود' },
        { status: 404 }
      );
    }

    // Check for duplicate email if email is being changed
    if (employeeData.email && employeeData.email.toLowerCase() !== existingEmployee.email) {
      const duplicateEmployee = await db.collection<Employee>('employees').findOne({
        email: employeeData.email.toLowerCase(),
        companyId: existingEmployee.companyId,
        isActive: true,
        _id: { $ne: new ObjectId(params.id) }
      });

      if (duplicateEmployee) {
        return NextResponse.json(
          { success: false, message: 'يوجد موظف بهذا البريد الإلكتروني بالفعل' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    // Update only provided fields
    if (employeeData.name) updateData.name = employeeData.name.trim();
    if (employeeData.phone) updateData.phone = employeeData.phone.trim();
    if (employeeData.email) updateData.email = employeeData.email.toLowerCase().trim();
    if (employeeData.role) updateData.role = employeeData.role.trim();
    if (employeeData.department !== undefined) updateData.department = employeeData.department.trim() || 'عام';
    if (employeeData.baseSalary !== undefined) updateData.baseSalary = parseFloat(employeeData.baseSalary) || 0;
    if (employeeData.hireDate) updateData.hireDate = new Date(employeeData.hireDate);
    if (employeeData.status) updateData.status = employeeData.status;

    const result = await db.collection<Employee>('employees').updateOne(
      filter,
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'الموظف غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update employee API error:', error);
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
    
    if (!session.isLoggedIn || !checkModuleAccess(session.modules, 'hr')) {
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
    const result = await db.collection<Employee>('employees').updateOne(
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
        { success: false, message: 'الموظف غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete employee API error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}