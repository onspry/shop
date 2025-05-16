import type { PageServerLoad } from './$types';
import { productRepository } from '$lib/repositories/product-repository';

export const load: PageServerLoad = async ({ locals }) => {
    // Get the current locale from Paraglide
    const locale = locals.paraglide?.lang || 'en';

    // Featured products with localized pricing
    const featuredProducts = await productRepository.getFeaturedProducts(4, locale);

    return {
        featuredProducts
    };
}; 