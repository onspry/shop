/**
 * Types for the checkout process
 */

/**
 * Order data returned from the server
 */
export interface OrderResponseData {
    success: boolean;
    orderId: string;
    error?: string;
    message?: string;
}

/**
 * Complete response from the server for order placement
 */
export interface OrderResponse {
    type: string;
    status: number;
    data: OrderResponseData;
}
