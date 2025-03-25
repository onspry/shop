import { redirect } from '@sveltejs/kit';
import * as cartRepository from '$lib/server/db/repositories/cart';

// Define the PageServerLoadEvent type
interface PageServerLoadEvent {
    cookies: {
        get: (name: string) => string | undefined;
    };
    locals: {
        user?: {
            id: string;
            [key: string]: unknown;
        };
        [key: string]: unknown;
    };
}

export const load = async ({ cookies, locals }: PageServerLoadEvent) => {
    // Get session or user ID
    const sessionId = cookies.get('sessionId') || '';
    const userId = locals.user?.id;
    const guestEmail = cookies.get('guestEmail');

    // If no session, user, or guest email, redirect to checkout
    if ((!sessionId && !userId) || (!userId && !guestEmail)) {
        redirect(303, '/checkout');
    }

    try {
        // Get cart data
        const cartData = await cartRepository.getCartViewModel(sessionId, userId);

        // If cart is empty, redirect to cart
        if (!cartData.items.length) {
            redirect(303, '/cart');
        }

        return {
            cart: cartData,
            isAuthenticated: !!userId,
            guestEmail
        };
    } catch (error) {
        console.error('Error loading shipping data:', error);
        redirect(303, '/checkout?error=shipping');
    }
}; 