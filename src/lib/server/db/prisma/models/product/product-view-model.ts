import type { ProductImageViewModel } from './product-image-view-model';
import type { ProductVariantViewModel } from './product-variant-view-model';

// Base ViewModel for product display
export interface ProductViewModel {
    id: string;
    name: string;
    description: string;
    category: string;
    features: string[];
    specifications: Record<string, unknown>;
    images: ProductImageViewModel[];
    variants: ProductVariantViewModel[];
    isAccessory: boolean;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
} 