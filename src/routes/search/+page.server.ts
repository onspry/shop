import type { PageServerLoad } from './$types';
import { productRepository } from '$lib/server/db/prisma/repositories/product-repository';

export const load: PageServerLoad = async ({ url }) => {
    const query = url.searchParams.get('q') || '';
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('size') || '12', 10);

    if (!query) {
        return {
            products: [],
            total: 0,
            query: '',
            page,
            pageSize
        };
    }

    const result = await productRepository.searchProducts(query, page, pageSize);

    return {
        products: result.products,
        total: result.total,
        query,
        page,
        pageSize
    };
};
