
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
  amount: number;
  terms: string;
  deliveryDate: Timestamp | Date | string;
  createdAt: Timestamp | Date | string;
  ownerProfile: {
    email: string;
    phoneNumber: string;
  }
};

export type ShopOwnerProfile = {
  id: string; // Corresponds to user.uid
  username: string;
  email: string;
  shopName: string;
  phoneNumber: string;
  address: string;
  location: string;
  shopPhotos: string[];
};

export type Update = {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  title: string;
  content: string;
  imageUrl?: string;
  createdAt: Timestamp | Date | string;
};

export type Notification = {
  id: string;
  userId: string; // The user to be notified
  message: string;
  link: string; // A URL to navigate to when the notification is clicked
  read: boolean;
  createdAt: Timestamp | Date | string;
};
