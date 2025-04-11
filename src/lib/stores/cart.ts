import { writable } from 'svelte/store';
import { invalidateAll } from '$app/navigation';
import type { CartViewModel } from '$lib/server/db/prisma/models/cart';

// Initial empty cart state
const initialCart: CartViewModel = {
    id: '',
    items: [],
    discountCode: null,
    discountAmount: 0,
    subtotal: 0,
    total: 0,
    itemCount: 0
};

// Writable store for local cart changes
export const cart = writable<CartViewModel>(initialCart);

// Loading state for cart operations
export const isLoading = writable(false);

// Response type for cart operations
type CartOperationResult = {
    success: boolean;
    error?: string;
};

/**
 * Generic function to handle cart form actions with consistent error handling
 */
async function executeCartAction(
    action: string,
    formData: FormData
): Promise<CartOperationResult> {
    // Set loading state before any operations
    isLoading.set(true);

    try {
        const response = await fetch(`/cart?/${action}`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Failed to execute ${action}`);
        }

        // Wait a bit before invalidating to ensure loading state is visible
        await new Promise(resolve => setTimeout(resolve, 100));

        // Refresh data by invalidating all endpoints
        await invalidateAll();

        return { success: true };
    } catch (error) {
        console.error(`Failed to execute ${action}:`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    } finally {
        // Clear loading state after operation completes
        isLoading.set(false);
    }
}

// Function to reset cart store when there might be stale data
export function resetCartStore() {
    cart.set(initialCart);
    invalidateAll();
}

// Function to update cart store from page data
export function updateCartFromPageData(pageData: Record<string, unknown>) {
    if (!pageData) return;

    try {
        const cartData = pageData.cart as CartViewModel;
        if (!cartData) {
            resetCartStore();
            return;
        }
        cart.set(cartData);
    } catch (error) {
        console.error('Error updating cart from page data:', error);
        resetCartStore();
    }
}

// Add item to cart using form action
export async function addToCart(
    productVariantId: string,
    quantity: number = 1
): Promise<CartOperationResult> {
    const formData = new FormData();
    formData.append('productVariantId', productVariantId);
    formData.append('quantity', quantity.toString());
    return executeCartAction('addItem', formData);
}

// Update cart item quantity using form action
export async function updateCartItem(
    cartItemId: string,
    quantity: number
): Promise<CartOperationResult> {
    const formData = new FormData();
    formData.append('cartItemId', cartItemId);
    formData.append('quantity', quantity.toString());
    return executeCartAction('updateItem', formData);
}

// Remove cart item using form action
export async function removeCartItem(cartItemId: string): Promise<CartOperationResult> {
    const formData = new FormData();
    formData.append('cartItemId', cartItemId);
    return executeCartAction('removeItem', formData);
}

// Apply discount code using form action
export async function applyDiscount(code: string): Promise<CartOperationResult> {
    const formData = new FormData();
    formData.append('discountCode', code);
    return executeCartAction('applyDiscount', formData);
}

// Remove discount code using form action
export async function removeDiscount(): Promise<CartOperationResult> {
    return executeCartAction('removeDiscount', new FormData());
}

// Clear cart using form action
export async function clearCart(): Promise<CartOperationResult> {
    return executeCartAction('clearCart', new FormData());
}

// Cart actions object for component usage
export const cartActions = {
    addToCart: async ({ productVariantId, quantity = 1, composites = [] }: {
        productVariantId: string;
        quantity: number;
        composites?: Array<{
            variantId: string;
            name: string;
            quantity: number;
        }>;
    }) => {
        const formData = new FormData();
        formData.append('productVariantId', productVariantId);
        formData.append('quantity', quantity.toString());
        if (composites.length > 0) {
            formData.append('composites', JSON.stringify(composites));
        }
        return executeCartAction('addItem', formData);
    },
    updateItem: updateCartItem,
    removeItem: removeCartItem,
    applyDiscount,
    removeDiscount,
    clearCart
}; 