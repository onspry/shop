import type { PageServerLoad } from './$types';
import { loadContent } from '$lib/utils/content-loader';
import { parseStructuredContent } from '$lib/utils/content-parser';

export const load: PageServerLoad = async ({ locals, cookies }) => {
    // Get the user's preferred language from locals
    const locale = locals.paraglide?.lang || cookies.get('PARAGLIDE_LOCALE') || 'en';
    console.log(`[USER-MANUAL-PAGE] Loading content with locale: ${locale}`);

    // Load content for the User Manual in the user's language
    const { html } = await loadContent('user-manual', locale);

    // Parse the HTML content into structured sections
    const structuredContent = parseStructuredContent(html);

    return {
        ...structuredContent,
        locale // Return the locale so we can verify it in the client
    };
}; 