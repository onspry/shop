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
}

// ViewModel for product images
export interface ProductImageViewModel {
    id: string;
    url: string;
    alt: string;
    position: number;
}

// ViewModel for product variants with stock status
export interface ProductVariantViewModel {
    id: string;
    name: string;
    sku: string;
    price: number;
    attributes: Record<string, string>;
    stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
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
        variants: variants.map(variant => ({
            id: variant.id,
            name: variant.name,
            sku: variant.sku,
            price: variant.price,
            attributes: variant.attributes || {},
            stockStatus: getStockStatus(variant.stockQuantity)
        }))
    };
}

// Helper function to determine stock status
function getStockStatus(quantity: number): 'in_stock' | 'low_stock' | 'out_of_stock' {
    if (quantity === 0) return 'out_of_stock';
    if (quantity < 5) return 'low_stock';
    return 'in_stock';
} 