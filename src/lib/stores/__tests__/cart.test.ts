import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { createCartStore } from '../cart';

describe('cart store', () => {
  const mockCartItem = {
    id: 'item-1',
    variantId: 'variant-1',
    name: 'Test Product',
    price: 100,
    quantity: 1,
    imageUrl: '',
    composites: [],
    variant: {
      id: 'variant-1',
      name: 'Test Variant',
      price: 100,
      sku: 'TEST-SKU',
      stock_quantity: 10,
      attributes: {},
      stockStatus: 'in_stock',
      productId: 'product-1',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  };

  const mockInitialCart = {
    id: '',
    items: [],
    discountCode: null,
    discountAmount: 0,
    subtotal: 0,
    total: 0,
    itemCount: 0
  };

  let cartStore: ReturnType<typeof createCartStore>;

  beforeEach(() => {
    // Clear localStorage before each test
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
    cartStore = createCartStore();
  });

  it('should initialize with empty cart', () => {
    const cart = get(cartStore);
    expect(cart).toEqual(mockInitialCart);
  });

  it('should add item to cart', () => {
    cartStore.addItem({
      ...mockCartItem,
      imageUrl: '',
      composites: [],
      variant: {
        id: 'variant-1',
        name: 'Test Variant',
        price: 100,
        sku: 'TEST-SKU',
        stock_quantity: 10,
        attributes: {},
        stockStatus: 'in_stock',
        productId: 'product-1',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    const cart = get(cartStore);

    expect(cart.items).toHaveLength(1);
    expect(cart.itemCount).toBe(1);
    expect(cart.items[0].variant.sku).toEqual(mockCartItem.variant.sku);
  });

  it('should not add duplicate items', () => {
    cartStore.addItem({
      ...mockCartItem,
      imageUrl: '',
      composites: [],
      variant: {
        id: 'variant-1',
        name: 'Test Variant',
        price: 100,
        sku: 'TEST-SKU',
        stock_quantity: 10,
        attributes: {},
        stockStatus: 'in_stock',
        productId: 'product-1',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    cartStore.addItem({
      ...mockCartItem,
      imageUrl: '',
      composites: [],
      variant: {
        id: 'variant-1',
        name: 'Test Variant',
        price: 100,
        sku: 'TEST-SKU',
        stock_quantity: 10,
        attributes: {},
        stockStatus: 'in_stock',
        productId: 'product-1',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    const cart = get(cartStore);
    expect(cart.items).toHaveLength(1);
    expect(cart.itemCount).toBe(1);
  });

  it('should remove item from cart', () => {
    cartStore.addItem({
      ...mockCartItem,
      imageUrl: '',
      composites: [],
      variant: {
        id: 'variant-1',
        name: 'Test Variant',
        price: 100,
        sku: 'TEST-SKU',
        stock_quantity: 10,
        attributes: {},
        stockStatus: 'in_stock',
        productId: 'product-1',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    cartStore.removeItem(mockCartItem.id);

    const cart = get(cartStore);
    expect(cart.items).toHaveLength(0);
    expect(cart.itemCount).toBe(0);
  });

  it('should update item quantity', () => {
    cartStore.addItem({
      ...mockCartItem,
      imageUrl: '',
      composites: [],
      variant: {
        id: 'variant-1',
        name: 'Test Variant',
        price: 100,
        sku: 'TEST-SKU',
        stock_quantity: 10,
        attributes: {},
        stockStatus: 'in_stock',
        productId: 'product-1',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    cartStore.updateQuantity(mockCartItem.id, 3);

    const cart = get(cartStore);
    expect(cart.items[0].quantity).toBe(3);
  });

  it('should clear cart', () => {
    cartStore.addItem({
      ...mockCartItem,
      imageUrl: '',
      composites: [],
      variant: {
        id: 'variant-1',
        name: 'Test Variant',
        price: 100,
        sku: 'TEST-SKU',
        stock_quantity: 10,
        attributes: {},
        stockStatus: 'in_stock',
        productId: 'product-1',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    cartStore.clear();

    const cart = get(cartStore);
    expect(cart).toEqual(mockInitialCart);
  });

  it('should persist cart data to localStorage', () => {
    if (typeof window === 'undefined') return;

    cartStore.addItem({
      ...mockCartItem,
      imageUrl: '',
      composites: [],
      variant: {
        id: 'variant-1',
        name: 'Test Variant',
        price: 100,
        sku: 'TEST-SKU',
        stock_quantity: 10,
        attributes: {},
        stockStatus: 'in_stock',
        productId: 'product-1',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    const storedData = localStorage.getItem('cart_data');
    expect(storedData).toBeTruthy();

    const parsedData = JSON.parse(storedData!);
    expect(parsedData.items).toHaveLength(1);
    expect(parsedData.items[0].variant.sku).toEqual(mockCartItem.variant.sku);
  });

  it('should load persisted cart data from localStorage', () => {
    if (typeof window === 'undefined') return;

    const persistedCart = {
      ...mockInitialCart,
      items: [mockCartItem],
      itemCount: 1
    };

    localStorage.setItem('cart_data', JSON.stringify(persistedCart));

    const newCartStore = createCartStore();
    const cart = get(newCartStore);

    expect(cart.items).toHaveLength(1);
    expect(cart.itemCount).toBe(1);
    expect(cart.items[0].id).toEqual(mockCartItem.id);
  });

  it('should handle invalid localStorage data', () => {
    if (typeof window === 'undefined') return;

    localStorage.setItem('cart_data', 'invalid json');

    const newCartStore = createCartStore();
    const cart = get(newCartStore);

    expect(cart).toEqual(mockInitialCart);
  });
});
