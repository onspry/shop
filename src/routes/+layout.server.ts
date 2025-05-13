import type { LayoutServerLoad } from './$types';
import { generateUUID } from '$lib/utils/uuid';
import { cartRepository } from '$lib/repositories/cart-repository';
import * as m from '$lib/paraglide/messages';

/**
 * Layout server load function
 * This is the ONLY place where cart sessions should be created
 */
export const load: LayoutServerLoad = async ({ locals, cookies }) => {
    const user = locals.user;
    let sessionId = cookies.get('cart-session') || '';
    const userId = user?.id;

    // Create cart session ID if none exists (regardless of login status)
    if (!sessionId) {
        sessionId = `session_${generateUUID()}`;

        cookies.set('cart-session', sessionId, {
            path: '/',
            httpOnly: true,
            sameSite: m.cookie_same_site() as "strict" | "lax" | "none",
            maxAge: 60 * 60 * 24 * 30, // 30 days
            domain: '' // Explicitly set empty domain for same-origin only
        });
    }

    // Get cart data based on auth status
    let cartData;
    try {
        // If user is logged in, merge any anonymous cart with their user cart
        if (userId) {
            await cartRepository.handleUserLoginMerge(sessionId, userId);
        }

        // Get the cart data
        cartData = await cartRepository.getCartViewModel(sessionId, userId);
    } catch (error) {
        console.error('Error getting cart data:', error);
        cartData = { items: [], itemCount: 0, subtotal: 0, total: 0, discountAmount: 0, discountCode: null, id: '' };
    }

    // If user is logged in, ensure the cart session cookie is refreshed
    if (userId) {
        // Refresh the cart-session cookie to maintain the association
        cookies.set('cart-session', sessionId, {
            path: '/',
            httpOnly: true,
            sameSite: m.cookie_same_site() as "strict" | "lax" | "none",
            maxAge: 60 * 60 * 24 * 30, // 30 days
            domain: '' // Explicitly set empty domain for same-origin only
        });
    }

    return {
        user,
        cart: cartData,
        paraglide: {
            lang: locals.paraglide?.lang || 'en'
        }
    };
};