import { ObjectId } from 'mongodb';

export interface Employee {
  _id?: ObjectId;
  employeeId: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  department: string;
  baseSalary: number;
  hireDate: Date;
  status: 'active' | 'inactive' | 'terminated';
  companyId: ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId;
}

export interface EmployeeFormData {
  name: string;
  phone: string;
  email: string;
  role: string;
  department: string;
  baseSalary: number;
  hireDate: string;
  status: 'active' | 'inactive' | 'terminated';
}

export interface Attendance {
  _id?: ObjectId;
  employeeId: ObjectId;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  totalHours: number;
  overtimeHours: number;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'holiday';
  notes?: string;
  companyId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId;
}

export interface AttendanceFormData {
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'holiday';
  notes: string;
}

export interface Payroll {
  _id?: ObjectId;
  employeeId: ObjectId;
  employeeName: string;
  month: number;
  year: number;
  baseSalary: number;
  bonus: number;
  deductions: number;
  totalSalary: number;
  workingDays: number;
  presentDays: number;
  overtimeHours: number;
  overtimePay: number;
  status: 'draft' | 'approved' | 'paid';
  companyId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId;
}

export interface PayrollFormData {
  employeeId: string;
  month: number;
  year: number;
  bonus: number;
  deductions: number;
}