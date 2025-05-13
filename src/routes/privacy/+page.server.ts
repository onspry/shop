import type { PageServerLoad } from './$types';
import { loadContent } from '$lib/utils/content-loader';
import { parseStructuredContent } from '$lib/utils/content-parser';

export const load: PageServerLoad = async ({ locals }) => {
    // Get the user's preferred language from locals
    const locale = locals.paraglide?.lang || 'en';

    // Load content for the Privacy page in the user's language
    const { html } = await loadContent('privacy', locale);

    // Parse the HTML content into structured sections
    const structuredContent = parseStructuredContent(html);

    return structuredContent;
}; 