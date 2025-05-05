import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Image server route handler for Cloudflare Pages
 *
 * This handler redirects image requests to the static assets directory
 * which is automatically handled by Cloudflare Pages
 */
export const GET: RequestHandler = async ({ params, url }) => {
    try {
        // Get the path from the URL
        const imagePath = params.path;
        if (!imagePath) {
            throw error(404, 'Image not found');
        }

        // Get width and height from query parameters
        const width = url.searchParams.get('w');
        const height = url.searchParams.get('h');

        // Log the request for debugging
        console.log(`Redirecting to image: ${imagePath} (${width}x${height})`);

        // In Cloudflare Pages, static assets are served automatically
        // We'll redirect to the static path instead of trying to read the file
        const staticUrl = `/${imagePath}`;

        // Redirect to the static asset with the same query parameters
        const redirectUrl = new URL(staticUrl, url.origin);

        // Copy all query parameters
        url.searchParams.forEach((value, key) => {
            redirectUrl.searchParams.set(key, value);
        });

        // Redirect to the static asset
        return redirect(302, redirectUrl.toString());
    } catch (err) {
        console.error('Error handling image request:', err);
        throw error(500, 'Error handling image request');
    }
};
