import { db } from '..';
import { product, productVariant, productImage } from '..';
import type { Product, ProductVariant, ProductImage } from '..';
import { eq, asc, inArray, or } from 'drizzle-orm';

// Types and Interfaces
interface CompatibilityResult {
    product: Product;
    variants: ProductVariant[];
    images: ProductImage[];
}

interface ProductWithRelations extends Product {
    variants: ProductVariant[];
    images: ProductImage[];
}

interface AccessoryData {
    product: Product;
    variants: ProductVariant[];
    images: ProductImage[];
}

interface ProductDetails {
    product: Product;
    variants: ProductVariant[];
    images: ProductImage[];
    requiredAccessories: Record<string, CompatibilityResult[]>;
    optionalAccessories: Record<string, CompatibilityResult[]>;
    requiredAccessoryCategories: string[];
    optionalAccessoryCategories: string[];
}

interface AttributesWithCompatibility {
    compatibleWith?: {
        keyboards?: string[] | string;
        switches?: string[];
        stemType?: string[];
    };
    compatibility?: {
        switches?: string[];
        requiredAccessories?: string[];
    };
    featureTags?: string[];
}

interface QueryResult {
    product: Product;
    product_variant: ProductVariant | null;
    product_image: ProductImage | null;
}

// Constants
const REQUIRED_CATEGORIES = ['SWITCHES', 'KEYCAPS'] as const;
const KEYBOARD_CATEGORY = 'KEYBOARD' as const;

/**
 * Repository for handling product operations
 */
export const productRepo = {
    /**
     * Get a product by its slug with variants and images
     */
    async getBySlug(slug: string): Promise<ProductWithRelations | null> {
        const results = await db.select()
            .from(product)
            .where(eq(product.slug, slug))
            .leftJoin(productVariant, eq(product.id, productVariant.productId))
            .leftJoin(productImage, eq(product.id, productImage.productId))
            .orderBy(asc(productImage.position));

        if (results.length === 0) return null;

        return this.transformQueryResults(results as QueryResult[]);
    },

    /**
     * Transform flat query results into a nested structure
     */
    transformQueryResults(results: QueryResult[]): ProductWithRelations {
        const productData: ProductWithRelations = {
            ...results[0].product,
            variants: [],
            images: []
        };

        for (const row of results) {
            const variant = row.product_variant;
            if (variant && !productData.variants.some(v => v.id === variant.id)) {
                productData.variants.push(variant);
            }

            const image = row.product_image;
            if (image && !productData.images.some(i => i.id === image.id)) {
                productData.images.push(image);
            }
        }

        return productData;
    },

    /**
     * Get all products with optional category filter
     */
    async getProducts(category?: string): Promise<Product[]> {
        const query = db.select().from(product);

        if (category) {
            return await query
                .where(
                    or(
                        eq(product.category, category.toUpperCase()),
                        eq(product.category, category.toLowerCase()),
                        eq(product.category, category)
                    )
                )
                .orderBy(asc(product.name));
        }

        return await query.orderBy(asc(product.name));
    },

    /**
     * Get variants for products
     */
    async getVariantsForProducts(productIds: string[]): Promise<ProductVariant[]> {
        if (productIds.length === 0) return [];

        return await db.select()
            .from(productVariant)
            .where(inArray(productVariant.productId, productIds));
    },

    /**
     * Get images for products
     */
    async getImagesForProducts(productIds: string[]): Promise<ProductImage[]> {
        if (productIds.length === 0) return [];

        return await db.select()
            .from(productImage)
            .where(inArray(productImage.productId, productIds))
            .orderBy(asc(productImage.position));
    },

    /**
     * Get complete product details with pre-filtered compatible accessories
     */
    async getCompleteProductDetails(slug: string): Promise<ProductDetails | null> {
        // 1. Get the main product with its variants and images
        const mainProduct = await this.getBySlug(slug);
        if (!mainProduct) return null;

        // Return early if not a keyboard
        if (mainProduct.category !== KEYBOARD_CATEGORY) {
            return this.createBaseProductDetails(mainProduct);
        }

        // 2. Get all accessories with their variants and images in one query
        const accessories = await this.getAccessoriesWithRelations();

        // Process and organize accessories
        const { required, optional } = this.organizeAccessories(accessories, mainProduct);

        return {
            ...this.createBaseProductDetails(mainProduct),
            ...required,
            ...optional
        };
    },

    /**
     * Create base product details without accessories
     */
    createBaseProductDetails(product: ProductWithRelations): ProductDetails {
        return {
            product,
            variants: product.variants,
            images: product.images,
            requiredAccessories: {},
            optionalAccessories: {},
            requiredAccessoryCategories: [],
            optionalAccessoryCategories: []
        };
    },

    /**
     * Get all accessories with their relations in a single query
     */
    async getAccessoriesWithRelations(): Promise<AccessoryData[]> {
        const query = db.select({
            product: product,
            product_variant: productVariant,
            product_image: productImage
        })
            .from(product)
            .where(eq(product.isAccessory, true))
            .leftJoin(productVariant, eq(product.id, productVariant.productId))
            .leftJoin(productImage, eq(product.id, productImage.productId))
            .orderBy(asc(productImage.position));

        const results = await query;
        return this.processAccessoryResults(results as QueryResult[]);
    },

    /**
     * Process flat accessory results into structured data
     */
    processAccessoryResults(results: QueryResult[]): AccessoryData[] {
        const accessoryMap = new Map<string, AccessoryData>();

        for (const row of results) {
            if (!row.product) continue;

            if (!accessoryMap.has(row.product.id)) {
                accessoryMap.set(row.product.id, {
                    product: row.product,
                    variants: [],
                    images: []
                });
            }

            const accessoryData = accessoryMap.get(row.product.id)!;
            const variant = row.product_variant;
            const image = row.product_image;

            if (variant && !accessoryData.variants.some(v => v.id === variant.id)) {
                accessoryData.variants.push(variant);
            }

            if (image && !accessoryData.images.some(i => i.id === image.id)) {
                accessoryData.images.push(image);
            }
        }

        return Array.from(accessoryMap.values());
    },

    /**
     * Organize accessories into required and optional categories
     */
    organizeAccessories(accessories: AccessoryData[], mainProduct: ProductWithRelations): {
        required: Pick<ProductDetails, 'requiredAccessories' | 'requiredAccessoryCategories'>,
        optional: Pick<ProductDetails, 'optionalAccessories' | 'optionalAccessoryCategories'>
    } {
        const requiredAccessories: Record<string, CompatibilityResult[]> = {};
        const optionalAccessories: Record<string, CompatibilityResult[]> = {};
        const optionalCategories = new Set<string>();

        for (const accessory of accessories) {
            if (!accessory.product.category) continue;

            const category = accessory.product.category.toUpperCase();

            if (!this.checkCompatibility(accessory.variants, category, mainProduct.name.toLowerCase())) {
                continue;
            }

            const result: CompatibilityResult = {
                product: accessory.product,
                variants: accessory.variants,
                images: accessory.images
            };

            if (REQUIRED_CATEGORIES.includes(category as typeof REQUIRED_CATEGORIES[number])) {
                requiredAccessories[category] = requiredAccessories[category] || [];
                requiredAccessories[category].push(result);
            } else {
                optionalAccessories[category] = optionalAccessories[category] || [];
                optionalAccessories[category].push(result);
                optionalCategories.add(category);
            }
        }

        return {
            required: {
                requiredAccessories,
                requiredAccessoryCategories: [...REQUIRED_CATEGORIES]
            },
            optional: {
                optionalAccessories,
                optionalAccessoryCategories: Array.from(optionalCategories)
            }
        };
    },

    /**
     * Check compatibility between an accessory and a keyboard
     */
    checkCompatibility(
        variants: ProductVariant[],
        category: string,
        keyboardName: string
    ): boolean {
        if (variants.length === 0) return false;

        return variants.some(variant => {
            if (!variant.attributes) return false;

            try {
                const attributes = variant.attributes as AttributesWithCompatibility;
                const { compatibleWith } = attributes;
                if (!compatibleWith) return false;

                switch (category) {
                    case 'SWITCHES':
                    case 'KEYCAPS':
                        return this.checkSwitchKeycapCompatibility(compatibleWith);
                    case 'CASE':
                        return this.checkCaseCompatibility(compatibleWith, keyboardName);
                    default:
                        return true;
                }
            } catch (error) {
                console.error(`Error checking compatibility for variant ${variant.id}:`, error);
                return false;
            }
        });
    },

    /**
     * Check compatibility for switches and keycaps
     */
    checkSwitchKeycapCompatibility(compatibleWith: AttributesWithCompatibility['compatibleWith']): boolean {
        return Boolean(compatibleWith?.stemType?.length);
    },

    /**
     * Check compatibility for cases
     */
    checkCaseCompatibility(
        compatibleWith: AttributesWithCompatibility['compatibleWith'],
        keyboardName: string
    ): boolean {
        const keyboards = Array.isArray(compatibleWith?.keyboards)
            ? compatibleWith.keyboards.map(k => k.toLowerCase())
            : typeof compatibleWith?.keyboards === 'string'
                ? [compatibleWith.keyboards.toLowerCase()]
                : [];

        return keyboards.length === 0 || keyboards.includes(keyboardName);
    }
}; 