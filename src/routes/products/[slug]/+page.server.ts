import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { productRepo } from '$lib/server/db/repositories/productRepo';
import { switchRepo } from '$lib/server/db/repositories/switchRepo';
import { keycapRepo } from '$lib/server/db/repositories/keycapRepo';
import type { Product, ProductVariant, ProductImage } from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ params }) => {
    const { slug } = params;

    // Get the main product by slug
    const productData = await productRepo.getBySlug(slug);

    if (!productData) {
        error(404, 'Product not found');
    }

    // Initialize empty arrays for accessories with proper typing
    const accessoryProducts: Product[] = [];
    const accessoryVariants: ProductVariant[] = [];
    const accessoryImages: ProductImage[] = [];

    // Only fetch accessories if this is a keyboard product
    if (productData.category.toUpperCase() === 'KEYBOARD') {
        console.log('Fetching accessories for keyboard product');

        // Get switch products and their variants
        const switchProducts = await switchRepo.getAll();
        const switchVariants = await switchRepo.getAllVariants();

        // Get keycap products and their variants
        const keycapProducts = await keycapRepo.getAll();
        const keycapVariants = await keycapRepo.getAllVariants();

        // Add switch and keycap products to accessory arrays
        accessoryProducts.push(...switchProducts);
        accessoryProducts.push(...keycapProducts);
        accessoryVariants.push(...switchVariants);
        accessoryVariants.push(...keycapVariants);

        // Get images for all accessory products
        const accessoryProductIds = accessoryProducts.map(p => p.id);
        if (accessoryProductIds.length > 0) {
            const images = await productRepo.getImagesForProducts(accessoryProductIds);
            accessoryImages.push(...images);
        }

        console.log('Found accessory products:', accessoryProducts);
        console.log('Found accessory variants:', accessoryVariants);
        console.log('Found accessory images:', accessoryImages);
    }

    return {
        product: productData,
        accessoryProducts,
        accessoryVariants,
        accessoryImages
    };
}; 