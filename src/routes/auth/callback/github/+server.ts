import { generateSessionToken, createSession } from "$lib/server/auth/session";
import { userRepo } from "$lib/server/repositories/user";
import { github } from "$lib/server/auth/oauth";
import { randomUUID } from 'crypto';
import type { RequestEvent } from "@sveltejs/kit";
import type { OAuth2Tokens } from "arctic";
import { cartRepository } from "$lib/server/repositories/cart";
import { Providers } from "$lib/server/db";

export async function GET(event: RequestEvent): Promise<Response> {
    console.log('[GITHUB-OAUTH] ==================== START GITHUB OAUTH CALLBACK ====================');

    // Check code and state
    const code = event.url.searchParams.get("code");
    const state = event.url.searchParams.get("state");
    const storedState = event.cookies.get("github_oauth_state") ?? null;
    if (code === null || state === null || storedState === null) {
        console.log('[GITHUB-OAUTH] Missing code, state, or stored state');
        return new Response(null, {
            status: 400
        });
    }
    if (state !== storedState) {
        console.log('[GITHUB-OAUTH] State mismatch');
        return new Response(null, {
            status: 400
        });
    }

    // Validate authorization code
    let tokens: OAuth2Tokens;
    try {
        tokens = await github.validateAuthorizationCode(code);
    } catch (error) {
        console.log('[GITHUB-OAUTH] Invalid authorization code:', error);
        return new Response(null, {
            status: 400
        });
    }

    // Get GitHub user data
    const githubUserResponse = await fetch("https://api.github.com/user", {
        headers: {
            Authorization: `Bearer ${tokens.accessToken()}`
        }
    });
    const githubUser = await githubUserResponse.json();
    const githubUserId = githubUser.id;
    const primaryEmail = githubUser.email;

    // CRITICAL: Get the cart session ID from the current cookie OR the preserved cookie
    let cartSessionId = event.cookies.get('cart-session') || '';
    const preservedCartSessionId = event.cookies.get('preserved_cart_session') || '';

    // Use the preserved cart session if available and current is empty
    if (!cartSessionId && preservedCartSessionId) {
        cartSessionId = preservedCartSessionId;
        console.log(`[GITHUB-OAUTH] Restored cart session from preserved cookie: "${cartSessionId}"`);
    } else if (cartSessionId) {
        console.log(`[GITHUB-OAUTH] Using existing cart session cookie: "${cartSessionId}"`);
    } else {
        console.log(`[GITHUB-OAUTH] No cart session found in cookies`);
    }

    // Log all current cookies for debugging
    const allCookies = event.request.headers.get('cookie') || '';
    console.log(`[GITHUB-OAUTH] All cookies before auth: ${allCookies}`);

    // If no cart session exists yet, create one now
    if (!cartSessionId) {
        cartSessionId = `session_${randomUUID()}`;
        console.log(`[GITHUB-OAUTH] Created new cart session: "${cartSessionId}"`);
    }

    // Clean up the temporary preserved cart session cookie
    if (preservedCartSessionId) {
        event.cookies.delete('preserved_cart_session', { path: '/' });
        console.log(`[GITHUB-OAUTH] Cleaned up preserved cart session cookie`);
    }

    // First check for existing user by provider ID
    const existingUser = await userRepo.getByProviderId(Providers.GITHUB, githubUserId.toString());
    if (existingUser) {
        console.log(`[GITHUB-OAUTH] Found existing user: ${existingUser.id}`);

        // Set auth session token
        const sessionToken = generateSessionToken();
        const session = await createSession(sessionToken, existingUser.id);

        // Now handle cart merge
        const cartId = await cartRepository.handleUserLoginMerge(cartSessionId, existingUser.id);
        console.log(`[GITHUB-OAUTH] Cart merge complete, resulting cart ID: ${cartId || 'none'}`);

        // CRITICAL BUGFIX: Use redirect with SvelteKit's cookies API instead of manual Response
        event.cookies.set('auth-session', sessionToken, {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            expires: session.expiresAt
        });

        // Set the cart session cookie
        event.cookies.set('cart-session', cartSessionId, {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 30 // 30 days
        });

        console.log(`[GITHUB-OAUTH] Set cookies using SvelteKit cookies API - auth-session and cart-session: "${cartSessionId}"`);
        console.log('[GITHUB-OAUTH] ==================== END GITHUB OAUTH CALLBACK ====================');

        return new Response(null, {
            status: 303,
            headers: {
                Location: "/"
            }
        });
    }

    // If no user found by provider ID, check by email
    const existingUserByEmail = await userRepo.getByEmail(githubUser.email);
    if (existingUserByEmail) {
        // Redirect with more detailed error information
        const searchParams = new URLSearchParams({
            error: 'email_exists',
            email: primaryEmail,
            provider: existingUserByEmail.provider,
            attempted_provider: 'github'
        });

        console.log(`[GITHUB-OAUTH] Email exists with different provider: ${primaryEmail}`);
        console.log('[GITHUB-OAUTH] ==================== END GITHUB OAUTH CALLBACK ====================');

        return new Response(null, {
            status: 302,
            headers: {
                Location: `/auth/error?${searchParams.toString()}`
            }
        });
    }

    // Create new user
    console.log(`[GITHUB-OAUTH] Creating new user for GitHub user ID: ${githubUserId}`);
    const newUser = await userRepo.create({
        id: randomUUID(),
        provider: Providers.GITHUB,
        providerId: githubUserId.toString(),
        email: githubUser.email,
        firstname: githubUser.name ? githubUser.name.split(' ')[0] : githubUser.login,
        lastname: githubUser.name ? githubUser.name.split(' ').slice(1).join(' ') : '',
        image: githubUser.avatar_url,
        status: 'active',
        emailVerified: true,
        passwordHash: null,
        isAdmin: false,
        stripeCustomerId: null,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
    });

    // Set auth session token
    const sessionToken = generateSessionToken();
    const session = await createSession(sessionToken, newUser.id);

    // Handle cart merging
    const cartId = await cartRepository.handleUserLoginMerge(cartSessionId, newUser.id);
    console.log(`[GITHUB-OAUTH] Cart merge complete, resulting cart ID: ${cartId || 'none'}`);

    // CRITICAL BUGFIX: Use redirect with SvelteKit's cookies API instead of manual Response
    event.cookies.set('auth-session', sessionToken, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        expires: session.expiresAt
    });

    // Set the cart session cookie
    event.cookies.set('cart-session', cartSessionId, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30 // 30 days
    });

    console.log(`[GITHUB-OAUTH] Set cookies using SvelteKit cookies API - auth-session and cart-session: "${cartSessionId}"`);
    console.log('[GITHUB-OAUTH] ==================== END GITHUB OAUTH CALLBACK ====================');

    return new Response(null, {
        status: 303,
        headers: {
            Location: "/"
        }
    });
}