import { NextRequest, NextResponse } from 'next/server';
import { getSession, checkModuleAccess } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';
import { Employee } from '@/lib/models/HR';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session.isLoggedIn || !checkModuleAccess(session.modules, 'hr')) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح بالوصول' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const department = searchParams.get('department');
    const search = searchParams.get('search');

    const db = await getDb();
    
    // Build query filter
    let filter: any = {
      isActive: true
    };

    // Add company filter for non-super-admin users
    if (session.role !== 'super-admin' && session.companyId) {
      filter.companyId = new ObjectId(session.companyId);
    }

    // Add status filter if specified
    if (status && ['active', 'inactive', 'terminated'].includes(status)) {
      filter.status = status;
    }

    // Add department filter if specified
    if (department) {
      filter.department = department;
    }

    // Add search filter if specified
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } }
      ];
    }

    const employees = await db.collection<Employee>('employees')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(employees);
  } catch (error) {
    console.error('Get employees API error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session.isLoggedIn || !checkModuleAccess(session.modules, 'hr')) {
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

    const employeeData = await request.json();
    
    // Validate required fields
    if (!employeeData.name || !employeeData.phone || !employeeData.email || !employeeData.role) {
      return NextResponse.json(
        { success: false, message: 'جميع الحقول المطلوبة يجب ملؤها' },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    // Check if employee with same email already exists in the company
    const companyId = session.role === 'super-admin' && employeeData.companyId 
      ? new ObjectId(employeeData.companyId)
      : new ObjectId(session.companyId!);

    const existingEmployee = await db.collection<Employee>('employees').findOne({
      email: employeeData.email.toLowerCase(),
      companyId: companyId,
      isActive: true
    });

    if (existingEmployee) {
      return NextResponse.json(
        { success: false, message: 'يوجد موظف بهذا البريد الإلكتروني بالفعل' },
        { status: 400 }
      );
    }

    // Generate employee ID
    const employeeCount = await db.collection('employees').countDocuments({
      companyId: companyId
    });
    
    const employeeId = `EMP-${String(employeeCount + 1).padStart(4, '0')}`;

    const employee: Omit<Employee, '_id'> = {
      employeeId,
      name: employeeData.name.trim(),
      phone: employeeData.phone.trim(),
      email: employeeData.email.toLowerCase().trim(),
      role: employeeData.role.trim(),
      department: employeeData.department?.trim() || 'عام',
      baseSalary: parseFloat(employeeData.baseSalary) || 0,
      hireDate: new Date(employeeData.hireDate),
      status: employeeData.status || 'active',
      companyId: companyId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: new ObjectId(session.userId),
    };

    const result = await db.collection<Employee>('employees').insertOne(employee);

    return NextResponse.json({ success: true, id: result.insertedId, employeeId });
  } catch (error) {
    console.error('Create employee API error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}