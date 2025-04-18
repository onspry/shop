import type { CartViewModel } from '$lib/models/cart';
import type { OrderItemViewModel } from '$lib/models/order';
import type { UserViewModel } from '$lib/models/user';
import type { CheckoutState } from '$lib/stores/checkout';

/**
 * Creates a mock cart for testing
 */
export function createMockCart(overrides: Partial<CartViewModel> = {}): CartViewModel {
  return {
    id: '00000000-0000-0000-0000-000000000000',
    items: [
      {
        id: 'item-1',
        quantity: 1,
        price: 1000,
        composites: [],
        imageUrl: 'test-image.jpg',
        variant: {
          id: '22222222-2222-2222-2222-222222222222',
          name: 'Test Product',
          price: 1000,
          sku: 'TEST-SKU',
          stockStatus: 'in_stock',
          stock_quantity: 10,
          productId: '11111111-1111-1111-1111-111111111111',
          attributes: {
            image: 'test-image.jpg',
            color: 'Red',
            size: 'Medium'
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
    ],
    subtotal: 1000,
    total: 1000,
    itemCount: 1,
    discountCode: null,
    discountAmount: 0,
    ...overrides
  };
}

/**
 * Creates mock checkout state for testing
 */
export function createMockCheckoutState(overrides: Partial<CheckoutState> = {}): CheckoutState {
  return {
    email: 'test@example.com',
    shippingConfig: {
      firstName: 'John',
      lastName: 'Doe',
      addressLine1: '123 Main St',
      addressLine2: 'Apt 4B',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'US',
      shippingMethod: 'standard'
    },
    shippingCost: 500,
    estimatedDays: '3-5',
    paymentConfig: {
      cardNumber: '4111111111111111',
      cardHolder: 'John Doe',
      expiryDate: '12/25',
      cvv: '123',
      savePaymentMethod: false
    },
    ...overrides
  };
}

/**
 * Creates mock email form data
 */
export function createMockEmailForm(email: string = 'test@example.com') {
  return {
    email
  };
}

/**
 * Creates mock shipping form data
 */
export function createMockShippingForm(overrides: Partial<{
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  shippingMethod: string;
}> = {}) {
  return {
    firstName: 'John',
    lastName: 'Doe',
    addressLine1: '123 Main St',
    addressLine2: 'Apt 4B',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US',
    shippingMethod: 'standard',
    ...overrides
  };
}

/**
 * Creates mock payment form data
 */
export function createMockPaymentForm(overrides: Partial<{
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
  savePaymentMethod: boolean;
}> = {}) {
  return {
    cardNumber: '4111111111111111',
    cardHolder: 'John Doe',
    expiryDate: '12/25',
    cvv: '123',
    savePaymentMethod: false,
    ...overrides
  };
}

/**
 * Creates mock page data for checkout tests
 */
export function createMockPageData(overrides: Partial<{
  cart: CartViewModel;
  validOrderItems: OrderItemViewModel[];
  emailForm: unknown;
  shippingForm: unknown;
  paymentForm: unknown;
  user: UserViewModel;
}> = {}) {
  return {
    cart: createMockCart(),
    validOrderItems: [
      {
        productId: 'product-1',
        variantId: 'variant-1',
        quantity: 1,
        price: 1000,
        unitPrice: 1000,
        productName: 'Test Product',
        variantName: 'Test Product'
      }
    ],
    emailForm: {},
    shippingForm: {},
    paymentForm: {},
    user: null,
    ...overrides
  };
}
