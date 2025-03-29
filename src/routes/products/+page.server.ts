import { productRepo } from '$lib/server/repositories/product';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
    const startTime = performance.now();

    const page = Number(url.searchParams.get('page')) || 1;
    const pageSize = Number(url.searchParams.get('pageSize')) || 50;

    console.log(`[Products Page] Starting load for page ${page}, size ${pageSize}`);

    const catalogue = await productRepo.getCatalogue(page, pageSize);

    const endTime = performance.now();
    console.log(`[Products Page] Load completed in ${(endTime - startTime).toFixed(2)}ms`);
    console.log(`[Products Page] Loaded ${catalogue.totalProducts} products in ${catalogue.productGroups.length} categories`);

    return { catalogue };
}; 