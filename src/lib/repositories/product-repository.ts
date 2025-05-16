import { prisma } from '$lib/server/db';
import type { Product, ProductVariant, ProductImage } from '@prisma/client';
import type { ProductViewModel, ProductVariantViewModel } from '../models/product';
import type { CatalogueViewModel, ProductGroup } from '../models/catalogue';
import { VariantError } from '$lib/errors/shop-errors';
import { getLocalizedValue, type Locale } from '$lib/utils/localization';
import type { LocalizedValue } from '$lib/types/localization';
import { getPriceForLocale } from '$lib/models/product-price';

// Helper function to determine stock status
function getStockStatus(quantity: number): 'in_stock' | 'low_stock' | 'out_of_stock' {
    if (quantity === 0) return 'out_of_stock';
    if (quantity < 5) return 'low_stock';
    return 'in_stock';
}

// Helper function to transform variant to ViewModel
export function toProductVariantViewModel(variant: ProductVariant, locale: Locale = 'en-US'): ProductVariantViewModel {
    // Get localized price
    const localizedPrice = getPriceForLocale(variant.prices, locale, variant.price);

    return {
        id: variant.id,
        name: variant.name,
        sku: variant.sku,
        price: localizedPrice,
        prices: typeof variant.prices === 'object' ? variant.prices as Record<string, number> : {},
        stock_quantity: variant.stockQuantity,
        attributes: variant.attributes as Record<string, unknown>,
        stockStatus: getStockStatus(variant.stockQuantity),
        productId: variant.productId,
        createdAt: variant.createdAt,
        updatedAt: variant.updatedAt
    };
}

// Helper function to transform internal product to ViewModel for display
function toProductDisplayViewModel(product: Product & {
    variants: ProductVariant[];
    images: ProductImage[];
}, locale: Locale = 'en-US'): ProductViewModel {
    // Get localized description
    const localizedDescription = getLocalizedValue(
        product.descriptions as unknown as Record<string, LocalizedValue>,
        locale
    ) as string;

    // Handle features - ensure it's a string array
    const rawFeatures = getLocalizedValue(product.features as unknown as Record<string, LocalizedValue>, locale);
    const features = Array.isArray(rawFeatures) ? rawFeatures : [];

    // Handle specifications - ensure it's a Record<string, unknown>
    const rawSpecs = getLocalizedValue(product.specifications as unknown as Record<string, LocalizedValue>, locale);
    const specifications = typeof rawSpecs === 'object' && rawSpecs !== null ? rawSpecs as Record<string, unknown> : {};

    // Convert variants with localized prices
    const localizedVariants = product.variants.map(v => toProductVariantViewModel(v, locale));

    // Use the first variant's price as the default display price
    const defaultPrice = localizedVariants.length > 0 ? localizedVariants[0].price : 0;

    return {
        id: product.id,
        name: product.name,
        description: localizedDescription,
        category: product.category,
        features,
        specifications,
        price: defaultPrice, // Add price from first variant for display purposes
        images: product.images.map(img => ({
            id: img.id,
            url: img.url,
            alt: img.alt,
            position: img.position,
            productId: img.productId
        })),
        variants: localizedVariants,
        isAccessory: product.isAccessory,
        slug: product.slug,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
    };
}

// Repository methods
export const productRepository = {
    async getProducts(category?: string, page: number = 1, pageSize: number = 50, locale: Locale = 'en-US'): Promise<{
        products: ProductViewModel[];
        totalCount: number;
        pageCount: number;
    }> {
        try {
            const skip = (page - 1) * pageSize;
            const [products, total] = await Promise.all([
                prisma.product.findMany({
                    where: category ? { category } : undefined,
                    include: {
                        variants: true,
                        images: true
                    },
                    skip,
                    take: pageSize,
                    orderBy: { name: 'asc' }
                }),
                prisma.product.count({
                    where: category ? { category } : undefined
                })
            ]);

            return {
                products: products.map(p => toProductDisplayViewModel(p, locale)),
                totalCount: total,
                pageCount: Math.ceil(total / pageSize)
            };
        } catch (error) {
            console.error('Error getting products:', error);
            throw new Error('Failed to retrieve products');
        }
    },

    async getProduct(slug: string, locale: Locale = 'en-US'): Promise<{
        product: ProductViewModel;
        defaultVariantId: string | null;
    }> {
        try {
            const product = await prisma.product.findUnique({
                where: { slug },
                include: {
                    variants: true,
                    images: {
                        orderBy: {
                            position: 'asc'
                        }
                    }
                }
            });

            if (!product) {
                throw new Error('Product not found');
            }

            const productViewModel = toProductDisplayViewModel(product, locale);
            const defaultVariantId = product.variants.length > 0 ? product.variants[0].id : null;

            return {
                product: productViewModel,
                defaultVariantId
            };
        } catch (error) {
            console.error(`Error getting product ${slug}:`, error);
            if (error instanceof Error && error.message === 'Product not found') {
                throw error;
            }
            throw new Error('Failed to retrieve product');
        }
    },

    async getProductsByCategory(
        category: string,
        page: number = 1,
        pageSize: number = 50,
        locale: Locale = 'en-US'
    ): Promise<{
        products: ProductViewModel[];
        totalCount: number;
        pageCount: number;
    }> {
        try {
            const skip = (page - 1) * pageSize;
            const [products, total] = await Promise.all([
                prisma.product.findMany({
                    where: { category },
                    include: {
                        variants: true,
                        images: true
                    },
                    skip,
                    take: pageSize,
                    orderBy: { name: 'asc' }
                }),
                prisma.product.count({
                    where: { category }
                })
            ]);

            return {
                products: products.map(p => toProductDisplayViewModel(p, locale)),
                totalCount: total,
                pageCount: Math.ceil(total / pageSize)
            };
        } catch (error) {
            console.error(`Error getting products for category ${category}:`, error);
            throw new Error('Failed to retrieve products by category');
        }
    },

    async searchProducts(
        query: string,
        page: number = 1,
        pageSize: number = 50,
        locale: Locale = 'en-US'
    ): Promise<{
        products: ProductViewModel[];
        total: number;
    }> {
        try {
            const skip = (page - 1) * pageSize;
            const [products, total] = await Promise.all([
                prisma.product.findMany({
                    where: {
                        OR: [
                            { name: { contains: query, mode: 'insensitive' } },
                            { category: { contains: query, mode: 'insensitive' } }
                        ]
                    },
                    include: {
                        variants: true,
                        images: true
                    },
                    skip,
                    take: pageSize,
                    orderBy: { name: 'asc' }
                }),
                prisma.product.count({
                    where: {
                        OR: [
                            { name: { contains: query, mode: 'insensitive' } },
                            { category: { contains: query, mode: 'insensitive' } }
                        ]
                    }
                })
            ]);

            return {
                products: products.map(p => toProductDisplayViewModel(p, locale)),
                total
            };
        } catch (error) {
            console.error(`Error searching products for query "${query}":`, error);
            throw new Error('Failed to search products');
        }
    },

    async getCatalogue(page: number = 1, pageSize: number = 50, locale: Locale = 'en-US'): Promise<CatalogueViewModel> {
        try {
            // 1. Get products and total count
            const { products, totalCount } = await this.getProducts(undefined, page, pageSize, locale);

            // 2. Group products by category
            const productGroups = products.reduce((acc, product) => {
                if (!acc[product.category]) {
                    acc[product.category] = [];
                }
                acc[product.category].push(product);
                return acc;
            }, {} as Record<string, ProductViewModel[]>);

            const groups: ProductGroup[] = Object.entries(productGroups).map(([category, products]) => ({
                category,
                products
            }));

            // 3. Call the transformation helper with grouped data and total
            return this.toCatalogueViewModel(groups, totalCount);
        } catch (error) {
            console.error('Error getting catalogue:', error);
            throw new Error('Failed to retrieve catalogue');
        }
    },

    // Helper function to transform grouped products to catalogue view
    toCatalogueViewModel(productGroups: ProductGroup[], totalProducts: number): CatalogueViewModel {
        return {
            productGroups,
            totalProducts,
            categories: productGroups.map(group => group.category)
        };
    },

    async updateVariantStock(variantId: string, quantity: number): Promise<void> {
        try {
            await prisma.productVariant.update({
                where: { id: variantId },
                data: { stockQuantity: quantity }
            });
        } catch (error) {
            console.error(`Error updating stock for variant ${variantId}:`, error);
            throw new Error('Failed to update variant stock');
        }
    },

    async getVariantStock(variantId: string): Promise<number> {
        try {
            const variant = await prisma.productVariant.findUnique({
                where: { id: variantId },
                select: { stockQuantity: true }
            });

            if (!variant) {
                throw new VariantError('Variant not found');
            }

            return variant.stockQuantity;
        } catch (error) {
            console.error(`Error getting stock for variant ${variantId}:`, error);

            // Re-throw the specific error if it's our "Variant not found" error
            if (error instanceof VariantError) {
                throw error;
            }

            // Otherwise, throw the generic error
            throw new Error('Failed to get variant stock');
        }
    },

    async createProductVariant(
        productId: string,
        data: {
            sku: string;
            name: string;
            price: number;
            stockQuantity: number;
            attributes: Record<string, string | number | boolean>;
        }
    ): Promise<ProductVariant> {
        try {
            return await prisma.productVariant.create({
                data: {
                    productId,
                    ...data
                }
            });
        } catch (error) {
            console.error(`Error creating variant for product ${productId}:`, error);
            throw new Error('Failed to create product variant');
        }
    },

    async updateProductVariant(
        variantId: string,
        data: {
            sku?: string;
            name?: string;
            price?: number;
            stockQuantity?: number;
            attributes?: Record<string, string | number | boolean>;
        }
    ): Promise<ProductVariant> {
        try {
            return await prisma.productVariant.update({
                where: { id: variantId },
                data
            });
        } catch (error) {
            console.error(`Error updating variant ${variantId}:`, error);
            throw new Error('Failed to update product variant');
        }
    },

    async deleteProductVariant(variantId: string): Promise<void> {
        try {
            await prisma.productVariant.delete({
                where: { id: variantId }
            });
        } catch (error) {
            console.error(`Error deleting variant ${variantId}:`, error);
            throw new Error('Failed to delete product variant');
        }
    },

    async addProductImage(
        productId: string,
        data: {
            url: string;
            alt: string;
            position: number;
        }
    ): Promise<ProductImage> {
        try {
            return await prisma.productImage.create({
                data: {
                    productId,
                    ...data
                }
            });
        } catch (error) {
            console.error(`Error adding image to product ${productId}:`, error);
            throw new Error('Failed to add product image');
        }
    },

    async updateProductImage(
        imageId: string,
        data: {
            url?: string;
            alt?: string;
            position?: number;
        }
    ): Promise<ProductImage> {
        try {
            return await prisma.productImage.update({
                where: { id: imageId },
                data
            });
        } catch (error) {
            console.error(`Error updating image ${imageId}:`, error);
            throw new Error('Failed to update product image');
        }
    },

    async deleteProductImage(imageId: string): Promise<void> {
        try {
            await prisma.productImage.delete({
                where: { id: imageId }
            });
        } catch (error) {
            console.error(`Error deleting image ${imageId}:`, error);
            throw new Error('Failed to delete product image');
        }
    },

    async createProduct(data: {
        slug: string;
        category: string;
        name: string;
        description: string;
        features: string[];
        specifications: Record<string, string | number | boolean>;
        isAccessory: boolean;
    }): Promise<Product> {
        try {
            return await prisma.product.create({
                data
            });
        } catch (error) {
            console.error('Error creating product:', error);
            throw new Error('Failed to create product');
        }
    },

    async updateProduct(
        id: string,
        data: {
            slug?: string;
            category?: string;
            name?: string;
            description?: string;
            features?: string[];
            specifications?: Record<string, string | number | boolean>;
            isAccessory?: boolean;
        }
    ): Promise<Product> {
        try {
            return await prisma.product.update({
                where: { id },
                data
            });
        } catch (error) {
            console.error(`Error updating product ${id}:`, error);
            throw new Error('Failed to update product');
        }
    },

    async deleteProduct(id: string): Promise<void> {
        try {
            await prisma.product.delete({
                where: { id }
            });
        } catch (error) {
            console.error(`Error deleting product ${id}:`, error);
            throw new Error('Failed to delete product');
        }
    },

    async getCategories(): Promise<string[]> {
        try {
            const products = await prisma.product.findMany({
                select: { category: true },
                distinct: ['category']
            });
            return products.map(p => p.category);
        } catch (error) {
            console.error('Error getting categories:', error);
            throw new Error('Failed to retrieve categories');
        }
    },

    async bulkUpdateVariantStock(
        updates: Array<{
            variantId: string;
            quantity: number;
        }>
    ): Promise<void> {
        try {
            await prisma.$transaction(
                updates.map(({ variantId, quantity }) =>
                    prisma.productVariant.update({
                        where: { id: variantId },
                        data: { stockQuantity: quantity }
                    })
                )
            );
        } catch (error) {
            console.error('Error bulk updating variant stock:', error);
            throw new Error('Failed to bulk update variant stock');
        }
    },

    async getFeaturedProducts(limit: number = 10, locale: Locale = 'en-US'): Promise<ProductViewModel[]> {
        try {
            const products = await prisma.product.findMany({
                take: limit,
                include: {
                    variants: true,
                    images: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            return products.map(p => toProductDisplayViewModel(p, locale));
        } catch (error) {
            console.error('Error getting featured products:', error);
            throw new Error('Failed to retrieve featured products');
        }
    },

    /**
     * Updates a product and its variants in a single transaction
     * @param productId - The ID of the product to update
     * @param productData - The product data to update
     * @param variantsData - Array of variant updates with ID and data
     * @throws {Error} If the transaction fails
     */
    async updateProductAndVariants(
        productId: string,
        productData: {
            slug?: string;
            category?: string;
            name?: string;
            description?: string;
            features?: string[];
            specifications?: Record<string, string | number | boolean>;
            isAccessory?: boolean;
        },
        variantsData: Array<{
            id: string,
            data: {
                sku?: string;
                name?: string;
                price?: number;
                stockQuantity?: number;
                attributes?: Record<string, string | number | boolean>;
            }
        }>
    ): Promise<void> {
        try {
            await prisma.$transaction(async (tx) => {
                // Update product
                await tx.product.update({
                    where: { id: productId },
                    data: productData
                });

                // Update variants
                for (const variant of variantsData) {
                    await tx.productVariant.update({
                        where: { id: variant.id },
                        data: variant.data
                    });
                }
            });
        } catch (error) {
            console.error(`Error updating product ${productId} and variants:`, error);
            throw new Error('Failed to update product and variants');
        }
    },

    // Helper function to update a variant with prices for different currencies
    async updateProductVariantWithPrices(
        variantId: string,
        data: {
            sku?: string;
            name?: string;
            price?: number; // Base price in EUR
            prices?: Record<string, number>; // Prices in different currencies
            stockQuantity?: number;
            attributes?: Record<string, unknown>;
        }
    ): Promise<ProductVariant> {
        try {
            return await prisma.productVariant.update({
                where: { id: variantId },
                data: {
                    sku: data.sku,
                    name: data.name,
                    price: data.price,
                    // Convert attributes and prices to proper JSON for Prisma
                    prices: data.prices !== undefined ? data.prices as Record<string, number> : undefined,
                    stockQuantity: data.stockQuantity,
                    attributes: data.attributes !== undefined ? data.attributes as Record<string, string> : undefined,
                }
            });
        } catch (error) {
            console.error(`Error updating variant ${variantId}:`, error);
            throw new Error('Failed to update product variant');
        }
    },

    /**
     * Get product with localized data and pricing
     */
    async getLocalizedProduct(slug: string, locale: Locale = 'en-US'): Promise<{
        product: ProductViewModel;
        defaultVariantId: string | null;
    }> {
        try {
            // Fetch product with related data
            const product = await prisma.product.findUnique({
                where: { slug },
                include: {
                    variants: true,
                    images: {
                        orderBy: {
                            position: 'asc'
                        }
                    }
                }
            });

            if (!product) {
                throw new Error('Product not found');
            }

            // Convert to view model with localized content
            const productViewModel = toProductDisplayViewModel(product, locale);

            // Find default variant ID
            const defaultVariantId = product.variants.length > 0 ? product.variants[0].id : null;

            return {
                product: productViewModel,
                defaultVariantId
            };
        } catch (error) {
            console.error(`Error getting localized product ${slug}:`, error);
            throw new Error(`Failed to retrieve product: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },

    async getProductById(id: string, locale: Locale = 'en-US'): Promise<ProductViewModel | null> {
        try {
            const product = await prisma.product.findUnique({
                where: { id },
                include: {
                    variants: true,
                    images: true
                }
            });

            if (!product) {
                return null;
            }

            return toProductDisplayViewModel(product, locale);
        } catch (error) {
            console.error(`Error getting product ${id}:`, error);
            throw new Error('Failed to retrieve product by ID');
        }
    },

    async getProductBySlug(slug: string, locale: Locale = 'en-US'): Promise<ProductViewModel | null> {
        try {
            const product = await prisma.product.findUnique({
                where: { slug },
                include: {
                    variants: true,
                    images: true
                }
            });

            if (!product) {
                return null;
            }

            return toProductDisplayViewModel(product, locale);
        } catch (error) {
            console.error(`Error getting product by slug ${slug}:`, error);
            throw new Error('Failed to retrieve product by slug');
        }
    },

    async getProductVariants(productId: string, locale: Locale = 'en-US'): Promise<ProductVariantViewModel[]> {
        try {
            const variants = await prisma.productVariant.findMany({
                where: { productId }
            });

            return variants.map(v => toProductVariantViewModel(v, locale));
        } catch (error) {
            console.error(`Error getting variants for product ${productId}:`, error);
            throw new Error('Failed to retrieve product variants');
        }
    },

    async getVariantById(variantId: string, locale: Locale = 'en-US'): Promise<ProductVariantViewModel | null> {
        try {
            const variant = await prisma.productVariant.findUnique({
                where: { id: variantId }
            });

            if (!variant) {
                return null;
            }

            return toProductVariantViewModel(variant, locale);
        } catch (error) {
            console.error(`Error getting variant ${variantId}:`, error);
            throw new Error('Failed to retrieve variant by ID');
        }
    }
};