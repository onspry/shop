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
        // Clean intro styling - subtle and readable
        intro = `
            <div class="prose max-w-none text-lg leading-relaxed text-muted-foreground mb-12">
                ${intro}
            </div>
        `;
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
        // Clean content section styling - focus on readability
        content = `
            <div class="prose max-w-none">
                ${content}
            </div>
        `;

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

    // Replace internal hrefs with localized versions - clean link styling
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

    // Replace plain URLs with HTML links - clean external link styling
    let processedContent = content.replace(urlRegex, (url) => {
        // Add https:// prefix if the URL starts with www.
        const fullUrl = url.startsWith('www.') ? `https://${url}` : url;
        return `<a href="${fullUrl}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });

    // Clean image styling - simple and elegant
    processedContent = processedContent.replace(
        /<img([^>]*)>/g,
        '<img$1 class="rounded-lg max-w-full h-auto my-6 shadow-sm">'
    );

    // Clean blockquote styling - minimal left border like Svelte blog
    processedContent = processedContent.replace(
        /<blockquote([^>]*)>/g,
        '<blockquote$1 class="border-l-2 border-muted-foreground/20 pl-6 my-6 italic text-muted-foreground">'
    );

    // Clean code styling - simple and readable
    processedContent = processedContent.replace(
        /<code([^>]*)>/g,
        '<code$1 class="bg-muted/50 px-1.5 py-0.5 rounded text-sm font-mono">'
    );

    // Clean pre and code block styling
    processedContent = processedContent.replace(
        /<pre([^>]*)>/g,
        '<pre$1 class="bg-muted/30 border border-muted rounded-lg p-4 my-6 overflow-x-auto">'
    );
    processedContent = processedContent.replace(
        /<pre[^>]*><code([^>]*)>/g,
        '<pre class="bg-muted/30 border border-muted rounded-lg p-4 my-6 overflow-x-auto"><code$1 class="bg-transparent p-0 text-sm font-mono">'
    );

    // Clean table styling - simple borders
    processedContent = processedContent.replace(
        /<table([^>]*)>/g,
        '<div class="overflow-x-auto my-6"><table$1 class="w-full border-collapse border border-muted rounded-lg">'
    );
    processedContent = processedContent.replace(
        /<\/table>/g,
        '</table></div>'
    );
    processedContent = processedContent.replace(
        /<th([^>]*)>/g,
        '<th$1 class="border-b border-muted bg-muted/20 px-4 py-3 text-left font-medium">'
    );
    processedContent = processedContent.replace(
        /<td([^>]*)>/g,
        '<td$1 class="border-b border-muted px-4 py-3">'
    );

    // Clean list styling - using CSS from app.css
    processedContent = processedContent.replace(
        /<ul([^>]*)>/g,
        '<ul$1 class="my-6 space-y-2">'
    );
    processedContent = processedContent.replace(
        /<ol([^>]*)>/g,
        '<ol$1 class="my-6 space-y-2 list-decimal list-inside">'
    );
    processedContent = processedContent.replace(
        /<li([^>]*)>/g,
        '<li$1 class="leading-relaxed">'
    );

    // Add better spacing for paragraphs
    processedContent = processedContent.replace(
        /<p([^>]*)>/g,
        '<p$1 class="my-4 leading-relaxed">'
    );

    // Clean heading styling within content
    processedContent = processedContent.replace(
        /<h2([^>]*)>/g,
        '<h2$1 class="text-2xl font-semibold mt-12 mb-4 first:mt-0">'
    );
    processedContent = processedContent.replace(
        /<h3([^>]*)>/g,
        '<h3$1 class="text-xl font-medium mt-10 mb-3 first:mt-0">'
    );
    processedContent = processedContent.replace(
        /<h4([^>]*)>/g,
        '<h4$1 class="text-lg font-medium mt-8 mb-3 first:mt-0">'
    );
    processedContent = processedContent.replace(
        /<h5([^>]*)>/g,
        '<h5$1 class="text-base font-medium mt-6 mb-2 first:mt-0">'
    );
    processedContent = processedContent.replace(
        /<h6([^>]*)>/g,
        '<h6$1 class="text-sm font-medium mt-6 mb-2 first:mt-0">'
    );

    return processedContent;
} 