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
        // Add enhanced styling to intro with modern e-commerce design
        intro = `
            <div class="relative">
                <div class="absolute inset-0 bg-gradient-to-r from-orange-50 to-transparent dark:from-orange-950/20 dark:to-transparent rounded-2xl"></div>
                <div class="relative prose prose-orange dark:prose-invert max-w-none text-lg leading-relaxed text-muted-foreground p-6 md:p-8">
                    ${intro}
                </div>
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
        // Add enhanced styling to content sections with modern e-commerce design
        content = `
            <div class="group relative overflow-hidden rounded-2xl border border-muted/50 bg-background/80 p-6 md:p-8 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-orange-200/50 hover:shadow-lg dark:bg-background/80 dark:hover:border-orange-900/50">
                <div class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30 dark:bg-[radial-gradient(#404040_1px,transparent_1px)]"></div>
                <div class="relative">
                    <div class="prose prose-orange dark:prose-invert max-w-none">
                        ${content}
                    </div>
                </div>
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

    // Replace internal hrefs with localized versions
    return content.replace(internalLinkRegex, (match, path, rest) => {
        // Make sure path starts with / for localizeHref
        const internalPath = path.startsWith('/') ? path : `/${path}`;
        return `<a href="${localizeHref(internalPath)}" class="inline-flex items-center gap-1 text-orange-600 transition-colors hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"${rest}>`;
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
    let processedContent = content.replace(urlRegex, (url) => {
        // Add https:// prefix if the URL starts with www.
        const fullUrl = url.startsWith('www.') ? `https://${url}` : url;
        return `<a href="${fullUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-orange-600 transition-colors hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300">${url}</a>`;
    });

    // Add enhanced styling to images with modern e-commerce design
    processedContent = processedContent.replace(
        /<img([^>]*)>/g,
        '<div class="group relative overflow-hidden rounded-2xl bg-muted/50"><img$1 class="w-full object-cover transition-transform duration-500 group-hover:scale-105"></div>'
    );

    // Add enhanced styling to blockquotes with modern e-commerce design
    processedContent = processedContent.replace(
        /<blockquote([^>]*)>/g,
        '<blockquote$1 class="relative rounded-2xl border-l-4 border-orange-200 bg-orange-50/50 p-6 dark:border-orange-800 dark:bg-orange-950/20">'
    );

    // Add enhanced styling to code blocks with modern e-commerce design
    processedContent = processedContent.replace(
        /<code([^>]*)>/g,
        '<code$1 class="rounded-lg bg-muted px-2 py-1 text-sm font-medium text-foreground">'
    );
    processedContent = processedContent.replace(
        /<pre([^>]*)>/g,
        '<pre$1 class="rounded-2xl border border-muted bg-muted/50 p-6 shadow-sm">'
    );
    processedContent = processedContent.replace(
        /<pre[^>]*><code([^>]*)>/g,
        '<pre class="rounded-2xl border border-muted bg-muted/50 p-6 shadow-sm"><code$1 class="bg-transparent p-0 text-sm">'
    );

    // Add enhanced styling to tables with modern e-commerce design
    processedContent = processedContent.replace(
        /<table([^>]*)>/g,
        '<div class="overflow-x-auto rounded-2xl border border-muted"><table$1 class="w-full border-collapse">'
    );
    processedContent = processedContent.replace(
        /<\/table>/g,
        '</table></div>'
    );
    processedContent = processedContent.replace(
        /<th([^>]*)>/g,
        '<th$1 class="border-b border-muted bg-muted/50 px-6 py-4 text-left font-medium text-foreground">'
    );
    processedContent = processedContent.replace(
        /<td([^>]*)>/g,
        '<td$1 class="border-b border-muted px-6 py-4 text-muted-foreground">'
    );

    // Add enhanced styling to lists with modern e-commerce design
    processedContent = processedContent.replace(
        /<ul([^>]*)>/g,
        '<ul$1 class="space-y-2">'
    );
    processedContent = processedContent.replace(
        /<ol([^>]*)>/g,
        '<ol$1 class="space-y-2">'
    );
    processedContent = processedContent.replace(
        /<li([^>]*)>/g,
        '<li$1 class="relative pl-6 before:absolute before:left-0 before:top-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-orange-500">'
    );

    return processedContent;
} 