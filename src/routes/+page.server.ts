import type { PageServerLoad } from './$types';
import { productRepository } from '$lib/repositories/product-repository';

export const load: PageServerLoad = async ({ locals }) => {
    const page = 1;
    const pageSize = 4; // Show 4 featured products
    const locale = locals.paraglide?.lang || 'en';

    const catalogue = await productRepository.getCatalogue(page, pageSize, locale);
    const products = catalogue.productGroups?.flatMap((group) => group.products) ?? [];

    return {
        products
    };
}; 