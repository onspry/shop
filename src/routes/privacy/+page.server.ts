import type { PageServerLoad } from './$types';
import { loadContent } from '$lib/utils/content-loader';
import { parseStructuredContent } from '$lib/utils/content-parser';

export const load: PageServerLoad = async ({ locals }) => {
    console.log('[Privacy Page] Starting load function');

    // Get the user's preferred language from locals
    const locale = locals.paraglide?.lang || 'en';
    console.log(`[Privacy Page] User locale from paraglide: ${locale}`);

    // Load content for the Privacy page in the user's language
    console.log('[Privacy Page] Calling loadContent function');
    const { html } = await loadContent('privacy', locale);
    console.log(`[Privacy Page] Content loaded, HTML length: ${html.length} chars`);

    // Parse the HTML content into structured sections
    const structuredContent = parseStructuredContent(html);
    console.log(`[Privacy Page] Processed content into ${structuredContent.sections.length} sections`);
    console.log('[Privacy Page] Load function completed');

    return structuredContent;
}; 