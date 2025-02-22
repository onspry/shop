import { deleteSessionTokenCookie } from '$lib/server/auth/session';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
    console.log('Logout endpoint hit');
    // Delete the session cookie
    console.log('About to delete session cookie');
    deleteSessionTokenCookie(event);
    console.log('Session cookie deleted');

    // Redirect to home page
    console.log('Attempting redirect');
    throw redirect(302, "/");
}; 