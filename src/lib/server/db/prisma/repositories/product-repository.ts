import { PrismaClient } from '@prisma/client';
import type { Product, ProductVariant, ProductImage } from '@prisma/client';
import type { ProductViewModel, ProductVariantViewModel } from '../models/product';
import type { CatalogueViewModel, ProductGroup } from '../models/catalogue';

const prisma = new PrismaClient();

// Add caching support
interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getFromCache<T>(key: string): T | null {
    const cached = cache.get(key) as CacheEntry<T> | undefined;
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    return null;
}

function setCache<T>(key: string, data: T): void {
    cache.set(key, { data, timestamp: Date.now() });
}

// Helper function to determine stock status
function getStockStatus(quantity: number): 'in_stock' | 'low_stock' | 'out_of_stock' {
    if (quantity === 0) return 'out_of_stock';
    if (quantity < 5) return 'low_stock';
    return 'in_stock';
}

// Helper function to transform variant to ViewModel
export function toProductVariantViewModel(variant: ProductVariant): ProductVariantViewModel {
    return {
        id: variant.id,
        name: variant.name,
        sku: variant.sku,
        price: variant.price,
        stock_quantity: variant.stockQuantity,
        attributes: variant.attributes as Record<string, unknown>,
        stockStatus: getStockStatus(variant.stockQuantity),
        productId: variant.productId
    };
}

// Helper function to transform internal product to ViewModel
function toProductViewModel(product: Product & {
    variants: ProductVariant[];
    images: ProductImage[];
}): ProductViewModel {
    return {
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category,
        features: product.features || [],
        specifications: product.specifications as Record<string, unknown>,
        images: product.images.map(img => ({
            id: img.id,
            url: img.url,
            alt: img.alt,
            position: img.position
        })),
        variants: product.variants.map(toProductVariantViewModel),
        isAccessory: product.isAccessory,
        slug: product.slug,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
    };
}

// Repository methods
export const productRepository = {
    async getProducts(category?: string, page: number = 1, pageSize: number = 50): Promise<{
        products: ProductViewModel[];
        total: number;
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
                products: products.map(toProductViewModel),
                total
            };
        } catch (error) {
            console.error('Error getting products:', error);
            throw new Error('Failed to retrieve products');
        }
    },

    async getCatalogue(page: number = 1, pageSize: number = 50): Promise<CatalogueViewModel> {
        try {
            // 1. Get products and total count
            const { products, total } = await this.getProducts(undefined, page, pageSize);

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
            return this.toCatalogueViewModel(groups, total);
        } catch (error) {
            console.error('Error getting catalogue:', error);
            throw new Error('Failed to retrieve catalogue');
        }
    },

    async getProduct(slug: string): Promise<{
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

            const productViewModel = toProductViewModel(product);
            const defaultVariantId = product.variants.length > 0 ? product.variants[0].id : null;

            return {
                product: productViewModel,
                defaultVariantId
            };
        } catch (error) {
            console.error(`Error getting product ${slug}:`, error);
            throw new Error('Failed to retrieve product');
        }
    },

    async getProductsByCategory(
        category: string,
        page: number = 1,
        pageSize: number = 50
    ): Promise<{
        products: ProductViewModel[];
        total: number;
    }> {
        const cacheKey = `products:category:${category}:page:${page}:size:${pageSize}`;
        const cached = getFromCache<{ products: ProductViewModel[]; total: number }>(cacheKey);
        if (cached) {
            return cached;
        }

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

            const result = {
                products: products.map(toProductViewModel),
                total
            };

            setCache(cacheKey, result);
            return result;
        } catch (error) {
            console.error(`Error getting products for category ${category}:`, error);
            throw new Error('Failed to retrieve products by category');
        }
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
                throw new Error('Variant not found');
            }

            return variant.stockQuantity;
        } catch (error) {
            console.error(`Error getting stock for variant ${variantId}:`, error);
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

    async searchProducts(
        query: string,
        page: number = 1,
        pageSize: number = 50
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
                            { description: { contains: query, mode: 'insensitive' } },
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
                            { description: { contains: query, mode: 'insensitive' } },
                            { category: { contains: query, mode: 'insensitive' } }
                        ]
                    }
                })
            ]);

            return {
                products: products.map(toProductViewModel),
                total
            };
        } catch (error) {
            console.error(`Error searching products for query "${query}":`, error);
            throw new Error('Failed to search products');
        }
    },

    async getFeaturedProducts(limit: number = 10): Promise<ProductViewModel[]> {
        try {
            const products = await prisma.product.findMany({
                include: {
                    variants: true,
                    images: true
                },
                take: limit,
                orderBy: { createdAt: 'desc' }
            });

            return products.map(toProductViewModel);
        } catch (error) {
            console.error('Error getting featured products:', error);
            throw new Error('Failed to retrieve featured products');
        }
    },

    async clearCache(): Promise<void> {
        cache.clear();
    },

    // Helper function to transform grouped products to catalogue view
    toCatalogueViewModel(productGroups: ProductGroup[], totalProducts: number): CatalogueViewModel {
        return {
            productGroups,
            totalProducts,
            categories: productGroups.map(group => group.category)
        };
    }
}; 