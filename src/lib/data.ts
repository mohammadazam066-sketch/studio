import type { User, Requirement, Quotation } from './types';

export const users: User[] = [
  { id: 'user-1', name: 'Alice Johnson', email: 'alice@example.com', role: 'homeowner' },
  { id: 'user-2', name: 'Bob\'s Builders', email: 'bob@example.com', role: 'shop-owner' },
  { id: 'user-3', name: 'Charlie Davis', email: 'charlie@example.com', role: 'homeowner' },
  { id: 'user-4', name: 'Plumb Perfect', email: 'plumb@example.com', role: 'shop-owner' },
  { id: 'user-5', name: 'Elec Solutions', email: 'elec@example.com', role: 'shop-owner' },
];

export const requirements: Requirement[] = [
  {
    id: 'req-1',
    homeownerId: 'user-1',
    homeownerName: 'Alice Johnson',
    title: 'Leaky Kitchen Faucet Repair',
    category: 'Plumbing',
    location: 'San Francisco, CA',
    photos: ['https://placehold.co/600x400.png', 'https://placehold.co/600x400.png'],
    description: 'The faucet in my kitchen sink is constantly dripping. It seems to be coming from the base. I need a professional to diagnose and fix the issue. The faucet is a standard model.',
    createdAt: new Date('2023-10-26T10:00:00Z'),
    status: 'Open',
  },
  {
    id: 'req-2',
    homeownerId: 'user-3',
    homeownerName: 'Charlie Davis',
    title: 'Install New Ceiling Fan in Living Room',
    category: 'Electrical',
    location: 'Oakland, CA',
    photos: ['https://placehold.co/600x400.png'],
    description: 'I have purchased a new ceiling fan and need it installed in my living room. The previous fixture was a simple light, so new wiring/bracing might be needed in the ceiling.',
    createdAt: new Date('2023-10-25T14:30:00Z'),
    status: 'Purchased',
  },
  {
    id: 'req-3',
    homeownerId: 'user-1',
    homeownerName: 'Alice Johnson',
    title: 'Build Custom Bookshelves for Study',
    category: 'Carpentry',
    location: 'San Francisco, CA',
    photos: ['https://placehold.co/600x400.png', 'https://placehold.co/600x400.png', 'https://placehold.co/600x400.png'],
    description: 'Looking for a skilled carpenter to build and install floor-to-ceiling bookshelves on a 12-foot wall in my study. I have a design in mind and prefer oak wood.',
    createdAt: new Date('2023-10-24T09:00:00Z'),
    status: 'Open',
  },
];

export const quotations: Quotation[] = [
  {
    id: 'quote-1',
    requirementId: 'req-1',
    shopOwnerId: 'user-4',
    shopOwnerName: 'Plumb Perfect',
    amount: 150,
    terms: 'Includes initial assessment, replacement of washer and O-rings. Any additional parts will be extra. 50% upfront, 50% on completion.',
    deliveryDate: new Date('2023-10-28T17:00:00Z'),
    createdAt: new Date('2023-10-26T11:00:00Z'),
  },
  {
    id: 'quote-2',
    requirementId: 'req-2',
    shopOwnerId: 'user-5',
    shopOwnerName: 'Elec Solutions',
    amount: 350,
    terms: 'Covers installation of customer-provided fan, new electrical box, and switch. Does not include patching/painting of drywall. Full payment upon completion.',
    deliveryDate: new Date('2023-10-27T17:00:00Z'),
    createdAt: new Date('2023-10-25T15:00:00Z'),
  },
  {
    id: 'quote-3',
    requirementId: 'req-2',
    shopOwnerId: 'user-2',
    shopOwnerName: 'Bob\'s Builders',
    amount: 400,
    terms: 'Full service installation including any necessary bracing, wiring, and minor drywall repair. We guarantee a clean and professional installation.',
    deliveryDate: new Date('2023-10-29T17:00:00Z'),
    createdAt: new Date('2023-10-25T16:00:00Z'),
  },
];
