import type { PageServerLoad } from './$types';
import { productRepo } from '$lib/server/db/db_drizzle/repositories/product';

export const load: PageServerLoad = async ({ url }) => {
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('size') || '12', 10);

    const catalogue = await productRepo.getCatalogue(page, pageSize);

    return {
        catalogue
    };
}; 