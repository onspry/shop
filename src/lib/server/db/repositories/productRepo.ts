import { db } from '../index';
import { product, productVariant, productImage } from '../index';
import type { Product, ProductVariant, ProductImage } from '../schema';
import { eq, asc, like, inArray, or } from 'drizzle-orm';

/**
 * Repository for handling product operations
 */
export const productRepo = {
    /**
     * Get a product by its slug with variants and images
     */
    async getBySlug(slug: string) {
        const results = await db.select()
            .from(product)
            .where(eq(product.slug, slug))
            .leftJoin(productVariant, eq(product.id, productVariant.productId))
            .leftJoin(productImage, eq(product.id, productImage.productId))
            .orderBy(asc(productImage.position));

        if (results.length === 0) {
            return null;
        }

        // Transform the flat results into a nested structure
        const productData: Product & {
            variants: ProductVariant[];
            images: ProductImage[];
        } = {
            ...results[0].product,
            variants: [],
            images: []
        };

        for (const row of results) {
            if (row.product_variant && !productData.variants.some(v => v.id === row.product_variant?.id)) {
                productData.variants.push(row.product_variant);
            }

            if (row.product_image && !productData.images.some(i => i.id === row.product_image?.id)) {
                productData.images.push(row.product_image);
            }
        }

        return productData;
    },

    /**
     * Get a product by ID with variants and images
     */
    async getById(id: string) {
        const results = await db.select()
            .from(product)
            .where(eq(product.id, id))
            .leftJoin(productVariant, eq(product.id, productVariant.productId))
            .leftJoin(productImage, eq(product.id, productImage.productId))
            .orderBy(asc(productImage.position));

        if (results.length === 0) {
            return null;
        }

        // Transform the flat results into a nested structure
        const productData: Product & {
            variants: ProductVariant[];
            images: ProductImage[];
        } = {
            ...results[0].product,
            variants: [],
            images: []
        };

        for (const row of results) {
            if (row.product_variant && !productData.variants.some(v => v.id === row.product_variant?.id)) {
                productData.variants.push(row.product_variant);
            }

            if (row.product_image && !productData.images.some(i => i.id === row.product_image?.id)) {
                productData.images.push(row.product_image);
            }
        }

        return productData;
    },

    /**
     * Get all products
     */
    async getAll() {
        return await db.select().from(product).orderBy(asc(product.name));
    },

    /**
     * Get products by category (case-insensitive)
     */
    async getByCategory(category: string): Promise<Product[]> {
        const results = await db.select()
            .from(product)
            .where(
                or(
                    eq(product.category, category.toUpperCase()),
                    eq(product.category, category.toLowerCase()),
                    eq(product.category, category)
                )
            )
            .orderBy(asc(product.name));

        return results;
    },

    /**
     * Search products by name
     */
    async searchByName(name: string) {
        return await db.select()
            .from(product)
            .where(like(product.name, `%${name}%`))
            .orderBy(asc(product.name));
    },

    /**
     * Get variants for a product
     */
    async getVariants(productId: string) {
        return await db.select()
            .from(productVariant)
            .where(eq(productVariant.productId, productId));
    },

    /**
     * Get images for a product
     */
    async getImages(productId: string) {
        return await db.select()
            .from(productImage)
            .where(eq(productImage.productId, productId))
            .orderBy(asc(productImage.position));
    },

    /**
     * Get variants for multiple products
     */
    async getVariantsForProducts(productIds: string[]) {
        if (productIds.length === 0) return [];

        return await db.select()
            .from(productVariant)
            .where(inArray(productVariant.productId, productIds));
    },

    /**
     * Get images for multiple products
     */
    async getImagesForProducts(productIds: string[]) {
        if (productIds.length === 0) return [];

        return await db.select()
            .from(productImage)
            .where(inArray(productImage.productId, productIds))
            .orderBy(asc(productImage.position));
    },

    /**
     * Get variants by attribute value for products in specific category
     */
    async getVariantsByAttribute(attribute: string, value: string, category?: string): Promise<ProductVariant[]> {
        // First get products, optionally filtered by category
        let products: Product[] = [];

        if (category) {
            products = await this.getByCategory(category);
        } else {
            products = await this.getAll();
        }

        const productIds = products.map(p => p.id);

        if (productIds.length === 0) {
            return [];
        }

        // Then get all variants for those products
        const variants = await db.select()
            .from(productVariant)
            .where(inArray(productVariant.productId, productIds));

        // Filter variants by attribute value
        return variants.filter(variant => {
            if (!variant.attributes) return false;

            const attributes = variant.attributes as Record<string, string>;
            return attributes[attribute] === value;
        });
    },

    /**
     * Get variants by multiple attributes for products in specific category
     */
    async getVariantsByAttributes(attributeFilters: Record<string, string>, category?: string): Promise<ProductVariant[]> {
        // First get products, optionally filtered by category
        let products: Product[] = [];

        if (category) {
            products = await this.getByCategory(category);
        } else {
            products = await this.getAll();
        }

        const productIds = products.map(p => p.id);

        if (productIds.length === 0) {
            return [];
        }

        // Then get all variants for those products
        const variants = await db.select()
            .from(productVariant)
            .where(inArray(productVariant.productId, productIds));

        // Filter variants by attribute values
        return variants.filter(variant => {
            if (!variant.attributes) return false;

            const attributes = variant.attributes as Record<string, string>;

            // Check if all filters match
            return Object.entries(attributeFilters).every(
                ([key, value]) => attributes[key] === value
            );
        });
    }
}; 