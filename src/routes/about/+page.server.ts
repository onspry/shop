import type { PageServerLoad } from './$types';
import { loadContent } from '$lib/utils/content-loader';
import { parseStructuredContent } from '$lib/utils/content-parser';

export const load: PageServerLoad = async ({ locals }) => {
    console.log('[About Page] Starting load function');

    // Get the user's preferred language from locals
    const locale = locals.paraglide?.lang || 'en';
    console.log(`[About Page] User locale from paraglide: ${locale}`);

    // Load content for the About page in the user's language
    console.log('[About Page] Calling loadContent function');
    const { html } = await loadContent('about', locale);
    console.log(`[About Page] Content loaded, HTML length: ${html.length} chars`);

    // Parse the HTML content into structured sections
    const structuredContent = parseStructuredContent(html);
    console.log(`[About Page] Processed content into ${structuredContent.sections.length} sections`);
    console.log('[About Page] Load function completed');

    return structuredContent;
}; 