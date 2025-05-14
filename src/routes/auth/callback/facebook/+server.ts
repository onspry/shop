import { generateSessionToken, createSession } from "$lib/server/auth/session";
import { facebook } from "$lib/server/auth/oauth";
import { generateUUID } from '$lib/utils/uuid';
import type { RequestEvent } from "@sveltejs/kit";
import { cartRepository } from "$lib/repositories/cart-repository";
import { userRepository } from "$lib/repositories/user-repository";
import { Provider } from "$lib/models/user";

export async function GET(event: RequestEvent): Promise<Response> {
    // Get the stored redirect URL from the cookie
    let redirectTo = event.cookies.get('oauth_redirect') || '/';

    // Important: If the redirect is an internal URL (doesn't start with http),
    // ensure it's not treated as a route path by ensuring it starts with /
    if (!redirectTo.startsWith('http') && !redirectTo.startsWith('/')) {
        redirectTo = '/' + redirectTo;
    }

    // Check code and state
    const code = event.url.searchParams.get("code");
    const state = event.url.searchParams.get("state");
    const storedState = event.cookies.get("facebook_oauth_state") ?? null;
    if (code === null || state === null || storedState === null) {
        return new Response(null, {
            status: 400
        });
    }
    if (state !== storedState) {
        return new Response(null, {
            status: 400
        });
    }

    // Exchange code for access token
    let tokenResponse;
    try {
        tokenResponse = await facebook.exchangeCodeForToken(code);
    } catch {
        return new Response(null, {
            status: 400
        });
    }

    // Get Facebook user data
    const fbUserResponse = await fetch(`https://graph.facebook.com/me?fields=id,email,first_name,last_name,picture.type(large)&access_token=${tokenResponse.access_token}`);
    const fbUser = await fbUserResponse.json();
    const fbUserId = fbUser.id;
    const primaryEmail = fbUser.email;

    // CRITICAL: Get the cart session ID from the current cookie OR the preserved cookie
    let cartSessionId = event.cookies.get('cart-session') || '';
    const preservedCartSessionId = event.cookies.get('preserved_cart_session') || '';

    // Use the preserved cart session if available and current is empty
    if (!cartSessionId && preservedCartSessionId) {
        cartSessionId = preservedCartSessionId;
    }

    // If no cart session exists yet, create one now
    if (!cartSessionId) {
        cartSessionId = `session_${generateUUID()}`;
    }

    // Clean up the temporary preserved cart session cookie
    if (preservedCartSessionId) {
        event.cookies.delete('preserved_cart_session', { path: '/' });
    }

    // First check for existing user by provider ID
    const existingUser = await userRepository.getUserByProviderAndProviderId(Provider.FACEBOOK, fbUserId);
    if (existingUser) {
        // Set auth session token
        const sessionToken = generateSessionToken();
        const session = await createSession(sessionToken, existingUser.id);

        // Now handle cart merge
        await cartRepository.handleUserLoginMerge(cartSessionId, existingUser.id);

        // Set cookies
        event.cookies.set('auth-session', sessionToken, {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            expires: session.expiresAt,
            domain: ''
        });
        event.cookies.set('cart-session', cartSessionId, {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            domain: ''
        });
        event.cookies.delete('oauth_redirect', { path: '/' });
        event.cookies.delete('facebook_oauth_state', { path: '/' });
        return new Response(null, {
            status: 303,
            headers: {
                Location: redirectTo
            }
        });
    }

    // If no user found by provider ID, check by email
    const existingUserByEmail = await userRepository.getUserByEmail(primaryEmail);
    if (existingUserByEmail) {
        // Redirect with more detailed error information
        const searchParams = new URLSearchParams({
            error: 'email_exists',
            email: primaryEmail,
            provider: existingUserByEmail.provider,
            attempted_provider: 'facebook'
        });
        return new Response(null, {
            status: 302,
            headers: {
                Location: `/auth/error?${searchParams.toString()}`
            }
        });
    }

    // Create new user
    const newUser = await userRepository.createUser({
        providerId: fbUserId,
        provider: Provider.FACEBOOK,
        id: generateUUID(),
        email: primaryEmail,
        firstName: fbUser.first_name,
        lastName: fbUser.last_name,
        image: fbUser.picture?.data?.url || null,
        emailVerified: true, // Facebook does not provide verification status, assume true
        status: "active",
        isAdmin: false
    });

    // Set auth session token
    const sessionToken = generateSessionToken();
    const session = await createSession(sessionToken, newUser.id);

    // Handle cart merging
    await cartRepository.handleUserLoginMerge(cartSessionId, newUser.id);

    // Set cookies
    event.cookies.set('auth-session', sessionToken, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        expires: session.expiresAt,
        domain: ''
    });
    event.cookies.set('cart-session', cartSessionId, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        domain: ''
    });
    event.cookies.delete('oauth_redirect', { path: '/' });
    event.cookies.delete('facebook_oauth_state', { path: '/' });
    return new Response(null, {
        status: 303,
        headers: {
            Location: redirectTo
        }
    });
} 