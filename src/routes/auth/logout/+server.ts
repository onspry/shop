import { deleteSessionTokenCookie } from '$lib/server/auth/session';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
    console.log('Logout endpoint hit');

    // Delete the session cookie
    console.log('About to delete session cookie');
    deleteSessionTokenCookie(event);
    console.log('Session cookie deleted');

    // Set a flag in the response to clear checkout data on the client
    const response = new Response(null, {
        status: 302,
        headers: {
            'Location': '/',
            'X-Clear-Checkout': 'true'
        }
    });

    return response;
};