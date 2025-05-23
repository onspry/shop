export const OrderStatus = {
    PENDING_PAYMENT: 'pending_payment',
    PAYMENT_FAILED: 'payment_failed',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded'
} as const;

export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];

export const PaymentStatus = {
    PENDING: 'pending',
    SUCCEEDED: 'succeeded',
    FAILED: 'failed',
    REFUNDED: 'refunded'
} as const;

export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];

export const RefundStatus = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed'
} as const;

export type RefundStatus = typeof RefundStatus[keyof typeof RefundStatus];

/**
 * Represents a composite item in an order
 */
export interface OrderItemCompositeViewModel {
    variantId: string;
    name: string;
    quantity: number;
    type?: string; // For categorizing composites (e.g., 'SWITCH', 'KEYCAP')
}

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
    composites?: OrderItemCompositeViewModel[];
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
        composites?: OrderItemCompositeViewModel[];
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