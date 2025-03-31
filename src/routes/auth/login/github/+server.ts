import { github } from "$lib/server/auth/oauth";
import { generateState } from "arctic";

import type { RequestEvent } from "./$types";

export function GET(event: RequestEvent): Response {
    // Capture the current cart session ID
    const cartSessionId = event.cookies.get('cart-session') || '';
    console.log(`[GITHUB-LOGIN] Current cart session ID: "${cartSessionId}"`);

    // Generate state for OAuth flow
    const state = generateState();
    const url = github.createAuthorizationURL(state, ["user:email"]);

    // Set the GitHub OAuth state cookie
    event.cookies.set("github_oauth_state", state, {
        httpOnly: true,
        maxAge: 60 * 10, // 10 minutes
        secure: import.meta.env.PROD,
        path: "/",
        sameSite: "lax"
    });

    // IMPORTANT: Also save the current cart session ID in a temporary cookie
    // This will be read by the callback to preserve the cart session
    if (cartSessionId) {
        console.log(`[GITHUB-LOGIN] Storing cart session ID for callback: "${cartSessionId}"`);
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