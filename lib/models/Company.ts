import { ObjectId } from 'mongodb';

export interface Company {
  _id?: ObjectId;
  name: string;
  nameAr: string;
  email: string;
  phone: string;
  address: string;
  addressAr: string;
  industry: string;
  industryAr: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  ownerId?: ObjectId;
}