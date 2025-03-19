import type { PageServerLoad } from './$types';
import { productRepo } from '$lib/server/db/repositories/productRepo';
import { error } from '@sveltejs/kit';
import { toProductViewModel } from '$lib/types/product';

export const load: PageServerLoad = async ({ params }) => {
    const productData = await productRepo.getCompleteProductDetails(params.slug);

    if (!productData) {
        error(404, 'Product not found');
    }

    console.log('Raw product data:', {
        product: productData.product,
        variants: productData.variants,
        images: productData.images
    });

    // Transform the data using our ViewModel
    const productViewModel = toProductViewModel(
        productData.product,
        productData.variants,
        productData.images
    );

    console.log('Transformed product view model:', productViewModel);

    // Transform accessories
    const transformedRequiredAccessories = Object.entries(productData.requiredAccessories || {}).reduce(
        (acc, [category, accessories]) => ({
            ...acc,
            [category]: accessories.map(accessory => ({
                ...accessory,
                product: toProductViewModel(
                    accessory.product,
                    accessory.variants,
                    accessory.images
                )
            }))
        }),
        {}
    );

    console.log('Transformed required accessories:', transformedRequiredAccessories);

    const transformedOptionalAccessories = Object.entries(productData.optionalAccessories || {}).reduce(
        (acc, [category, accessories]) => ({
            ...acc,
            [category]: accessories.map(accessory => ({
                ...accessory,
                product: toProductViewModel(
                    accessory.product,
                    accessory.variants,
                    accessory.images
                )
            }))
        }),
        {}
    );

    const result = {
        product: productViewModel,
        variants: productData.variants,
        images: productData.images,
        requiredAccessories: transformedRequiredAccessories,
        optionalAccessories: transformedOptionalAccessories,
        requiredAccessoryCategories: productData.requiredAccessoryCategories,
        optionalAccessoryCategories: productData.optionalAccessoryCategories
    };

    console.log('Final result:', result);

    return result;
}; 