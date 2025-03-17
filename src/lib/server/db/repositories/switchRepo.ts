import { db } from '../index';
import { product, productVariant, productImage } from '../index';
import type { Product, ProductVariant, ProductImage } from '../schema';
import { eq, asc, inArray, or } from 'drizzle-orm';

/**
 * Repository for handling switch operations
 */
export const switchRepo = {
    /**
     * Get all switch products
     */
    async getAll() {
        return await db.select()
            .from(product)
            .where(
                or(
                    eq(product.category, 'SWITCHES'),
                    eq(product.category, 'switches')
                )
            )
            .orderBy(asc(product.name));
    },

    /**
     * Get a switch product by ID with variants and images
     */
    async getById(id: string) {
        const results = await db.select()
            .from(product)
            .where(
                eq(product.id, id)
            )
            .leftJoin(productVariant, eq(product.id, productVariant.productId))
            .leftJoin(productImage, eq(product.id, productImage.productId))
            .orderBy(asc(productImage.position));

        if (results.length === 0) {
            return null;
        }

        // Check if this is a switch product
        if (results[0].product.category.toUpperCase() !== 'SWITCHES') {
            return null;
        }

        // Transform the flat results into a nested structure
        const switchData: Product & {
            variants: ProductVariant[];
            images: ProductImage[];
        } = {
            ...results[0].product,
            variants: [],
            images: []
        };

        for (const row of results) {
            if (row.product_variant && !switchData.variants.some(v => v.id === row.product_variant?.id)) {
                switchData.variants.push(row.product_variant);
            }

            if (row.product_image && !switchData.images.some(i => i.id === row.product_image?.id)) {
                switchData.images.push(row.product_image);
            }
        }

        return switchData;
    },

    /**
     * Get all switch variants
     */
    async getAllVariants() {
        // First get all switch product IDs
        const switchProducts = await this.getAll();
        const switchIds = switchProducts.map(p => p.id);

        if (switchIds.length === 0) {
            return [];
        }

        // Then get all variants for those products
        return await db.select()
            .from(productVariant)
            .where(inArray(productVariant.productId, switchIds));
    },

    /**
     * Get switch variants by attribute
     */
    async getVariantsByAttribute(attribute: string, value: string) {
        // First get all switch product IDs
        const switchProducts = await this.getAll();
        const switchIds = switchProducts.map(p => p.id);

        if (switchIds.length === 0) {
            return [];
        }

        // Then get all variants for those products
        const variants = await db.select()
            .from(productVariant)
            .where(inArray(productVariant.productId, switchIds));

        // Filter variants by attribute value
        return variants.filter(variant => {
            if (!variant.attributes) return false;

            const attributes = variant.attributes as Record<string, string>;
            return attributes[attribute] === value;
        });
    },

    /**
     * Get switch variants by multiple attributes
     */
    async getVariantsByAttributes(attributeFilters: Record<string, string>) {
        // First get all switch product IDs
        const switchProducts = await this.getAll();
        const switchIds = switchProducts.map(p => p.id);

        if (switchIds.length === 0) {
            return [];
        }

        // Then get all variants for those products
        const variants = await db.select()
            .from(productVariant)
            .where(inArray(productVariant.productId, switchIds));

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