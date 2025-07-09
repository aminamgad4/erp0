import { ObjectId } from 'mongodb';

export interface Sale {
  _id?: ObjectId;
  invoiceNumber: string;
  customerId: ObjectId;
  companyId: ObjectId;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'draft' | 'pending' | 'paid' | 'cancelled' | 'refunded';
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'check' | 'other';
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue';
  dueDate?: Date;
  paidDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId;
}

export interface SaleItem {
  productId: ObjectId;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  discount: number;
  total: number;
}

export interface Invoice {
  _id?: ObjectId;
  invoiceNumber: string;
  saleId?: ObjectId;
  customerId: ObjectId;
  companyId: ObjectId;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  paidDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
  total: number;
}