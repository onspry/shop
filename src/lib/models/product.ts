// Base ViewModel for product display
export interface ProductViewModel {
    id: string;
    name: string;
    description: string;
    price: number; // Price in cents (first variant's price, for display purposes)
    category: string;
    features: string[]; // Localized for current language
    specifications: Record<string, unknown>; // Localized for current language
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
    productId: string;
}

// ViewModel for product variants with stock status
export interface ProductVariantViewModel {
    id: string;
    sku: string;
    name: string;
    price: number; // Default price (base currency)
    prices: Record<string, number>; // Localized prices by currency code: { "EUR": 100, "GBP": 85, "CNY": 780 }
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
    createdAt: Date;
    updatedAt: Date;
}
