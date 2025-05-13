import fs from 'fs';
import { marked } from 'marked';
import path from 'path';
import { locales, baseLocale } from '$lib/paraglide/runtime.js';

/**
 * Use Paraglide's own locale type
 * Inferred from the locales array in runtime.js
 */
type Locale = typeof locales[number];

/**
 * Loads markdown content for a specific page and language
 * @param page The page name (e.g., 'about')
 * @param locale The language code (e.g., 'en', 'de')
 * @returns HTML content and metadata
 */
export async function loadContent(page: string, locale: Locale = baseLocale): Promise<{ html: string; metadata?: Record<string, string> }> {
    // Use the requested locale or fall back to the base locale if not supported
    const targetLocale = locales.includes(locale) ? locale : baseLocale;

    // Define the path to the content file
    const contentPath = path.join(process.cwd(), 'content', page, `${targetLocale}.md`);

    try {
        // Check if the file exists in the requested language
        if (fs.existsSync(contentPath)) {
            const content = fs.readFileSync(contentPath, 'utf-8');
            const html = marked.parse(content) as string;
            return { html };
        }

        // Fall back to base locale if the requested language file doesn't exist
        if (targetLocale !== baseLocale) {
            const fallbackPath = path.join(process.cwd(), 'content', page, `${baseLocale}.md`);
            if (fs.existsSync(fallbackPath)) {
                const content = fs.readFileSync(fallbackPath, 'utf-8');
                const html = marked.parse(content) as string;
                return { html };
            }
        }

        return { html: '' };
    } catch {
        return { html: '' };
    }
} 