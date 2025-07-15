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
    id: 'req-4',
    homeownerId: 'user-1',
    homeownerName: 'Alice Johnson',
    title: 'New brick wall for garden',
    category: 'Bricks',
    location: 'San Jose, CA',
    photos: ['https://placehold.co/600x400.png', 'https://placehold.co/600x400.png'],
    description: 'We need a new brick wall built at the end of our garden. The dimensions are 10 meters long and 2 meters high. Please provide a quote for labor and materials.',
    createdAt: new Date('2023-11-01T11:00:00Z'),
    status: 'Open',
  },
  {
    id: 'req-5',
    homeownerId: 'user-3',
    homeownerName: 'Charlie Davis',
    title: 'Foundation work for new extension',
    category: 'Cements',
    location: 'Berkeley, CA',
    photos: ['https://placehold.co/600x400.png'],
    description: 'We are planning a home extension and need a quote for the cement foundation work. The area is approximately 20 square meters.',
    createdAt: new Date('2023-11-02T09:30:00Z'),
    status: 'Open',
  },
  {
    id: 'req-6',
    homeownerId: 'user-1',
    homeownerName: 'Alice Johnson',
    title: 'Steel beams for loft conversion',
    category: 'Steel',
    location: 'San Francisco, CA',
    photos: ['https://placehold.co/600x400.png'],
    description: 'We require structural steel beams for a loft conversion project. Please quote for supply and delivery of specified beams.',
    createdAt: new Date('2023-11-03T16:00:00Z'),
    status: 'Open',
  },
];

export const quotations: Quotation[] = [
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
