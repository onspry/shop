import type { ProductVariant } from '@prisma/client';

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