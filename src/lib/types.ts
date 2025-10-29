

import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'homeowner' | 'shop-owner' | 'admin';

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
  shopIconUrl?: string;
  createdAt?: Timestamp | Date | string;
};
export type HomeownerProfile = {
    id: string;
    name: string;
    phoneNumber: string;
    address?: string;
    occupation?: string;
    photoURL?: string;
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

export type HardwareDetail = {
  id: string; // e.g., 'PP Rope'
  details: string; // e.g., '5 kg'
}

export type ElectricalDetail = {
    id: string;
    quantity: number;
}

export type Requirement = {
  id: string;
  homeownerId: string;
  homeownerName: string;
  title: string;
  category: string;
  location: string;
  address: string;
  photos: string[];
  description: string;
  createdAt: Timestamp | Date | string;
  status: 'Open' | 'Purchased' | 'Deleted';
  purchaseId?: string; // Link to the purchase document
  quotationId?: string; // Link to the winning quotation document
  brands?: BrandSelection[];
  flexibleBrand?: boolean;
  steelDetails?: SteelDetail[];
  steelBrands?: string[];
  flexibleSteelBrand?: boolean;
  sandAndAggregateDetails?: string[];
  customSandAndAggregate?: string;
  hardwareDetails?: HardwareDetail[];
  electricalDetails?: ElectricalDetail[];
  electricalBrands?: string[];
  flexibleElectricalBrand?: boolean;
};

export type Quotation = {
  id:string;
  requirementId: string;
  shopOwnerId: string;
  shopOwnerName: string;
  shopName: string;
  materialAmount: number;
  transportationCharges?: number;
  totalAmount: number;
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
  authorRole: UserRole | 'guest';
  title: string;
  content: string;
  imageUrls?: string[];
  createdAt: Timestamp | Date | string;
  status?: 'Published' | 'Deleted';
};

export type Purchase = {
    id: string;
    requirementId: string;
    homeownerId: string;
    shopOwnerId: string;
    quotationId: string;
    amount: number;
    material: string;
    homeownerName: string;
    shopOwnerName: string;
    status: 'Open' | 'Purchased';
    createdAt: Timestamp | Date | string;
}

export type PurchaseWithDetails = Purchase & {
  requirement?: Requirement;
  quotation?: Quotation;
  homeowner?: HomeownerProfile;
  shopOwner?: ShopOwnerProfile;
}

export type Notification = {
    id: string;
    userId: string; // The user who should receive the notification
    message: string;
    link: string;
    createdAt: Timestamp;
    read: boolean;
    type: 'quote' | 'admin_update' | 'requirement' | 'purchase';
};

export type Review = {
    id: string;
    shopOwnerId: string;
    customerId: string; // homeowner's ID
    customerName: string;
    customerPhotoURL?: string;
    purchaseId: string;
    rating: number; // 1-5
    comment: string;
    createdAt: Timestamp;
}

