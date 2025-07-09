import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session.isLoggedIn) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح بالوصول' },
        { status: 401 }
      );
    }

    const db = await getDb();
    
    // Build query filter based on user role
    let companyFilter = {};
    if (session.role !== 'super-admin' && session.companyId) {
      companyFilter = { companyId: new ObjectId(session.companyId) };
    }

    // Get stats from different collections
    const [customers, products, employees, salesData] = await Promise.all([
      // Customers count
      db.collection('customers').countDocuments({
        ...companyFilter,
        isActive: true
      }),
      
      // Products count
      db.collection('products').countDocuments({
        ...companyFilter,
        isActive: true
      }),
      
      // Employees count
      db.collection('users').countDocuments({
        ...companyFilter,
        isActive: true,
        role: { $ne: 'super-admin' }
      }),
      
      // Sales data for current month
      db.collection('sales').aggregate([
        {
          $match: {
            ...companyFilter,
            createdAt: {
              $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$total' }
          }
        }
      ]).toArray()
    ]);

    const stats = {
      customers,
      products,
      employees,
      sales: salesData.length > 0 ? salesData[0].total : 0
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Dashboard stats API error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}