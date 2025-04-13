import type { ProductVariantViewModel } from "./product";

export interface CartItemCompositeViewModel {
    variantId: string;
    name: string;
    quantity: number;
    variant: ProductVariantViewModel;
}

/**
 * Represents an item in the cart with a fully normalized structure
 */
export interface CartItemViewModel {
    id: string;
    quantity: number;
    price: number;
    // The variant contains all the product information we need
    variant: ProductVariantViewModel;
    // For convenience in UI display
    imageUrl: string;
    // For composite products
    composites: CartItemCompositeViewModel[];
}

export interface CartViewModel {
    id: string;
    items: CartItemViewModel[];
    discountCode: string | null;
    discountAmount: number;
    subtotal: number;
    total: number;
    itemCount: number;
}

export interface AddToCartPayload {
    productVariantId: string;
    quantity: number;
    composites?: Array<{
        variantId: string;
        name: string;
        quantity: number;
    }>;
}

export interface UpdateCartItemPayload {
    cartItemId: string;
    quantity: number;
    composites?: Array<{
        variantId: string;
        name: string;
        quantity: number;
    }>;
}

export interface RemoveCartItemPayload {
    cartItemId: string;
}

export interface ApplyDiscountPayload {
    code: string;
}

export interface CartSummaryViewModel {
    subtotal: number;
    discountAmount: number;
    total: number;
    itemCount: number;
}