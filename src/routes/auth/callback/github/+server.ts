import { generateSessionToken, createSession, setSessionTokenCookie } from "$lib/server/auth/session";
import { userRepo } from "$lib/server/repositories/user";
import { github } from "$lib/server/auth/oauth";
import { randomUUID } from 'crypto';
import type { RequestEvent } from "@sveltejs/kit";
import type { OAuth2Tokens } from "arctic";
import { transferCartToUser } from "$lib/server/repositories/cart";
import { Providers } from "$lib/server/db";

export async function GET(event: RequestEvent): Promise<Response> {
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

    let tokens: OAuth2Tokens;
    try {
        tokens = await github.validateAuthorizationCode(code);
    } catch {
        // Invalid code or client credentials
        return new Response(null, {
            status: 400
        });
    }
    const githubUserResponse = await fetch("https://api.github.com/user", {
        headers: {
            Authorization: `Bearer ${tokens.accessToken()}`
        }
    });
    const githubUser = await githubUserResponse.json();
    const githubUserId = githubUser.id;
    const primaryEmail = githubUser.email;

    // First check for existing user by provider ID
    const existingUser = await userRepo.getByProviderId(Providers.GITHUB, githubUserId.toString());
    if (existingUser) {
        const sessionToken = generateSessionToken();
        const session = await createSession(sessionToken, existingUser.id);
        setSessionTokenCookie(event, sessionToken, session.expiresAt);

        // Transfer guest cart to user
        await transferCartToUser(event.cookies.get('session') || '', existingUser.id);

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

    const sessionToken = generateSessionToken();
    const session = await createSession(sessionToken, newUser.id);
    setSessionTokenCookie(event, sessionToken, session.expiresAt);

    // Transfer guest cart to new user
    await transferCartToUser(event.cookies.get('session') || '', newUser.id);

    return new Response(null, {
        status: 303,
        headers: {
            Location: "/"
        }
    });
}