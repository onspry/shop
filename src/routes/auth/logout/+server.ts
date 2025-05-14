import { deleteSessionTokenCookie } from '$lib/server/auth/session';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
    console.log('Logout endpoint hit');

    // Delete the session cookie
    console.log('About to delete session cookie');
    deleteSessionTokenCookie(event);
    console.log('Session cookie deleted');

    // Get the current locale from the event.locals.paraglide
    // The paraglide middleware adds this to event.locals
    const locale = event.locals.paraglide?.locale || 'en';

    // Determine the proper homepage URL based on locale
    // If locale is English (default), redirect to /, otherwise redirect to /locale/
    const homeUrl = locale === 'en' ? '/' : `/${locale}`;

    // Set a flag in the response to clear checkout data on the client
    const response = new Response(null, {
        status: 302,
        headers: {
            'Location': homeUrl,
            'X-Clear-Checkout': 'true'
        }
    });

    return response;
};