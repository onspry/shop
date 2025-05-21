import { localizeHref } from '$lib/paraglide/runtime';

/**
 * Interface for a single content section with support for nesting
 */
export interface ContentSection {
    title: string;
    content: string;
    level: number;
    children: ContentSection[];
}

/**
 * Interface for the complete structured content
 */
export interface StructuredContent {
    title: string;
    intro: string;
    sections: ContentSection[];
}

/**
 * Parses HTML content from markdown into structured sections with nested hierarchy
 * @param html HTML content generated from markdown
 * @returns Structured content with title, intro, and nested sections
 */
export function parseStructuredContent(html: string): StructuredContent {
    // Extract the main title (h1)
    let title = 'Page Title';
    const titleMatch = html.match(/<h1>(.*?)<\/h1>/);
    if (titleMatch && titleMatch[1]) {
        title = titleMatch[1];
    }

    // Remove the title from content
    let contentWithoutTitle = html.replace(/<h1>.*?<\/h1>/, '').trim();

    // Extract intro paragraph (content before first heading)
    let intro = '';
    const introMatch = contentWithoutTitle.match(/^(.*?)(?=<h[2-6]>|$)/s);
    if (introMatch && introMatch[1]) {
        intro = introMatch[1].trim();
        // Convert plain URLs to links in intro section
        intro = convertUrlsToLinks(intro);
        intro = localizeInternalHrefs(intro);
        contentWithoutTitle = contentWithoutTitle.replace(introMatch[1], '').trim();
    }

    // Find all heading tags (h2, h3, h4, h5, h6) and their content
    const headingPattern = /<h([2-6])>(.*?)<\/h\1>(.*?)(?=<h[2-6]>|$)/gs;
    const headings: { level: number; title: string; content: string; index: number }[] = [];

    let match;
    while ((match = headingPattern.exec(contentWithoutTitle)) !== null) {
        const level = parseInt(match[1], 10);
        const title = match[2].trim();
        let content = match[3].trim();
        content = convertUrlsToLinks(content);
        content = localizeInternalHrefs(content);

        headings.push({
            level,
            title,
            content,
            index: match.index
        });
    }

    // Build the hierarchical structure
    const rootSections: ContentSection[] = [];
    const sectionStack: ContentSection[] = [];

    headings.forEach((heading) => {
        const section: ContentSection = {
            title: heading.title,
            content: heading.content,
            level: heading.level,
            children: []
        };

        // Find the appropriate parent based on heading level
        while (
            sectionStack.length > 0 &&
            sectionStack[sectionStack.length - 1].level >= heading.level
        ) {
            sectionStack.pop();
        }

        if (sectionStack.length === 0) {
            // This is a top-level section
            rootSections.push(section);
        } else {
            // This is a child section
            sectionStack[sectionStack.length - 1].children.push(section);
        }

        // Push this section to the stack for potential children
        sectionStack.push(section);
    });

    return {
        title,
        intro,
        sections: rootSections
    };
}

/**
 * Applies localization to internal hrefs in HTML content
 * @param content HTML content that may contain link elements
 * @returns HTML content with localized internal hrefs
 */
function localizeInternalHrefs(content: string): string {
    // Match <a> tags with href attribute that points to internal paths
    // but exclude links that are already external (http://, https://, mailto:, etc.)
    const internalLinkRegex = /<a\s+(?:[^>]*?\s+)?href=["'](?!https?:\/\/|mailto:|tel:|#)([^'"]+)["']([^>]*)>/gi;

    // Replace internal hrefs with localized versions
    return content.replace(internalLinkRegex, (match, path, rest) => {
        // Make sure path starts with / for localizeHref
        const internalPath = path.startsWith('/') ? path : `/${path}`;
        return `<a href="${localizeHref(internalPath)}"${rest}>`;
    });
}

/**
 * Converts plain text URLs to HTML anchor tags
 * @param content HTML content that may contain plain URLs
 * @returns HTML content with URLs converted to links
 */
function convertUrlsToLinks(content: string): string {
    // First, handle plain text URLs that aren't already in HTML links
    // This matches URLs starting with http://, https://, or www.
    const urlRegex = /(?<!["'=])(https?:\/\/|www\.)[^\s<>]+\.[^\s<>]+(?!["'>])/g;

    // Replace plain URLs with HTML links
    const processedContent = content.replace(urlRegex, (url) => {
        // Add https:// prefix if the URL starts with www.
        const fullUrl = url.startsWith('www.') ? `https://${url}` : url;
        return `<a href="${fullUrl}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });

    return processedContent;
} 