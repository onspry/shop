import type { LayoutServerLoad } from './$types';
import * as cartRepository from '$lib/server/repositories/cart';
import { randomUUID } from 'crypto';

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
    // Get user data
    const user = locals.user;

    // Get session or user ID for cart
    let sessionId = cookies.get('sessionId') || '';
    const userId = user?.id;

    // Create session ID if needed
    if (!sessionId && !userId) {
        sessionId = `session_${randomUUID()}`;
        cookies.set('sessionId', sessionId, {
            path: '/',
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 30 // 30 days
        });
    }

    // Get cart data using repository pattern
    const cartData = await cartRepository.getCartViewModel(sessionId, userId);

    // Return user and cart data
    return {
        user,
        cart: cartData
    };
}; 