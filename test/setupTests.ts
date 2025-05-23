import { vi } from 'vitest';

const mockStorage = (() => {
  let store: Record<string, string> = {};

  return {
    get length() {
      return Object.keys(store).length;
    },
    key(index: number) {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    getItem(key: string) {
      return store[key] || null;
    },
    setItem(key: string, value: string) {
      store[key] = value;
    },
    removeItem(key: string) {
      delete store[key];
    },
    clear() {
      store = {};
    },
  };
})();

// Example of assigning to window.localStorage in your test setup:
Object.defineProperty(window, 'localStorage', {
  value: mockStorage,
});

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
  product: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
  },
  productVariant: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
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
