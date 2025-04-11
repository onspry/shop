/**
 * Order-related view models for type-safe data handling
 */

import type { CartItemViewModel } from "./cart";

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
export interface OrderViewModel extends CreateOrderViewModel {
    id: string;
    status: string;
    total: number;
    createdAt: string;
    updatedAt: string;
}

/**
 * Maps cart item data to order item view model using the normalized structure
 */
export function mapCartItemToOrderItem(cartItem: CartItemViewModel): OrderItemViewModel {
    console.log('Mapping cart item to order item:', cartItem);

    // Get product information from the variant
    const productId = cartItem.variant.product?.id || cartItem.variant.productId;
    const productName = cartItem.variant.product?.name || cartItem.variant.name;

    return {
        // Get product ID from the variant's product reference
        productId: productId,
        // The variant ID is the key field that must match a valid ID in the product_variant table
        variantId: cartItem.variant.id,
        quantity: cartItem.quantity,
        price: cartItem.price,
        unitPrice: cartItem.price, // Same as price, needed for compatibility
        // Get product name from the variant's product reference
        productName: productName,
        // Get variant name directly from the variant
        variantName: cartItem.variant.name
    }
}

/**
 * Validates an order item - strict validation with no fallbacks
 */
export function isValidOrderItem(item: OrderItemViewModel): boolean {
    // Log the validation check
    console.log('Validating order item:', item);

    // Strict validation for all required fields
    const isValid = Boolean(
        // Product ID must be valid
        item.productId &&
        typeof item.productId === 'string' &&
        item.productId.trim() !== '' &&
        // Variant ID must be valid
        item.variantId &&
        typeof item.variantId === 'string' &&
        item.variantId.trim() !== '' &&
        // Product name must be valid
        item.productName &&
        typeof item.productName === 'string' &&
        item.productName.trim() !== '' &&
        // Variant name must be valid
        item.variantName &&
        typeof item.variantName === 'string' &&
        item.variantName.trim() !== '' &&
        // Quantity must be positive
        item.quantity > 0 &&
        // Price must be non-negative
        item.price >= 0
    );

    if (!isValid) {
        console.error('Invalid order item:', item);
        // Log specific validation failures to help diagnose issues
        if (!item.productId || typeof item.productId !== 'string' || item.productId.trim() === '') {
            console.error('Invalid product ID');
        }
        if (!item.variantId || typeof item.variantId !== 'string' || item.variantId.trim() === '') {
            console.error('Invalid variant ID');
        }
        if (!item.productName || typeof item.productName !== 'string' || item.productName.trim() === '') {
            console.error('Invalid product name');
        }
        if (!item.variantName || typeof item.variantName !== 'string' || item.variantName.trim() === '') {
            console.error('Invalid variant name');
        }
        if (!(item.quantity > 0)) {
            console.error('Invalid quantity');
        }
        if (!(item.price >= 0)) {
            console.error('Invalid price');
        }
    }

    console.log('Item valid:', isValid);
    return isValid;
}
