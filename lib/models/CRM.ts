import { ObjectId } from 'mongodb';

export interface Contact {
  _id?: ObjectId;
  name: string;
  phone: string;
  email: string;
  address: string;
  type: 'customer' | 'supplier';
  notes?: string;
  balance: number;
  companyId: ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId;
}

export interface ContactFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  type: 'customer' | 'supplier';
  notes: string;
  balance: number;
}