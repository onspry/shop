import type { Product, ProductVariant, ProductImage } from '$lib/server/db';

// Base ViewModel for product display
export interface ProductViewModel {
    id: string;
    name: string;
    description: string;
    category: string;
    features: string[];
    specifications: Record<string, string>;
    images: ProductImageViewModel[];
    variants: ProductVariantViewModel[];
    isAccessory: boolean;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
}

// ViewModel for product images
export interface ProductImageViewModel {
    id: string;
    url: string;
    alt: string;
    position: number;
}

// No forward declaration needed anymore

// ViewModel for product variants with stock status
export interface ProductVariantViewModel {
    id: string;
    sku: string;
    name: string;
    price: number;
    stock_quantity: number;
    attributes: Record<string, unknown>;
    stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
    // Reference to the parent product
    productId: string;
    // Optional full product reference (may not always be populated)
    product?: {
        id: string;
        name: string;
        slug?: string;
        description?: string | null;
    };
}

// Helper function to transform variant to ViewModel
export function toProductVariantViewModel(variant: ProductVariant): ProductVariantViewModel {
    return {
        id: variant.id,
        name: variant.name,
        sku: variant.sku,
        price: variant.price,
        stock_quantity: variant.stockQuantity,
        attributes: variant.attributes || {},
        stockStatus: getStockStatus(variant.stockQuantity),
        productId: variant.productId, // Add the product ID reference
        // The full product object would be populated separately if needed
    };
}

// Helper function to transform internal product to ViewModel
export function toProductViewModel(product: Product, variants: ProductVariant[], images: ProductImage[]): ProductViewModel {
    return {
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category,
        features: product.features || [],
        specifications: product.specifications || {},
        images: images.map(img => ({
            id: img.id,
            url: img.url,
            alt: img.alt,
            position: img.position
        })),
        variants: variants.map(toProductVariantViewModel),
        isAccessory: product.isAccessory,
        slug: product.slug,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
    };
}

// Helper function to determine stock status
function getStockStatus(quantity: number): 'in_stock' | 'low_stock' | 'out_of_stock' {
    if (quantity === 0) return 'out_of_stock';
    if (quantity < 5) return 'low_stock';
    return 'in_stock';
}