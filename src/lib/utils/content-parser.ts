/**
 * Parses HTML content from markdown into structured sections
 * @param html HTML content generated from markdown
 * @returns Structured content with title, intro, and sections
 */
export function parseStructuredContent(html: string) {
    // Extract the main title (h1)
    let title = 'Page Title';
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
        // Convert plain URLs to links in intro section
        intro = convertUrlsToLinks(intro);
        contentWithoutTitle = contentWithoutTitle.replace(introMatch[1], '').trim();
    }

    // Split remaining content by h2 tags
    const sectionMatches = contentWithoutTitle.matchAll(/<h2>(.*?)<\/h2>(.*?)(?=<h2>|$)/gs);

    for (const match of sectionMatches) {
        if (match.length >= 3) {
            const sectionTitle = match[1].trim();
            let sectionContent = match[2].trim();
            // Convert plain URLs to links in section content
            sectionContent = convertUrlsToLinks(sectionContent);
            sections.push({
                title: sectionTitle,
                content: sectionContent
            });
        }
    }

    return {
        title,
        intro,
        sections
    };
}

/**
 * Converts plain text URLs to HTML anchor tags
 * @param content HTML content that may contain plain URLs
 * @returns HTML content with URLs converted to links
 */
function convertUrlsToLinks(content: string): string {
    // Regular expression to match URLs that aren't already in HTML links
    // This matches URLs starting with http://, https://, or www.
    const urlRegex = /(?<!["'=])(https?:\/\/|www\.)[^\s<>]+\.[^\s<>]+(?!["'>])/g;

    // Replace URLs with HTML links
    return content.replace(urlRegex, (url) => {
        // Add https:// prefix if the URL starts with www.
        const fullUrl = url.startsWith('www.') ? `https://${url}` : url;
        return `<a href="${fullUrl}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
} 