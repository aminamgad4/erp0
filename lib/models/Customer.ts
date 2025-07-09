import { ObjectId } from 'mongodb';

export interface Customer {
  _id?: ObjectId;
  name: string;
  email: string;
  phone: string;
  address?: string;
  company?: string;
  companyId: ObjectId;
  status: 'active' | 'inactive' | 'prospect';
  source: string;
  notes?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  createdBy: ObjectId;
}

export interface Lead {
  _id?: ObjectId;
  name: string;
  email: string;
  phone: string;
  company?: string;
  companyId: ObjectId;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  source: string;
  value?: number;
  probability?: number;
  expectedCloseDate?: Date;
  notes?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  assignedTo: ObjectId;
  createdBy: ObjectId;
}