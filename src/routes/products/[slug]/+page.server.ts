import { productRepo } from '$lib/server/db/repositories/productRepo';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Product, ProductVariant, ProductImage } from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ params }) => {
    const { slug } = params;

    // Get the main product with variants and images
    const productData = await productRepo.getBySlug(slug);

    if (!productData) {
        error(404, { message: 'Product not found' });
    }

    // Get accessory products based on the main product's category
    const accessoryProducts: Product[] = [];
    let accessoryVariants: ProductVariant[] = [];
    let accessoryImages: ProductImage[] = [];

    // If it's a keyboard, load all relevant accessories (switches, keycaps, case)
    if (productData.category?.toUpperCase() === 'KEYBOARD') {
        // Get all accessory categories instead of hardcoding specific ones
        const accessoryCategories = await productRepo.getAccessoryCategories();

        // Fetch products for each accessory category
        for (const category of accessoryCategories) {
            const categoryProducts = await productRepo.getByCategory(category);
            accessoryProducts.push(...categoryProducts);
        }

        // If we have accessory products, get their variants and images
        if (accessoryProducts.length > 0) {
            const accessoryProductIds = accessoryProducts.map(p => p.id);
            accessoryVariants = await productRepo.getVariantsForProducts(accessoryProductIds);
            accessoryImages = await productRepo.getImagesForProducts(accessoryProductIds);
        }
    }

    return {
        product: productData,
        variants: productData.variants || [],
        images: productData.images || [],
        accessoryProducts,
        accessoryVariants,
        accessoryImages,
        // For client-side store subscription
        storePayload: {
            mainProduct: productData,
            accessories: accessoryProducts
        }
    };
}; 