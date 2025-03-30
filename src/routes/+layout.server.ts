import type { LayoutServerLoad } from './$types';
import * as cartRepository from '$lib/server/repositories/cart';
import { randomUUID } from 'crypto';

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
    const user = locals.user;
    let sessionId = cookies.get('sessionId') || '';
    const userId = user?.id;

    // Create session ID only if user is not logged in and no session exists
    if (!sessionId && !userId) {
        sessionId = `session_${randomUUID()}`;
        cookies.set('sessionId', sessionId, {
            path: '/',
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 30 // 30 days
        });
    }

    // Get cart data based on auth status
    const cartData = await cartRepository.getCartViewModel(sessionId, userId);

    return {
        user,
        cart: cartData
    };
}; 