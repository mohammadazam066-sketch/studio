export type UserRole = 'homeowner' | 'shop-owner';

export type User = {
  id: string;
  name: string;
  email: string;
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
  createdAt: Date;
  status: 'Open' | 'Purchased';
};

export type Quotation = {
  id: string;
  requirementId: string;
  shopOwnerId: string;
  shopOwnerName: string;
  amount: number;
  terms: string;
  deliveryDate: Date;
  createdAt: Date;
};
