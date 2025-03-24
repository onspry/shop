import { productRepo } from '$lib/server/db/repositories/product';
import type { ProductViewModel } from '$lib/models/product';
import type { PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import * as cartRepository from '$lib/server/db/repositories/cart';
import { randomUUID } from 'crypto';

export const load: PageServerLoad = async ({ params, url }) => {
    const result = await productRepo.getProduct(params.slug);

    // If this is a keyboard, fetch compatible switches and keycaps
    let switches: ProductViewModel[] = [];
    let keycaps: ProductViewModel[] = [];
    if (result.product.category === 'KEYBOARD') {
        switches = await productRepo.getProductsByCategory('SWITCH');
        keycaps = await productRepo.getProductsByCategory('KEYCAP');
    }

    return {
        product: result.product,
        variants: result.product.variants || [],
        images: result.product.images || [],
        defaultVariantId: result.defaultVariantId,
        switches,
        keycaps,
        searchParams: {
            variant: url.searchParams.get('variant'),
            switch: url.searchParams.get('switch'),
            keycap: url.searchParams.get('keycap')
        }
    };
};

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
    }
}; 