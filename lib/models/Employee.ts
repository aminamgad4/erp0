import { ObjectId } from 'mongodb';

export interface Employee {
  _id?: ObjectId;
  employeeId: string;
  userId?: ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: Date;
  hireDate: Date;
  terminationDate?: Date;
  companyId: ObjectId;
  departmentId: ObjectId;
  positionId: ObjectId;
  salary: number;
  salaryType: 'monthly' | 'hourly' | 'daily';
  workingHours: number;
  status: 'active' | 'inactive' | 'terminated';
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  documents: {
    idNumber: string;
    passportNumber?: string;
    workPermit?: string;
  };
  bankDetails: {
    bankName: string;
    accountNumber: string;
    iban?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId;
}

export interface Department {
  _id?: ObjectId;
  name: string;
  nameAr: string;
  description?: string;
  companyId: ObjectId;
  managerId?: ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Position {
  _id?: ObjectId;
  title: string;
  titleAr: string;
  description?: string;
  departmentId: ObjectId;
  companyId: ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attendance {
  _id?: ObjectId;
  employeeId: ObjectId;
  companyId: ObjectId;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  breakStart?: Date;
  breakEnd?: Date;
  totalHours: number;
  overtimeHours: number;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'holiday';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}