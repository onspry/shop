import type { PageServerLoad } from './$types';
import { productRepo } from '$lib/server/db/repositories';
import { error } from '@sveltejs/kit';
import type { Product, ProductVariant, ProductImage } from '$lib/server/db';

interface CompatibilityResult {
    readonly product: Product;
    readonly variants: readonly ProductVariant[];
    readonly images: readonly ProductImage[];
}

interface ProductPageData {
    readonly product: Product;
    readonly variants: readonly ProductVariant[];
    readonly images: readonly ProductImage[];
    readonly requiredAccessories: Readonly<Record<string, readonly CompatibilityResult[]>>;
    readonly optionalAccessories: Readonly<Record<string, readonly CompatibilityResult[]>>;
    readonly requiredAccessoryCategories: readonly string[];
    readonly optionalAccessoryCategories: readonly string[];
}

export const load: PageServerLoad = async ({ params }): Promise<ProductPageData> => {
    // Use the single repository method that handles all filtering and compatibility logic
    const productDetails = await productRepo.getCompleteProductDetails(params.slug);

    if (!productDetails) {
        error(404, 'Product not found');
    }

    // Return the pre-filtered data with proper immutability
    return Object.freeze({
        product: productDetails.product,
        variants: Object.freeze(productDetails.variants),
        images: Object.freeze(productDetails.images),
        requiredAccessories: Object.freeze(productDetails.requiredAccessories),
        optionalAccessories: Object.freeze(productDetails.optionalAccessories),
        requiredAccessoryCategories: Object.freeze(productDetails.requiredAccessoryCategories),
        optionalAccessoryCategories: Object.freeze(productDetails.optionalAccessoryCategories)
    }) as ProductPageData;
}; 