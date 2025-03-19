import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { product, productVariant, productImage } from '$lib/server/db';
import type { Product, ProductVariant, ProductImage } from '$lib/server/db';
import { eq, asc } from 'drizzle-orm';

type ProductWithRelations = Product & {
    variants: ProductVariant[];
    images: ProductImage[];
};

export const load: PageServerLoad = async () => {
    const allProducts = await db.select()
        .from(product)
        .leftJoin(productVariant, eq(product.id, productVariant.productId))
        .leftJoin(productImage, eq(product.id, productImage.productId))
        .orderBy(asc(productImage.position));

    // Transform the flat results into a nested structure
    const productsMap = new Map<string, ProductWithRelations>();

    for (const row of allProducts) {
        if (!productsMap.has(row.product.id)) {
            productsMap.set(row.product.id, {
                ...row.product,
                variants: [],
                images: []
            });
        }

        const productData = productsMap.get(row.product.id)!;

        if (row.product_variant && !productData.variants.some(v => v.id === row.product_variant?.id)) {
            productData.variants.push(row.product_variant);
        }

        if (row.product_image && !productData.images.some(i => i.id === row.product_image?.id)) {
            productData.images.push(row.product_image);
        }
    }

    return {
        products: Array.from(productsMap.values())
    };
}; 