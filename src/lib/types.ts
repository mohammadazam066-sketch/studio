
import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'homeowner' | 'shop-owner';

// User types are no longer needed as auth is removed
// but kept for potential future use to avoid breaking other types.
export type User = {
  id: string;
  username: string;
  email: string; 
  password?: string; 
  role: UserRole;
  profile?: HomeownerProfile | ShopOwnerProfile;
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
export type HomeownerProfile = {
    id: string;
    username: string;
    email: string;
    phoneNumber?: string;
    address?: string;
}


export type Requirement = {
  id: string;
  homeownerId: string; // Kept for data structure, but will be a dummy value
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
  shopOwnerId: string; // Kept for data structure, but will be a dummy value
  shopOwnerName: string;
  shopName: string;
  amount: number;
  terms: string;
  deliveryDate: Timestamp | Date | string;
  createdAt: Timestamp | Date | string;
};

export type Update = {
  id: string;
  authorId: string; // Kept for data structure, but will be a dummy value
  authorName: string;
  authorRole: UserRole;
  title: string;
  content: string;
  imageUrl?: string;
  createdAt: Timestamp | Date | string;
};
