import { github } from "$lib/server/auth/oauth";
import { generateState } from "arctic";
import type { RequestEvent } from "./$types";

export function GET(event: RequestEvent): Response {
    // Get the redirect URL from query parameters
    const redirectTo = event.url.searchParams.get('redirect') || '/';

    // Capture the current cart session ID
    const cartSessionId = event.cookies.get('cart-session') || '';

    // Generate state for OAuth flow
    const state = generateState();
    const url = github.createAuthorizationURL(state, ["user:email"]);

    console.log('[SERVER] GitHub authorization URL created successfully');

    // Set the GitHub OAuth state cookie
    event.cookies.set("github_oauth_state", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: "/",
        maxAge: 60 * 10, // 10 minutes
        sameSite: "lax",
        domain: '' // Explicitly set empty domain for same-origin only
    });

    // Store the redirect URL in a cookie
    // Ensure the redirect URL is properly formatted for Paraglide internationalization
    const formattedRedirectTo = redirectTo.startsWith('/') ? redirectTo : `/${redirectTo}`;

    event.cookies.set("oauth_redirect", formattedRedirectTo, {
        httpOnly: true,
        maxAge: 60 * 10, // 10 minutes
        secure: import.meta.env.PROD,
        path: "/",
        sameSite: "lax",
        domain: '' // Explicitly set empty domain for same-origin only
    });

    // IMPORTANT: Also save the current cart session ID in a temporary cookie
    // This will be read by the callback to preserve the cart session
    if (cartSessionId) {
        event.cookies.set("preserved_cart_session", cartSessionId, {
            httpOnly: true,
            maxAge: 60 * 10, // 10 minutes - same as the state
            secure: import.meta.env.PROD,
            path: "/",
            sameSite: "lax",
            domain: '' // Explicitly set empty domain for same-origin only
        });
    }

    return new Response(null, {
        status: 302,
        headers: {
            Location: url.toString()
        }
    });
}