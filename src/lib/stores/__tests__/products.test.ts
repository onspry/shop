import { describe, it, expect, beforeEach } from 'vitest';
import {
  products,
  variants,
  selectedProduct,
  setProducts,
  setVariants,
  addProduct,
  addVariants,
  selectProduct,
  getProductsByCategory,
  setImages,
  getProductImages,
  loadKeyboardWithAccessories,
  isKeyboardLoaded
} from '../products';
import { get } from 'svelte/store';

// Mock data
const mockProduct = (
  id: string,
  category = 'KEYBOARD',
  isAccessory = false
): import('$lib/models/product').ProductViewModel => ({
  id,
  name: `Product ${id}`,
  description: 'A test product',
  category,
  features: [],
  specifications: {},
  images: [],
  variants: [],
  isAccessory,
  slug: `product-${id}`,
  createdAt: new Date(0),
  updatedAt: new Date(0)
});
const mockVariant = (id: string): import('$lib/models/product').ProductVariantViewModel => ({
  id,
  name: `Variant ${id}`,
  sku: `SKU-${id}`,
  price: 100,
  stock_quantity: 10,
  attributes: {},
  stockStatus: 'in_stock',
  productId: 'product-' + id,
  createdAt: new Date(0),
  updatedAt: new Date(0)
});
const mockImage = (productId: string, position = 1) => ({
  id: `${productId}-img`,
  productId,
  url: `/img/${productId}.jpg`,
  alt: `Image for product ${productId}`,
  position
});

describe('products store', () => {
  beforeEach(() => {
    setProducts([]);
    setVariants([]);
    setImages([]);
  });

  it('sets and gets products', () => {
    setProducts([mockProduct('p1'), mockProduct('p2', 'KEYCAP')]);
    expect(get(products)).toHaveLength(2);
  });

  it('adds a product (no duplicates)', () => {
    setProducts([mockProduct('p1')]);
    addProduct(mockProduct('p2'));
    addProduct(mockProduct('p1'));
    expect(get(products)).toHaveLength(2);
  });

  it('sets and gets variants', () => {
    setVariants([mockVariant('v1')]);
    expect(get(variants)).toHaveLength(1);
    addVariants([mockVariant('v2'), mockVariant('v1')]);
    expect(get(variants)).toHaveLength(2);
  });

  it('selects a product', () => {
    setProducts([mockProduct('p1'), mockProduct('p2')]);
    selectProduct('p2');
    expect(get(selectedProduct)?.id).toBe('p2');
  });

  it('gets products by category', () => {
    setProducts([
      mockProduct('p1', 'KEYBOARD'),
      mockProduct('p2', 'KEYCAP'),
      mockProduct('p3', 'KEYBOARD')
    ]);
    const keyboards = getProductsByCategory('KEYBOARD');
    expect(keyboards).toHaveLength(2);
    const keycaps = getProductsByCategory('KEYCAP');
    expect(keycaps).toHaveLength(1);
  });

  it('sets and gets images', () => {
    setImages([mockImage('p1'), mockImage('p2')]);
    const imgs = getProductImages('p1');
    expect(imgs).toHaveLength(1);
    expect(imgs[0].productId).toBe('p1');
  });

  it('loadKeyboardWithAccessories deduplicates and tracks loaded', () => {
    const keyboard = mockProduct('kb1', 'KEYBOARD');
    const keyboardVariants = [mockVariant('kbv1')];
    const accessories = [mockProduct('acc1', 'ACCESSORY', true)];
    const accessoryVariants = [mockVariant('accv1')];
    loadKeyboardWithAccessories(keyboard, keyboardVariants, accessories, accessoryVariants);
    expect(get(products).find(p => p.id === 'kb1')).toBeTruthy();
    expect(get(products).find(p => p.id === 'acc1')).toBeTruthy();
    expect(get(variants)).toHaveLength(2);
    expect(isKeyboardLoaded('kb1')).toBe(true);
    // Should not duplicate if called again
    loadKeyboardWithAccessories(keyboard, keyboardVariants, accessories, accessoryVariants);
    expect(get(products)).toHaveLength(2);
    expect(get(variants)).toHaveLength(2);
  });
});
