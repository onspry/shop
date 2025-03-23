import { productRepo } from '$lib/server/db/repositories/productRepo';
import type { ProductViewModel } from '$lib/types/product';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
    const result = await productRepo.getProduct(params.slug);

    // If this is a keyboard, fetch compatible switches and keycaps
    let switches: ProductViewModel[] = [];
    let keycaps: ProductViewModel[] = [];
    if (result.product.category === 'KEYBOARD') {
        switches = await productRepo.getProductsByCategory('SWITCH');
        keycaps = await productRepo.getProductsByCategory('KEYCAP');
    }

    return {
        product: result.product,
        defaultVariantId: result.defaultVariantId,
        switches,
        keycaps
    };
}; 