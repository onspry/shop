import type { PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { cartRepository } from '$lib/repositories/cart-repository';

export const load: PageServerLoad = async ({ cookies, locals }) => {
    // Get session or user ID
    const sessionId = cookies.get('cart-session') || '';
    const userId = locals.user?.id;

    if (!sessionId && !userId) {
        // No session or user, return empty cart
        return {
            cart: {
                id: '',
                items: [],
                discountCode: null,
                discountAmount: 0,
                subtotal: 0,
                total: 0,
                itemCount: 0
            }
        };
    }

    try {
        // Get cart data using repository pattern
        const cartData = await cartRepository.getCartViewModel(sessionId, userId);

        return {
            cart: cartData
        };
    } catch (error) {
        console.error('Error loading cart data:', error);

        return {
            cart: {
                id: '',
                items: [],
                discountCode: null,
                discountAmount: 0,
                subtotal: 0,
                total: 0,
                itemCount: 0
            },
            error: 'Failed to load cart'
        };
    }
};

export const actions: Actions = {
    /**
     * Add item to cart
     */
    addItem: async ({ request, cookies, locals }) => {
        const formData = await request.formData();
        const productVariantId = formData.get('productVariantId')?.toString();
        const quantity = parseInt(formData.get('quantity')?.toString() || '1', 10);

        if (!productVariantId) {
            return fail(400, { message: 'Product variant ID is required' });
        }

        try {
            const sessionId = cookies.get('cart-session') || '';
            const userId = locals.user?.id;

            if (!sessionId && !userId) {
                return fail(400, { message: 'No session or user found' });
            }

            // Extract composites from form data
            const composites: Array<{ variantId: string, name: string, quantity: number }> = [];

            // Process form data to extract composites
            for (const [key, value] of formData.entries()) {
                // Check if this is a composite field
                if (key.startsWith('composites[') && key.includes('][variantId]')) {
                    const index = key.match(/composites\[(\d+)\]/)![1];
                    const variantId = value.toString();
                    const name = formData.get(`composites[${index}][name]`)?.toString() || '';
                    const quantity = parseInt(formData.get(`composites[${index}][quantity]`)?.toString() || '1', 10);

                    composites.push({ variantId, name, quantity });
                }
            }

            console.log('[CART.SERVER] Extracted composites:', composites);

            // Get or create cart
            const userCart = await cartRepository.getOrCreateCart(sessionId, userId);

            // Add item to cart
            await cartRepository.addItemToCart(userCart.id, productVariantId, quantity, composites);

            return { success: true };
        } catch (error) {
            console.error('Error adding item to cart:', error);
            return fail(500, { message: 'Failed to add item to cart' });
        }
    },

    /**
     * Update cart item quantity
     */
    updateItem: async ({ request, cookies, locals }) => {
        const formData = await request.formData();
        const cartItemId = formData.get('cartItemId')?.toString();
        const quantity = parseInt(formData.get('quantity')?.toString() || '1', 10);

        if (!cartItemId) {
            return fail(400, { message: 'Cart item ID is required' });
        }

        try {
            // Update cart item quantity
            await cartRepository.updateCartItemQuantity(cartItemId, quantity);

            // Get cart data from the repository
            const sessionId = cookies.get('cart-session') || '';
            const userId = locals.user?.id;

            // Fetch the updated cart
            const updatedCart = await cartRepository.getCartViewModel(sessionId, userId);

            return { success: true, cart: updatedCart };
        } catch (error) {
            console.error('Error updating cart item:', error);
            return fail(500, { message: 'Failed to update cart item' });
        }
    },

    /**
     * Remove item from cart
     */
    removeItem: async ({ request, cookies, locals }) => {
        const formData = await request.formData();
        const cartItemId = formData.get('cartItemId')?.toString();

        if (!cartItemId) {
            return fail(400, { message: 'Cart item ID is required' });
        }

        try {
            // Remove cart item
            await cartRepository.removeCartItem(cartItemId);

            // Get cart data from the repository
            const sessionId = cookies.get('cart-session') || '';
            const userId = locals.user?.id;

            // Fetch the updated cart
            const updatedCart = await cartRepository.getCartViewModel(sessionId, userId);
            return { success: true, cart: updatedCart };
        } catch (error) {
            console.error('Error removing cart item:', error);
            return fail(500, { message: 'Failed to remove cart item' });
        }
    },

    /**
     * Apply discount to cart
     */
    applyDiscount: async ({ request, cookies, locals }) => {
        const formData = await request.formData();
        const discountCode = formData.get('discountCode')?.toString();

        if (!discountCode) {
            return fail(400, { message: 'Discount code is required' });
        }

        try {
            const sessionId = cookies.get('cart-session') || '';
            const userId = locals.user?.id;

            if (!sessionId && !userId) {
                return fail(400, { message: 'No session or user found' });
            }

            // Get cart
            const userCart = await cartRepository.getOrCreateCart(sessionId, userId);

            // Apply discount
            await cartRepository.applyDiscountToCart(userCart.id, discountCode);

            // Fetch the updated cart
            const updatedCart = await cartRepository.getCartViewModel(sessionId, userId);

            return { success: true, cart: updatedCart };
        } catch (error) {
            console.error('Error applying discount:', error);

            // Check if this is a known error from the repository
            if (error instanceof Error) {
                return fail(400, { message: error.message });
            }

            return fail(500, { message: 'Failed to apply discount' });
        }
    },

    /**
     * Remove discount from cart
     */
    removeDiscount: async ({ cookies, locals }) => {
        try {
            const sessionId = cookies.get('cart-session') || '';
            const userId = locals.user?.id;

            if (!sessionId && !userId) {
                return fail(400, { message: 'No session or user found' });
            }

            // Get cart
            const userCart = await cartRepository.getOrCreateCart(sessionId, userId);

            // Remove discount
            await cartRepository.removeDiscountFromCart(userCart.id);

            // Fetch the updated cart
            const updatedCart = await cartRepository.getCartViewModel(sessionId, userId);

            return { success: true, cart: updatedCart };
        } catch (error) {
            console.error('Error removing discount:', error);
            return fail(500, { message: 'Failed to remove discount' });
        }
    },

    /**
     * Clear cart
     */
    clearCart: async ({ cookies, locals }) => {
        try {
            const sessionId = cookies.get('cart-session') || '';
            const userId = locals.user?.id;

            if (!sessionId && !userId) {
                return fail(400, { message: 'No session or user found' });
            }

            // Get cart
            const userCart = await cartRepository.getOrCreateCart(sessionId, userId);

            // Clear cart
            await cartRepository.clearCart(userCart.id);

            // Fetch the updated cart
            const updatedCart = await cartRepository.getCartViewModel(sessionId, userId);

            return { success: true, cart: updatedCart };
        } catch (error) {
            console.error('Error clearing cart:', error);
            return fail(500, { message: 'Failed to clear cart' });
        }
    }
};