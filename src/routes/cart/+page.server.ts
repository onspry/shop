import type { PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import * as cartRepository from '$lib/server/db/repositories/cart';
import { randomUUID } from 'crypto';

// Cart item view model for the client
interface CartItemViewModel {
    id: string;
    productVariantId: string;
    quantity: number;
    price: number;
    variant: {
        id: string;
        name: string;
        price: number;
        stock_quantity: number;
        attributes: Record<string, unknown>;
        productId: string;
        sku: string;
        stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
    } | null;
    product: {
        id: string;
        name: string;
        slug: string;
        description: string | null;
    } | null;
}

export const load: PageServerLoad = async ({ cookies, locals }) => {
    // Get session or user ID
    const sessionId = cookies.get('sessionId') || '';
    const userId = locals.user?.id;

    if (!sessionId && !userId) {
        // No session or user, return empty cart
        return {
            cart: null,
            items: [],
            subtotal: 0,
            discountAmount: 0,
            total: 0
        };
    }

    try {
        // Get cart
        const userCart = await cartRepository.getOrCreateCart(sessionId, userId);

        if (!userCart) {
            // No cart found, return empty cart
            return {
                cart: null,
                items: [],
                subtotal: 0,
                discountAmount: 0,
                total: 0
            };
        }

        // Get cart items with product details
        const cartWithItems = await cartRepository.getCartWithItems(userCart.id);

        if (!cartWithItems || !cartWithItems.items || !Array.isArray(cartWithItems.items) || cartWithItems.items.length === 0) {
            return {
                cart: { id: userCart.id, discountCode: userCart.discountCode },
                items: [],
                subtotal: 0,
                discountAmount: userCart.discountAmount || 0,
                total: 0
            };
        }

        // Transform cart items with product details for the view
        const cartItemsWithDetails: CartItemViewModel[] = cartWithItems.items.map((item) => {
            // Map productVariant data to view model
            const variant = item.productVariant;

            if (!variant) {
                return null;
            }

            return {
                id: item.id,
                quantity: item.quantity,
                price: item.price,
                productVariantId: item.productVariantId,
                variant: {
                    id: variant.id,
                    name: variant.name,
                    price: variant.price,
                    stock_quantity: variant.stockQuantity,
                    attributes: variant.attributes || {},
                    productId: variant.productId,
                    sku: variant.sku,
                    stockStatus: getStockStatus(variant.stockQuantity)
                },
                product: {
                    id: variant.productId,
                    name: variant.name.split(' - ')[0], // Simple derivation of product name
                    slug: '', // Not needed for cart display
                    description: null
                }
            };
        }).filter(Boolean) as CartItemViewModel[];

        // Calculate totals
        const subtotal = cartItemsWithDetails.reduce(
            (sum, item) => sum + (item.price * item.quantity),
            0
        );

        // Get discount info from cart
        const discountAmount = userCart.discountAmount || 0;
        const discountCode = userCart.discountCode || null;

        // Calculate total after discount
        const total = subtotal - discountAmount;

        return {
            cart: {
                id: userCart.id,
                discountCode
            },
            items: cartItemsWithDetails,
            subtotal,
            discountAmount,
            total
        };
    } catch (error) {
        console.error('Error loading cart data:', error);
        // Return empty cart on error
        return {
            cart: null,
            items: [],
            subtotal: 0,
            discountAmount: 0,
            total: 0,
            error: 'Failed to load cart data'
        };
    }
};

// Helper function to determine stock status
function getStockStatus(quantity: number): 'in_stock' | 'low_stock' | 'out_of_stock' {
    if (quantity <= 0) return 'out_of_stock';
    if (quantity < 5) return 'low_stock';
    return 'in_stock';
}

export const actions: Actions = {
    /**
     * Add item to cart
     */
    addItem: async ({ request, cookies, locals }) => {
        const formData = await request.formData();
        const productVariantId = formData.get('productVariantId')?.toString();
        const quantity = Number(formData.get('quantity')) || 1;

        // Validate input
        if (!productVariantId) {
            return fail(400, { message: 'Product variant ID is required' });
        }

        if (quantity <= 0) {
            return fail(400, { message: 'Quantity must be greater than 0' });
        }

        try {
            // Get or create session ID
            let sessionId = cookies.get('sessionId') || '';
            if (!sessionId) {
                sessionId = `session_${randomUUID()}`;
                // Set cookie with 30 day expiry
                cookies.set('sessionId', sessionId, {
                    path: '/',
                    httpOnly: true,
                    sameSite: 'strict',
                    maxAge: 60 * 60 * 24 * 30 // 30 days
                });
            }

            // Get user ID if logged in
            const userId = locals.user?.id;

            // Get or create cart
            const userCart = await cartRepository.getOrCreateCart(sessionId, userId);

            // Add item to cart (repository handles existing items and stock check)
            await cartRepository.addItemToCart(
                userCart.id,
                productVariantId,
                quantity
            );

            return { success: true };
        } catch (error) {
            console.error('Error adding item to cart:', error);

            // Handle specific error messages from repository
            const errorMessage = error instanceof Error ? error.message : 'Failed to add item to cart';

            if (errorMessage.includes('Not enough stock')) {
                return fail(400, { message: errorMessage });
            }

            if (errorMessage.includes('Product variant not found')) {
                return fail(404, { message: errorMessage });
            }

            return fail(500, { message: errorMessage });
        }
    },

    /**
     * Update cart item quantity
     */
    updateItem: async ({ request }) => {
        const formData = await request.formData();
        const cartItemId = formData.get('cartItemId')?.toString();
        const quantity = Number(formData.get('quantity')) || 0;

        // Validate input
        if (!cartItemId) {
            return fail(400, { message: 'Cart item ID is required' });
        }

        if (quantity <= 0) {
            return fail(400, { message: 'Quantity must be greater than 0' });
        }

        try {
            // Update cart item (repository handles stock check)
            await cartRepository.updateCartItemQuantity(cartItemId, quantity);
            return { success: true };
        } catch (error) {
            console.error('Error updating cart item:', error);

            // Handle specific error messages from repository
            const errorMessage = error instanceof Error ? error.message : 'Failed to update cart item';

            if (errorMessage.includes('Not enough stock')) {
                return fail(400, { message: errorMessage });
            }

            if (errorMessage.includes('Cart item not found')) {
                return fail(404, { message: errorMessage });
            }

            return fail(500, { message: errorMessage });
        }
    },

    /**
     * Remove item from cart
     */
    removeItem: async ({ request }) => {
        const formData = await request.formData();
        const cartItemId = formData.get('cartItemId')?.toString();

        // Validate input
        if (!cartItemId) {
            return fail(400, { message: 'Cart item ID is required' });
        }

        try {
            // Remove cart item
            await cartRepository.removeCartItem(cartItemId);
            return { success: true };
        } catch (error) {
            console.error('Error removing cart item:', error);

            // Handle specific error messages from repository
            const errorMessage = error instanceof Error ? error.message : 'Failed to remove cart item';

            if (errorMessage.includes('Cart item not found')) {
                return fail(404, { message: errorMessage });
            }

            return fail(500, { message: errorMessage });
        }
    },

    /**
     * Apply discount code to cart
     */
    applyDiscount: async ({ request, cookies, locals }) => {
        const formData = await request.formData();
        const discountCode = formData.get('discountCode')?.toString();

        // Validate input
        if (!discountCode) {
            return fail(400, { message: 'Discount code is required' });
        }

        try {
            // Get user session or ID
            const sessionId = cookies.get('sessionId') || '';
            const userId = locals.user?.id;

            if (!sessionId && !userId) {
                return fail(400, { message: 'No active session or user' });
            }

            // Get the cart
            const userCart = await cartRepository.getOrCreateCart(sessionId, userId);

            // Apply discount to cart (repository handles validation)
            await cartRepository.applyDiscountToCart(userCart.id, discountCode);

            // Reload cart to get updated discount amount
            const updatedCart = await cartRepository.getCartWithItems(userCart.id);
            return {
                success: true,
                discountAmount: updatedCart?.discountAmount || 0
            };
        } catch (error) {
            console.error('Error applying discount code:', error);

            // Handle specific error messages from repository
            const errorMessage = error instanceof Error ? error.message : 'Failed to apply discount code';

            if (errorMessage.includes('Invalid discount code') ||
                errorMessage.includes('expired') ||
                errorMessage.includes('Minimum spend')) {
                return fail(400, { message: errorMessage });
            }

            return fail(500, { message: errorMessage });
        }
    },

    /**
     * Remove discount from cart
     */
    removeDiscount: async ({ cookies, locals }) => {
        try {
            // Get user session or ID
            const sessionId = cookies.get('sessionId') || '';
            const userId = locals.user?.id;

            if (!sessionId && !userId) {
                return fail(400, { message: 'No active session or user' });
            }

            // Get the cart
            const userCart = await cartRepository.getOrCreateCart(sessionId, userId);

            // Remove discount from cart
            await cartRepository.removeDiscountFromCart(userCart.id);
            return { success: true };
        } catch (error) {
            console.error('Error removing discount:', error);
            return fail(500, { message: 'Failed to remove discount' });
        }
    }
}; 