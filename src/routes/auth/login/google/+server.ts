import { google } from "$lib/server/auth/oauth";
import { generateState } from "arctic";
import type { RequestEvent } from "./$types";

export function GET(event: RequestEvent): Response {
    // Get the redirect URL from query parameters
    const redirectTo = event.url.searchParams.get('redirect') || '/';

    // Capture the current cart session ID
    const cartSessionId = event.cookies.get('cart-session') || '';

    // Generate state for OAuth flow
    const state = generateState();
    const codeVerifier = generateState(); // Generate a code verifier for PKCE
    const url = google.createAuthorizationURL(
        state,
        codeVerifier,
        ["https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"]
    );

    console.log('[SERVER] Google authorization URL created successfully');

    // Set the Google OAuth state cookie
    event.cookies.set("google_oauth_state", state, {
        httpOnly: true,
        maxAge: 60 * 10, // 10 minutes
        secure: import.meta.env.PROD,
        path: "/",
        sameSite: "lax"
    });

    // Store the code verifier for PKCE
    event.cookies.set("google_code_verifier", codeVerifier, {
        httpOnly: true,
        maxAge: 60 * 10, // 10 minutes
        secure: import.meta.env.PROD,
        path: "/",
        sameSite: "lax"
    });

    // Store the redirect URL in a cookie
    event.cookies.set("oauth_redirect", redirectTo, {
        httpOnly: true,
        maxAge: 60 * 10, // 10 minutes
        secure: import.meta.env.PROD,
        path: "/",
        sameSite: "lax"
    });

    // IMPORTANT: Also save the current cart session ID in a temporary cookie
    // This will be read by the callback to preserve the cart session
    if (cartSessionId) {
        event.cookies.set("preserved_cart_session", cartSessionId, {
            httpOnly: true,
            maxAge: 60 * 10, // 10 minutes - same as the state
            secure: import.meta.env.PROD,
            path: "/",
            sameSite: "lax"
        });
    }

    return new Response(null, {
        status: 302,
        headers: {
            Location: url.toString()
        }
    });
} 