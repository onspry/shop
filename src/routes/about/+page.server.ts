import type { PageServerLoad } from './$types';
import { loadContent } from '$lib/utils/content-loader';
import { dev } from '$app/environment';
import { prisma } from '$lib/server/db';
import { version } from '$app/environment';
import { Prisma } from '@prisma/client';

/**
 * Example of a Prisma JSON value for debugging
 */
const jsonExample = {
    string: "value",
    number: 123,
    boolean: true,
    array: [1, 2, 3],
    nested: {
        property: "value"
    }
};

export const load: PageServerLoad = async ({ locals }) => {
    // Get the user's preferred language from locals
    const locale = locals.paraglide?.lang || 'en';

    // Load content for the About page in the user's language
    const { html } = await loadContent('about', locale);

    // Only include debug info in development
    const debugInfo = dev ? {
        locale,
        serverInfo: {
            nodeVersion: process.version,
            platform: process.platform,
            svelteVersion: version
        },
        prismaInfo: {
            jsonHandling: {
                example: jsonExample,
                type: typeof jsonExample,
                // Show how Prisma would stringify this as JsonValue
                stringified: JSON.stringify(jsonExample as Prisma.JsonValue),
                // Demonstrate the JSON reparse behavior similar to in the order repository
                reparsed: JSON.parse(JSON.stringify(jsonExample))
            }
        }
    } : null;

    return {
        content: html,
        debug: debugInfo
    };
}; 