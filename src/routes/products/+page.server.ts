import type { PageServerLoad } from './$types';
import { productRepository } from '$lib/repositories/product-repository';

// Configure prerendering and caching
export const prerender = false; // Disable prerendering as we need access to URL search params
export const config = {
    isr: {
        // Enable Incremental Static Regeneration
        // Regenerate the page every hour
        revalidate: 3600
    }
};

export const load: PageServerLoad = async ({ url }) => {
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('size') || '12', 10);

    const catalogue = await productRepository.getCatalogue(page, pageSize);

    return {
        catalogue
    };
}; 