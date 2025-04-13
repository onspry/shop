/**
 * Order-related view models for type-safe data handling
 */

import { OrderStatus } from '@prisma/client';

/**
 * Represents an item in an order
 */
export interface OrderItemViewModel {
    productId: string;
    variantId: string;
    quantity: number;
    price: number;
    unitPrice: number; // Same as price, but needed for compatibility
    productName: string;
    variantName: string;
}

/**
 * Represents a shipping or billing address
 */
export interface OrderAddressViewModel {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    email: string;
    phone?: string;
}

/**
 * Represents payment information
 */
export interface OrderPaymentViewModel {
    method: string;
    intentId: string;
    cardLast4?: string;
    cardBrand?: string;
}

/**
 * Data required to create a new order
 */
export interface CreateOrderViewModel {
    userId?: string;
    cartId: string;
    items: OrderItemViewModel[];
    shipping: {
        method: string;
        amount: number;
        address: OrderAddressViewModel;
    };
    payment: OrderPaymentViewModel;
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    currency: string;
}

/**
 * Complete order data including database fields
 */
export interface OrderViewModel {
    id: string;
    orderNumber: string; // Formatted order number for display
    status: OrderStatus | string;
    total: number;
    subtotal: number;
    taxAmount: number;
    shippingAmount: number;
    discountAmount?: number;
    currency: string;
    shippingMethod: string;
    paymentMethod: string;
    createdAt: string;
    items: Array<{
        id: string;
        productId: string;
        variantId?: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        name: string;
        variantName: string;
    }>;
    shippingAddress: {
        firstName: string;
        lastName: string;
        address1: string;
        address2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        phone?: string;
        email: string;
    };
}
