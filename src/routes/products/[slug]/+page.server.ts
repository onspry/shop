import { productRepository } from '$lib/repositories/product-repository';
import type { ProductViewModel } from '$lib/models/product';
import type { PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { cartRepository } from '$lib/repositories/cart-repository';

// Configure caching
export const config = {
    isr: {
        // Enable Incremental Static Regeneration
        // Regenerate the page every 30 minutes
        revalidate: 1800
    }
};

export const load: PageServerLoad = async ({ params, url, setHeaders }) => {
    // Set cache headers for dynamic content
    setHeaders({
        'Cache-Control': 'public, max-age=1800, stale-while-revalidate=86400'
    });

    const result = await productRepository.getProduct(params.slug);

    // If this is a keyboard, fetch compatible switches and keycaps
    let switches: ProductViewModel[] = [];
    let keycaps: ProductViewModel[] = [];
    if (result.product.category === 'KEYBOARD') {
        const switchesResult = await productRepository.getProductsByCategory('SWITCH');
        switches = switchesResult.products;
        const keycapsResult = await productRepository.getProductsByCategory('KEYCAP');
        keycaps = keycapsResult.products;
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
    addToCart: async ({ request, cookies, locals }) => {
        const formData = await request.formData();
        const productVariantId = formData.get('productVariantId')?.toString();
        const quantity = Number(formData.get('quantity')) || 1;
        const userId = locals.user?.id;

        // Validate input
        if (!productVariantId) {
            return fail(400, { message: 'Product variant ID is required' });
        }

        if (quantity <= 0) {
            return fail(400, { message: 'Quantity must be greater than 0' });
        }

        try {
            // Get session ID from cookies - should already exist from layout
            const sessionId = cookies.get('cart-session') || '';

            // If somehow there's no session ID, return an error
            if (!sessionId && !userId) {
                return fail(400, { message: 'No cart session available. Please refresh the page and try again.' });
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

            console.log('[PAGE.SERVER] Extracted composites:', composites);

            // Get or create cart
            const userCart = await cartRepository.getOrCreateCart(sessionId, userId);

            // Add item to cart (repository handles existing items and stock check)
            await cartRepository.addItemToCart(
                userCart.id,
                productVariantId,
                quantity,
                composites
            );

            // Get the updated cart to return to the client
            const updatedCart = await cartRepository.getCartViewModel(sessionId, userId);

            // Return success response with updated cart
            return {
                success: true,
                cart: updatedCart
            };
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