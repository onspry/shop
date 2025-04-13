// Order item type for client-side use
export interface OrderItemType {
    productId: string;
    variantId: string;
    quantity: number;
    price: number;
    unitPrice: number;
    productName: string;
    variantName: string;
}

// Type for order response data
export interface OrderResponseData {
    success?: boolean;
    orderId?: string;
    error?: string;
    message?: string;
}
