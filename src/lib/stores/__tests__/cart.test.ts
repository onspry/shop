import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { get } from 'svelte/store';
import {
  cart,
  isLoading,
  addToCart,
  updateCartItem,
  removeCartItem,
  applyDiscount,
  removeDiscount,
  clearCart,
  resetCartStore,
  updateCartFromPageData
} from '../cart';

// Mock fetch and invalidateAll
vi.mock('$app/navigation', () => ({ invalidateAll: vi.fn() }));
globalThis.fetch = vi.fn();

const mockCart = {
  id: 'mock-cart',
  items: [
    { id: 'item-1', productVariantId: 'pv-1', quantity: 2, name: 'Item 1', price: 100 }
  ],
  discountCode: null,
  discountAmount: 0,
  subtotal: 200,
  total: 200,
  itemCount: 2
};

describe('cart store', () => {
  beforeEach(() => {
    resetCartStore();
    vi.clearAllMocks();
  });

  it('should have correct initial state', () => {
    expect(get(cart)).toEqual({
      id: '',
      items: [],
      discountCode: null,
      discountAmount: 0,
      subtotal: 0,
      total: 0,
      itemCount: 0
    });
    expect(get(isLoading)).toBe(false);
  });

  it('should update cart from page data', () => {
    updateCartFromPageData({ cart: mockCart });
    expect(get(cart)).toEqual(mockCart);
  });

  it('should reset cart store', () => {
    updateCartFromPageData({ cart: mockCart });
    resetCartStore();
    expect(get(cart)).toEqual({
      id: '',
      items: [],
      discountCode: null,
      discountAmount: 0,
      subtotal: 0,
      total: 0,
      itemCount: 0
    });
  });

  it('should handle addToCart success', async () => {
    (fetch as unknown as Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    const result = await addToCart('pv-1', 2);
    expect(result.success).toBe(true);
    expect(get(isLoading)).toBe(false);
  });

  it('should handle addToCart error', async () => {
    (fetch as unknown as Mock).mockResolvedValueOnce({ ok: false, json: async () => ({ message: 'fail' }) });
    const result = await addToCart('pv-1', 2);
    expect(result.success).toBe(false);
    expect(result.error).toBe('fail');
    expect(get(isLoading)).toBe(false);
  });

  it('should handle updateCartItem', async () => {
    (fetch as unknown as Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    const result = await updateCartItem('item-1', 5);
    expect(result.success).toBe(true);
  });

  it('should handle removeCartItem', async () => {
    (fetch as unknown as Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    const result = await removeCartItem('item-1');
    expect(result.success).toBe(true);
  });

  it('should handle applyDiscount', async () => {
    (fetch as unknown as Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    const result = await applyDiscount('CODE');
    expect(result.success).toBe(true);
  });

  it('should handle removeDiscount', async () => {
    (fetch as unknown as Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    const result = await removeDiscount();
    expect(result.success).toBe(true);
  });

  it('should handle clearCart', async () => {
    (fetch as unknown as Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    const result = await clearCart();
    expect(result.success).toBe(true);
  });
});
