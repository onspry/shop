import type { LayoutServerLoad } from './$types';
import { cartRepository } from '$lib/server/repositories/cart';
import { randomUUID } from 'crypto';
import { db } from '$lib/server/db';
import { cart } from '$lib/server/db/schema/cart';
import { eq } from 'drizzle-orm';

/**
 * Layout server load function
 * This is the ONLY place where cart sessions should be created
 */
export const load: LayoutServerLoad = async ({ locals, cookies }) => {
    const user = locals.user;
    let sessionId = cookies.get('cart-session') || '';
    const userId = user?.id;

    // If user is logged in AND they don't have a cart session cookie,
    // check if they already have a cart in the database
    if (userId && !sessionId) {
        // First check if the user already has a cart
        const existingUserCart = await db.query.cart.findFirst({
            where: eq(cart.userId, userId)
        });

        if (existingUserCart) {
            // Use the sessionId from the existing cart
            sessionId = existingUserCart.sessionId || `session_${randomUUID()}`;

            // If the cart had no session ID, update it
            if (!existingUserCart.sessionId) {
                await db.update(cart)
                    .set({ sessionId })
                    .where(eq(cart.id, existingUserCart.id));
            }

            // Set the cart session cookie
            cookies.set('cart-session', sessionId, {
                path: '/',
                httpOnly: true,
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 30 // 30 days
            });
        }
    }

    // Create cart session ID if none exists (regardless of login status)
    if (!sessionId) {
        sessionId = `session_${randomUUID()}`;

        cookies.set('cart-session', sessionId, {
            path: '/',
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 30 // 30 days
        });
    }

    // Check if this session already has a cart before calling getCartViewModel
    // This helps avoid unnecessary cart creation if the cookie exists but no cart yet
    if (sessionId) {
        const sessionCartExists = await db.query.cart.findFirst({
            where: eq(cart.sessionId, sessionId)
        });

        if (sessionCartExists) {
            // If user is logged in but cart isn't associated, update it now
            if (userId && sessionCartExists.userId !== userId) {
                await db.update(cart)
                    .set({ userId })
                    .where(eq(cart.id, sessionCartExists.id));
            }
        }
    }

    // Get cart data based on auth status
    const cartData = await cartRepository.getCartViewModel(sessionId, userId);

    // If user is logged in, ensure the cart session cookie is refreshed
    if (userId) {
        // Refresh the cart-session cookie to maintain the association
        cookies.set('cart-session', sessionId, {
            path: '/',
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 30 // 30 days
        });
    }

    return {
        user,
        cart: cartData
    };
}; 