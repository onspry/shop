import { generateSessionToken, createSession, setSessionTokenCookie } from "$lib/server/auth/session";
import { getUserByProviderId, createUser, getUserByEmail } from "$lib/server/auth/user"
import { github } from "$lib/server/auth/oauth";
import { randomUUID } from 'crypto';
import type { RequestEvent } from "@sveltejs/kit";
import type { OAuth2Tokens } from "arctic";
import { Providers } from "$lib/server/db/schema";

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
    const githubUsername = githubUser.login;
    const primaryEmail = githubUser.email;

    // First check for existing user by provider ID
    const existingUser = await getUserByProviderId(Providers.github, githubUserId.toString());
    if (existingUser) {
        const sessionToken = generateSessionToken();
        const session = await createSession(sessionToken, existingUser.id);
        setSessionTokenCookie(event, sessionToken, session.expiresAt);
        return new Response(null, {
            status: 302,
            headers: { Location: "/" }
        });
    }

    // Then check if email is already in use by another account
    if (primaryEmail) {
        const existingUserWithEmail = await getUserByEmail(primaryEmail);
        if (existingUserWithEmail) {
            // Redirect with more detailed error information
            const searchParams = new URLSearchParams({
                error: 'email_exists',
                email: primaryEmail,
                provider: existingUserWithEmail.provider,
                attempted_provider: 'github'
            });

            return new Response(null, {
                status: 302,
                headers: {
                    Location: `/auth/error?${searchParams.toString()}`
                }
            });
        }
    }

    const user = await createUser({
        id: randomUUID(),
        provider: 'github',
        providerId: githubUserId.toString(),
        email: primaryEmail,
        image: githubUser.avatar_url,
        username: githubUsername,
        passwordHash: '',  // Empty for OAuth users
        email_verified: 1,
        isAdmin: false,
        stripeCustomerId: `gh_${githubUserId}` // Prefix with gh_ for GitHub users
    });

    const sessionToken = generateSessionToken();
    const session = await createSession(sessionToken, user.id);
    setSessionTokenCookie(event, sessionToken, session.expiresAt);

    return new Response(null, {
        status: 302,
        headers: {
            Location: "/"
        }
    });
}