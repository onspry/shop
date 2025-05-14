import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

// This handler just redirects to the login page component
export const GET: RequestHandler = async ({ url }) => {
    const redirectParam = url.searchParams.get('redirect');
    const redirectQuery = redirectParam ? `?redirect=${redirectParam}` : '';

    throw redirect(307, `/auth/login${redirectQuery}`);
}; 