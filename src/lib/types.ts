

import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'homeowner' | 'shop-owner';

export type User = {
  id: string;
  phoneNumber: string;
  role: UserRole;
  profile?: HomeownerProfile | ShopOwnerProfile;
  createdAt: Timestamp | Date | string;
};
export type ShopOwnerProfile = {
  id: string; // Corresponds to user.uid
  name: string;
  phoneNumber: string;
  shopName: string;
  address: string;
  location: string;
  shopPhotos: string[];
  createdAt?: Timestamp | Date | string;
};
export type HomeownerProfile = {
    id: string;
    name: string;
    phoneNumber: string;
    address?: string;
    createdAt?: Timestamp | Date | string;
}

type BrandSelection = {
  id: string;
  quantity?: number;
}

export type SteelDetail = {
  size: string;
  quantity: number;
}

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
  brands?: BrandSelection[];
  flexibleBrand?: boolean;
  steelDetails?: SteelDetail[];
  steelBrands?: string[];
  flexibleSteelBrand?: boolean;
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
};

export type QuotationWithRequirement = Quotation & {
    requirement?: Requirement;
}

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

    
