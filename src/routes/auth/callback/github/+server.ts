import { generateSessionToken, createSession, setSessionTokenCookie } from "$lib/server/auth/session";
import { getUserByProviderId, createUser } from "$lib/server/auth/user"
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

    console.log('GitHub User Response:', {
        fullResponse: githubUser,
        id: githubUserId,
        username: githubUsername,
        email: primaryEmail
    });

    // TODO: Replace this with your own DB query.
    const existingUser = await getUserByProviderId(Providers.github, githubUserId.toString());
    console.log('Existing User:', existingUser);
    if (existingUser) {
        console.log('Existing User:', existingUser);
        const sessionToken = generateSessionToken();
        const session = await createSession(sessionToken, existingUser.id);
        setSessionTokenCookie(event, sessionToken, session.expiresAt);
        return new Response(null, {
            status: 302,
            headers: {
                Location: "/"
            }
        });
    }

    // TODO: Replace this with your own DB query.
    const user = await createUser({
        id: randomUUID(),
        provider: 'github',
        providerId: githubUserId.toString(),
        email: primaryEmail,
        username: githubUsername,
        passwordHash: '',  // Empty for OAuth users
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