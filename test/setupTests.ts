import { vi } from 'vitest';

// Mock Prisma instance
export const mockPrismaInstance = {
  cart: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  cartItem: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  productVariant: {
    findUnique: vi.fn(),
  },
  order: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  orderItem: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  orderStatusHistory: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  orderAddress: {
    create: vi.fn(),
  },
  paymentTransaction: {
    create: vi.fn(),
    findMany: vi.fn()
  },
  refund: {
    create: vi.fn(),
  },
  inventoryTransaction: {
    create: vi.fn(),
  },
  $transaction: vi.fn((callback) => callback(mockPrismaInstance)),
};

// Mock the CartCache
export const mockCartCache = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
  clear: vi.fn(),
};

// Type for the mock Prisma instance
export type MockPrisma = typeof mockPrismaInstance;

// Mock the PrismaClient constructor
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrismaInstance),
}));
