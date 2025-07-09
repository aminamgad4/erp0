import { NextRequest, NextResponse } from 'next/server';
import { getSession, checkModuleAccess } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';
import { Attendance } from '@/lib/models/HR';
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
    const employeeId = searchParams.get('employeeId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const db = await getDb();
    
    // Build query filter
    let filter: any = {};

    // Add company filter for non-super-admin users
    if (session.role !== 'super-admin' && session.companyId) {
      filter.companyId = new ObjectId(session.companyId);
    }

    // Add employee filter if specified
    if (employeeId) {
      filter.employeeId = new ObjectId(employeeId);
    }

    // Add date filter if specified
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      filter.date = {
        $gte: startDate,
        $lte: endDate
      };
    }

    const attendance = await db.collection<Attendance>('attendance')
      .aggregate([
        { $match: filter },
        {
          $lookup: {
            from: 'employees',
            localField: 'employeeId',
            foreignField: '_id',
            as: 'employee'
          }
        },
        {
          $addFields: {
            employeeName: { $arrayElemAt: ['$employee.name', 0] },
            employeeCode: { $arrayElemAt: ['$employee.employeeId', 0] }
          }
        },
        {
          $project: {
            employee: 0
          }
        },
        {
          $sort: { date: -1 }
        }
      ])
      .toArray();

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Get attendance API error:', error);
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

    const attendanceData = await request.json();
    
    // Validate required fields
    if (!attendanceData.employeeId || !attendanceData.date) {
      return NextResponse.json(
        { success: false, message: 'يجب اختيار الموظف والتاريخ' },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    const companyId = session.role === 'super-admin' && attendanceData.companyId 
      ? new ObjectId(attendanceData.companyId)
      : new ObjectId(session.companyId!);

    // Check if attendance record already exists for this employee and date
    const existingAttendance = await db.collection<Attendance>('attendance').findOne({
      employeeId: new ObjectId(attendanceData.employeeId),
      date: new Date(attendanceData.date),
      companyId: companyId
    });

    if (existingAttendance) {
      return NextResponse.json(
        { success: false, message: 'يوجد سجل حضور لهذا الموظف في هذا التاريخ بالفعل' },
        { status: 400 }
      );
    }

    // Calculate total hours and overtime
    let totalHours = 0;
    let overtimeHours = 0;

    if (attendanceData.checkIn && attendanceData.checkOut && attendanceData.status === 'present') {
      const checkIn = new Date(`${attendanceData.date}T${attendanceData.checkIn}`);
      const checkOut = new Date(`${attendanceData.date}T${attendanceData.checkOut}`);
      
      totalHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
      
      // Calculate overtime (assuming 8 hours is standard)
      if (totalHours > 8) {
        overtimeHours = totalHours - 8;
      }
    }

    const attendance: Omit<Attendance, '_id'> = {
      employeeId: new ObjectId(attendanceData.employeeId),
      date: new Date(attendanceData.date),
      checkIn: attendanceData.checkIn ? new Date(`${attendanceData.date}T${attendanceData.checkIn}`) : undefined,
      checkOut: attendanceData.checkOut ? new Date(`${attendanceData.date}T${attendanceData.checkOut}`) : undefined,
      totalHours,
      overtimeHours,
      status: attendanceData.status || 'present',
      notes: attendanceData.notes?.trim() || '',
      companyId: companyId,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: new ObjectId(session.userId),
    };

    const result = await db.collection<Attendance>('attendance').insertOne(attendance);

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (error) {
    console.error('Create attendance API error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}