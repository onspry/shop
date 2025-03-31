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

    // Important debug logging for cart session tracking
    console.log(`[LAYOUT] Starting layout load: sessionId="${sessionId}", userId=${userId || 'null'}, isNewSession=${!sessionId}`);

    // Track where the session comes from for debugging
    let sessionSource = 'existing_cookie';

    // If user is logged in AND they don't have a cart session cookie,
    // check if they already have a cart in the database
    if (userId && !sessionId) {
        // First check if the user already has a cart
        console.log(`[LAYOUT] User is logged in but no cart-session cookie found. Checking for existing user cart.`);
        const existingUserCart = await db.query.cart.findFirst({
            where: eq(cart.userId, userId)
        });

        if (existingUserCart) {
            // Use the sessionId from the existing cart
            sessionId = existingUserCart.sessionId || `session_${randomUUID()}`;
            sessionSource = 'user_db_cart';
            console.log(`[LAYOUT] Found existing user cart with session: ${sessionId}. Using this session.`);

            // If the cart had no session ID, update it
            if (!existingUserCart.sessionId) {
                await db.update(cart)
                    .set({ sessionId })
                    .where(eq(cart.id, existingUserCart.id));
                console.log(`[LAYOUT] Updated existing user cart with new session ID: ${sessionId}`);
            }

            // Set the cart session cookie
            cookies.set('cart-session', sessionId, {
                path: '/',
                httpOnly: true,
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 30 // 30 days
            });
            console.log(`[LAYOUT] Set cart-session cookie to ${sessionId} for user ${userId}`);
        }
    }

    // Create cart session ID if none exists (regardless of login status)
    if (!sessionId) {
        sessionId = `session_${randomUUID()}`;
        sessionSource = 'newly_created';
        console.log(`[LAYOUT] No existing cart found. Creating new session: ${sessionId}`);

        cookies.set('cart-session', sessionId, {
            path: '/',
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 30 // 30 days
        });
        console.log(`[CART] Created new cart session: ${sessionId} for ${userId ? `user ${userId}` : 'anonymous visitor'}`);
    } else {
        console.log(`[CART] Using existing cart session (${sessionSource}): ${sessionId} for ${userId ? `user ${userId}` : 'anonymous visitor'}`);
    }

    // Check if this session already has a cart before calling getCartViewModel
    // This helps avoid unnecessary cart creation if the cookie exists but no cart yet
    if (sessionId) {
        const sessionCartExists = await db.query.cart.findFirst({
            where: eq(cart.sessionId, sessionId)
        });

        if (sessionCartExists) {
            console.log(`[LAYOUT] Found existing cart with session ID ${sessionId}: ${sessionCartExists.id}`);

            // If user is logged in but cart isn't associated, update it now
            if (userId && sessionCartExists.userId !== userId) {
                console.log(`[LAYOUT] Updating cart ${sessionCartExists.id} to associate with user ${userId}`);
                await db.update(cart)
                    .set({ userId })
                    .where(eq(cart.id, sessionCartExists.id));
            }
        } else {
            console.log(`[LAYOUT] No cart found yet for session ID ${sessionId}, will be created by getCartViewModel`);
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
        console.log(`[CART] Refreshed cart session cookie for user ${userId}`);
    }

    return {
        user,
        cart: cartData
    };
}; 