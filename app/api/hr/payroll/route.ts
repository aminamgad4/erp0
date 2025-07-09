import { NextRequest, NextResponse } from 'next/server';
import { getSession, checkModuleAccess } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';
import { Payroll } from '@/lib/models/HR';
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
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const status = searchParams.get('status');

    const db = await getDb();
    
    // Build query filter
    let filter: any = {};

    // Add company filter for non-super-admin users
    if (session.role !== 'super-admin' && session.companyId) {
      filter.companyId = new ObjectId(session.companyId);
    }

    // Add date filter if specified
    if (month && year) {
      filter.month = parseInt(month);
      filter.year = parseInt(year);
    }

    // Add status filter if specified
    if (status && ['draft', 'approved', 'paid'].includes(status)) {
      filter.status = status;
    }

    const payrolls = await db.collection<Payroll>('payrolls')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(payrolls);
  } catch (error) {
    console.error('Get payrolls API error:', error);
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

    const payrollData = await request.json();
    
    // Validate required fields
    if (!payrollData.employeeId || !payrollData.month || !payrollData.year) {
      return NextResponse.json(
        { success: false, message: 'يجب اختيار الموظف والشهر والسنة' },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    const companyId = session.role === 'super-admin' && payrollData.companyId 
      ? new ObjectId(payrollData.companyId)
      : new ObjectId(session.companyId!);

    // Check if payroll already exists for this employee and month
    const existingPayroll = await db.collection<Payroll>('payrolls').findOne({
      employeeId: new ObjectId(payrollData.employeeId),
      month: payrollData.month,
      year: payrollData.year,
      companyId: companyId
    });

    if (existingPayroll) {
      return NextResponse.json(
        { success: false, message: 'يوجد راتب لهذا الموظف في هذا الشهر بالفعل' },
        { status: 400 }
      );
    }

    // Get employee details
    const employee = await db.collection('employees').findOne({
      _id: new ObjectId(payrollData.employeeId),
      companyId: companyId,
      isActive: true
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, message: 'الموظف غير موجود' },
        { status: 400 }
      );
    }

    // Calculate attendance data for the month
    const startDate = new Date(payrollData.year, payrollData.month - 1, 1);
    const endDate = new Date(payrollData.year, payrollData.month, 0);
    
    const attendanceData = await db.collection('attendance').aggregate([
      {
        $match: {
          employeeId: new ObjectId(payrollData.employeeId),
          companyId: companyId,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          presentDays: {
            $sum: {
              $cond: [{ $eq: ['$status', 'present'] }, 1, 0]
            }
          },
          totalOvertimeHours: { $sum: '$overtimeHours' }
        }
      }
    ]).toArray();

    const attendance = attendanceData[0] || { presentDays: 0, totalOvertimeHours: 0 };
    const workingDays = endDate.getDate(); // Total days in month
    
    // Calculate overtime pay (assuming 1.5x hourly rate)
    const hourlyRate = employee.baseSalary / (workingDays * 8); // Assuming 8 hours per day
    const overtimePay = attendance.totalOvertimeHours * hourlyRate * 1.5;

    const bonus = parseFloat(payrollData.bonus) || 0;
    const deductions = parseFloat(payrollData.deductions) || 0;
    const totalSalary = employee.baseSalary + bonus + overtimePay - deductions;

    const payroll: Omit<Payroll, '_id'> = {
      employeeId: new ObjectId(payrollData.employeeId),
      employeeName: employee.name,
      month: payrollData.month,
      year: payrollData.year,
      baseSalary: employee.baseSalary,
      bonus,
      deductions,
      totalSalary,
      workingDays,
      presentDays: attendance.presentDays,
      overtimeHours: attendance.totalOvertimeHours,
      overtimePay,
      status: 'draft',
      companyId: companyId,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: new ObjectId(session.userId),
    };

    const result = await db.collection<Payroll>('payrolls').insertOne(payroll);

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (error) {
    console.error('Create payroll API error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}