import type { PageServerLoad } from './$types';
import { loadContent } from '$lib/utils/content-loader';

export const load: PageServerLoad = async ({ locals }) => {
    console.log('[About Page] Starting load function');

    // Get the user's preferred language from locals
    const locale = locals.paraglide?.lang || 'en';
    console.log(`[About Page] User locale from paraglide: ${locale}`);

    // Load content for the About page in the user's language
    console.log('[About Page] Calling loadContent function');
    const { html } = await loadContent('about', locale);
    console.log(`[About Page] Content loaded, HTML length: ${html.length} chars`);

    // Extract the main title (h1)
    let title = 'About Us';
    const titleMatch = html.match(/<h1>(.*?)<\/h1>/);
    if (titleMatch && titleMatch[1]) {
        title = titleMatch[1];
    }

    // Structure the content by sections (h2)
    const sections = [];

    // Split content by h2 headings
    let contentWithoutTitle = html.replace(/<h1>.*?<\/h1>/, '').trim();

    // Extract intro paragraph (content before first h2)
    let intro = '';
    const introMatch = contentWithoutTitle.match(/^(.*?)(?=<h2>|$)/s);
    if (introMatch && introMatch[1]) {
        intro = introMatch[1].trim();
        contentWithoutTitle = contentWithoutTitle.replace(intro, '').trim();
    }

    // Split remaining content by h2 tags
    const sectionMatches = contentWithoutTitle.matchAll(/<h2>(.*?)<\/h2>(.*?)(?=<h2>|$)/gs);

    for (const match of sectionMatches) {
        if (match.length >= 3) {
            const sectionTitle = match[1].trim();
            const sectionContent = match[2].trim();
            sections.push({
                title: sectionTitle,
                content: sectionContent
            });
        }
    }

    console.log(`[About Page] Processed content into ${sections.length} sections`);
    console.log('[About Page] Load function completed');

    return {
        title,
        intro,
        sections
    };
}; 