import { generateSessionToken, createSession } from "$lib/server/auth/session";
import { userRepo } from "$lib/server/repositories/user";
import { github } from "$lib/server/auth/oauth";
import { randomUUID } from 'crypto';
import type { RequestEvent } from "@sveltejs/kit";
import type { OAuth2Tokens } from "arctic";
import { Providers } from "$lib/server/db_drizzle/schema";
import { cartRepository } from "$lib/server/db/prisma/repositories/cart-repository";

export async function GET(event: RequestEvent): Promise<Response> {
    // Get the stored redirect URL from the cookie
    const redirectTo = event.cookies.get('oauth_redirect') || '/';

    // Check code and state
    const code = event.url.searchParams.get("code");
    const state = event.url.searchParams.get("state");
    const storedState = event.cookies.get("github_oauth_state") ?? null;
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

    // Validate authorization code
    let tokens: OAuth2Tokens;
    try {
        tokens = await github.validateAuthorizationCode(code);
    } catch {
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
    }

    // If no cart session exists yet, create one now
    if (!cartSessionId) {
        cartSessionId = `session_${randomUUID()}`;
    }

    // Clean up the temporary preserved cart session cookie
    if (preservedCartSessionId) {
        event.cookies.delete('preserved_cart_session', { path: '/' });
    }

    // First check for existing user by provider ID
    const existingUser = await userRepo.getByProviderId(Providers.GITHUB, githubUserId.toString());
    if (existingUser) {
        // Set auth session token
        const sessionToken = generateSessionToken();
        const session = await createSession(sessionToken, existingUser.id);

        // Now handle cart merge
        await cartRepository.handleUserLoginMerge(cartSessionId, existingUser.id);

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

        // Clean up OAuth cookies
        event.cookies.delete('oauth_redirect', { path: '/' });
        event.cookies.delete('github_oauth_state', { path: '/' });

        return new Response(null, {
            status: 303,
            headers: {
                Location: redirectTo
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

        return new Response(null, {
            status: 302,
            headers: {
                Location: `/auth/error?${searchParams.toString()}`
            }
        });
    }

    // Create new user
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
    await cartRepository.handleUserLoginMerge(cartSessionId, newUser.id);

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

    // Clean up OAuth cookies
    event.cookies.delete('oauth_redirect', { path: '/' });
    event.cookies.delete('github_oauth_state', { path: '/' });

    return new Response(null, {
        status: 303,
        headers: {
            Location: redirectTo
        }
    });
}