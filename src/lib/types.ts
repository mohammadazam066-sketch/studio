
import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'homeowner' | 'shop-owner';

export type User = {
  id: string;
  username: string;
  email: string; 
  password?: string; 
  role: UserRole;
};

export type Requirement = {
  id: string;
  homeownerId: string;
  homeownerName: string;
  title: string;
  category: string;
  location: string;
  photos: string[];
  description: string;
  createdAt: Timestamp | Date | string;
  status: 'Open' | 'Purchased';
};

export type Quotation = {
  id:string;
  requirementId: string;
  shopOwnerId: string;
  shopOwnerName: string;
  shopName: string;
  shopOwnerEmail: string;
  shopOwnerPhone: string;
  amount: number;
  terms: string;
  deliveryDate: Timestamp | Date | string;
  createdAt: Timestamp | Date | string;
};

export type ShopOwnerProfile = {
  id: string; // Corresponds to user.uid
  username: string;
  shopName: string;
  phoneNumber: string;
  address: string;
  location: string;
  shopPhotos: string[];
};
