import type { PageServerLoad } from './$types';
import { productRepository } from '$lib/repositories/product-repository';

export const load: PageServerLoad = async ({ url }) => {
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('size') || '12', 10);

    const catalogue = await productRepository.getCatalogue(page, pageSize);

    return {
        catalogue
    };
}; 