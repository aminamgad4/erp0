import { ObjectId } from 'mongodb';

export interface Product {
  _id?: ObjectId;
  name: string;
  sku: string;
  category: string;
  unit: string;
  quantity: number;
  purchasePrice: number;
  salePrice: number;
  lowStockAlert: number;
  description?: string;
  companyId: ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId;
}

export interface ProductFormData {
  name: string;
  sku: string;
  category: string;
  unit: string;
  quantity: number;
  purchasePrice: number;
  salePrice: number;
  lowStockAlert: number;
  description: string;
}

export interface StockMovement {
  _id?: ObjectId;
  productId: ObjectId;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  notes?: string;
  companyId: ObjectId;
  createdAt: Date;
  createdBy: ObjectId;
}