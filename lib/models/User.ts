import { ObjectId } from 'mongodb';

export interface ModuleAccess {
  crm: boolean;
  hr: boolean;
  inventory: boolean;
  sales: boolean;
}

export interface User {
  _id?: ObjectId;
  email: string;
  password: string;
  name: string;
  role: 'super-admin' | 'owner' | 'staff';
  companyId?: ObjectId;
  modules: ModuleAccess;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export const defaultModuleAccess: ModuleAccess = {
  crm: false,
  hr: false,
  inventory: false,
  sales: false,
};

export const superAdminModuleAccess: ModuleAccess = {
  crm: true,
  hr: true,
  inventory: true,
  sales: true,
};