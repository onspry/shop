import { eq, asc, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db_drizzle/schema';
import { product } from '$lib/server/db_drizzle/schema/product';
import { productVariant } from '$lib/server/db_drizzle/schema/product_variant';
import { productImage } from '$lib/server/db_drizzle/schema/product_image';
import type { Product } from '$lib/server/db_drizzle/schema/product';
import type { ProductVariant } from '$lib/server/db_drizzle/schema/product_variant';
import type { ProductImage } from '$lib/server/db_drizzle/schema/product_image';
import type { ProductViewModel } from '$lib/server/db/prisma/models/product';
import { toProductViewModel } from '$lib/server/db/prisma/models/product';
import { toCatalogueViewModel } from '$lib/server/db/prisma/models/catalogue';

interface ProductWithRelations extends Product {
    variants: ProductVariant[];
    images: ProductImage[];
}

interface QueryResult {
    product: Product;
    product_variant: ProductVariant[] | null;
    product_image: ProductImage[] | null;
}

// Internal helper methods
function groupResults(results: QueryResult[]): ProductWithRelations[] {
    const productsMap = new Map<string, ProductWithRelations>();

    for (const row of results) {
        if (!productsMap.has(row.product.id)) {
            productsMap.set(row.product.id, {
                ...row.product,
                variants: [],
                images: []
            });
        }

        const productData = productsMap.get(row.product.id)!;

        // Add all variants
        if (Array.isArray(row.product_variant)) {
            row.product_variant.forEach(variant => {
                if (!productData.variants.some(v => v.id === variant.id)) {
                    productData.variants.push(variant);
                }
            });
        }

        // Add all images
        if (Array.isArray(row.product_image)) {
            row.product_image.forEach(image => {
                if (!productData.images.some(i => i.id === image.id)) {
                    productData.images.push(image);
                }
            });
        }
    }

    // Ensure all products have variants and images arrays
    return Array.from(productsMap.values()).map(product => ({
        ...product,
        variants: product.variants || [],
        images: product.images || []
    }));
}

async function queryProducts(options: {
    where?: ReturnType<typeof eq>;
    orderBy?: ReturnType<typeof asc>;
    limit?: number;
    offset?: number;
} = {}): Promise<QueryResult[]> {
    // First, get the products
    const query = db.select({
        product: product
    })
        .from(product)
        .limit(options.limit ?? 50)
        .offset(options.offset ?? 0);

    if (options.where) {
        query.where(options.where);
    }

    if (options.orderBy) {
        query.orderBy(options.orderBy);
    }

    const results = await query;

    // Then, get variants and images separately
    const productIds = results.map(r => r.product.id);

    const [variants, images] = await Promise.all([
        db.select({
            id: productVariant.id,
            productId: productVariant.productId,
            name: productVariant.name,
            sku: productVariant.sku,
            price: productVariant.price,
            stockQuantity: productVariant.stockQuantity,
            attributes: productVariant.attributes,
            createdAt: productVariant.createdAt,
            updatedAt: productVariant.updatedAt
        })
            .from(productVariant)
            .where(inArray(productVariant.productId, productIds)),

        db.select({
            id: productImage.id,
            productId: productImage.productId,
            url: productImage.url,
            alt: productImage.alt,
            position: productImage.position
        })
            .from(productImage)
            .where(inArray(productImage.productId, productIds))
            .orderBy(asc(productImage.position))
    ]);

    // Combine the results
    return results.map(result => ({
        product: result.product,
        product_variant: variants.filter(v => v.productId === result.product.id),
        product_image: images.filter(i => i.productId === result.product.id)
    }));
}

async function getBySlug(slug: string): Promise<ProductWithRelations | null> {
    const results = await queryProducts({
        where: eq(product.slug, slug)
    });

    if (results.length === 0) return null;
    return groupResults(results)[0];
}

// Category priority for sorting
const CATEGORY_PRIORITIES = {
    KEYBOARD: 0,
    SWITCH: 1,
    KEYCAP: 2,
    CASE: 3,
    // Add other categories with their priorities
} as const;

// Public API
export const productRepo = {
    /**
     * Get all products, optionally filtered by category with pagination
     * @param category - Optional category to filter products by
     * @param page - Page number (1-based)
     * @param pageSize - Number of items per page
     * @returns Object containing products and total count
     */
    async getProducts(category?: string, page: number = 1, pageSize: number = 50): Promise<{
        products: ProductViewModel[];
        total: number;
    }> {
        const offset = (page - 1) * pageSize;

        const results = await queryProducts({
            where: category ? eq(product.category, category.toUpperCase()) : undefined,
            orderBy: asc(product.name),
            limit: pageSize,
            offset
        });

        const total = results.length;
        const products = groupResults(results);
        const viewModels = products.map(product => toProductViewModel(product, product.variants, product.images));

        return {
            products: viewModels,
            total
        };
    },

    /**
     * Get all products grouped by category with pagination
     * @param page - Page number (1-based)
     * @param pageSize - Number of items per page
     * @returns Catalogue view model with products grouped by category
     */
    async getCatalogue(page: number = 1, pageSize: number = 50): Promise<ReturnType<typeof toCatalogueViewModel>> {
        const { products, total } = await this.getProducts(undefined, page, pageSize);

        // Group products by category
        const productsByCategory = products.reduce((acc, product) => {
            const category = product.category || 'Uncategorized';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(product);
            return acc;
        }, {} as Record<string, ProductViewModel[]>);

        // Sort categories by priority and name
        const productGroups = Object.entries(productsByCategory)
            .sort(([a], [b]) => {
                const priorityA = CATEGORY_PRIORITIES[a.toUpperCase() as keyof typeof CATEGORY_PRIORITIES] ?? Number.MAX_SAFE_INTEGER;
                const priorityB = CATEGORY_PRIORITIES[b.toUpperCase() as keyof typeof CATEGORY_PRIORITIES] ?? Number.MAX_SAFE_INTEGER;
                if (priorityA !== priorityB) return priorityA - priorityB;
                return a.localeCompare(b);
            })
            .map(([category, products]) => ({
                category,
                products
            }));

        return toCatalogueViewModel(productGroups, total);
    },

    /**
     * Get product details with variants
     * @param slug - The product's URL slug
     * @returns Object containing the product view model and default variant ID
     * @throws Error if product not found
     */
    async getProduct(slug: string): Promise<{
        product: ProductViewModel;
        defaultVariantId: string | null;
    }> {
        const productWithRelations = await getBySlug(slug);
        if (!productWithRelations) {
            throw new Error('Product not found');
        }

        const productViewModel = toProductViewModel(
            productWithRelations,
            productWithRelations.variants,
            productWithRelations.images
        );

        const defaultVariantId = productWithRelations.variants.length > 0
            ? productWithRelations.variants[0].id
            : null;

        return {
            product: productViewModel,
            defaultVariantId
        };
    },

    /**
     * Get products by category
     * @param category - The product category to filter by
     * @returns Array of products in the specified category
     */
    async getProductsByCategory(category: string): Promise<ProductViewModel[]> {
        const results = await queryProducts({
            where: eq(product.category, category)
        });

        // Group results by product to get variants and images
        const groupedResults = groupResults(results);

        // Ensure each product has variants and images arrays
        const productsWithRelations = groupedResults.map(result => ({
            ...result,
            variants: result.variants || [],
            images: result.images || []
        }));

        return productsWithRelations.map(result => toProductViewModel(
            result,
            result.variants,
            result.images
        ));
    }
}; 