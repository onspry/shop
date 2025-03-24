import type { ProductVariantViewModel } from './product';

export interface CartItemViewModel {
    id: string;
    productVariantId: string;
    quantity: number;
    price: number;
    variant: ProductVariantViewModel;
    product?: {
        id: string;
        name: string;
        slug?: string;
        description?: string | null;
    };
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
}

export interface UpdateCartItemPayload {
    cartItemId: string;
    quantity: number;
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