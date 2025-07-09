import { ObjectId } from 'mongodb';

export interface InvoiceLineItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
  total: number;
}

export interface Invoice {
  _id?: ObjectId;
  invoiceNumber: string;
  customerId: ObjectId;
  customerName: string;
  customerEmail: string;
  companyId: ObjectId;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  totalTax: number;
  grandTotal: number;
  status: 'paid' | 'partially_paid' | 'unpaid';
  paidAmount: number;
  remainingAmount: number;
  issueDate: Date;
  dueDate: Date;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId;
}

export interface InvoiceFormData {
  customerId: string;
  lineItems: InvoiceLineItem[];
  dueDate: string;
  notes: string;
}

export interface PaymentRecord {
  _id?: ObjectId;
  invoiceId: ObjectId;
  amount: number;
  paymentDate: Date;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'check' | 'other';
  notes?: string;
  companyId: ObjectId;
  createdAt: Date;
  createdBy: ObjectId;
}