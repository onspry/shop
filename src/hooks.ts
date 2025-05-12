import type { Reroute } from '@sveltejs/kit';
import { deLocalizeUrl } from '$lib/paraglide/runtime';

export const reroute: Reroute = (request) => {
    // Use Paraglide's built-in deLocalizeUrl to properly handle all URLs
    // The URL patterns in vite.config.ts will ensure 'en' is never in the URL
    return deLocalizeUrl(request.url).pathname;
};
