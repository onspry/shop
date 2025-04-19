import { PrismaClient, type Order, type OrderItem, type OrderStatusHistory, type OrderAddress, type PaymentTransaction, type Refund } from '@prisma/client';
import { TransactionType } from '$lib/models/inventory';
import { OrderStatus, PaymentStatus } from '$lib/models/order';
import { randomUUID } from 'crypto';
import type { CreateOrderViewModel, OrderViewModel, OrderItemViewModel } from '$lib/models/order';
import type { CartItemViewModel } from '$lib/models/cart';
import { formatOrderNumber } from '$lib/utils/order';

// Initialize Prisma client
const prisma = new PrismaClient();

// Using OrderViewModel from models/order.ts

/**
 * Validates an order item - strict validation with no fallbacks
 */
export function isValidOrderItem(item: OrderItemViewModel): boolean {
    // Log the validation check
    console.log('Validating order item:', JSON.stringify(item, null, 2));

    // Strict validation for all required fields
    const isValid = Boolean(
        // Product ID must be valid
        item.productId &&
        typeof item.productId === 'string' &&
        item.productId.trim() !== '' &&
        // Variant ID must be valid
        item.variantId &&
        typeof item.variantId === 'string' &&
        item.variantId.trim() !== '' &&
        // Product name must be valid
        item.productName &&
        typeof item.productName === 'string' &&
        item.productName.trim() !== '' &&
        // Variant name must be valid
        item.variantName &&
        typeof item.variantName === 'string' &&
        item.variantName.trim() !== '' &&
        // Quantity must be positive
        item.quantity > 0 &&
        // Price must be non-negative
        item.price >= 0
    );

    if (!isValid) {
        console.error('Invalid order item:', item);
        // Log specific validation failures to help diagnose issues
        if (!item.productId || typeof item.productId !== 'string' || item.productId.trim() === '') {
            console.error('Invalid product ID');
        }
        if (!item.variantId || typeof item.variantId !== 'string' || item.variantId.trim() === '') {
            console.error('Invalid variant ID');
        }
        if (!item.productName || typeof item.productName !== 'string' || item.productName.trim() === '') {
            console.error('Invalid product name');
        }
        if (!item.variantName || typeof item.variantName !== 'string' || item.variantName.trim() === '') {
            console.error('Invalid variant name');
        }
        if (!(item.quantity > 0)) {
            console.error('Invalid quantity');
        }
        if (!(item.price >= 0)) {
            console.error('Invalid price');
        }
    }

    console.log('Item valid:', isValid);
    return isValid;
}

/**
 * Maps cart item data to order item view model using the normalized structure
 */
export function mapCartItemToOrderItem(cartItem: CartItemViewModel): OrderItemViewModel {
    console.log('Mapping cart item to order item:', cartItem);

    // Get product information from the variant
    const productId = cartItem.variant.product?.id || cartItem.variant.productId;
    const productName = cartItem.variant.product?.name || cartItem.variant.name;

    // Map composite items if they exist
    const composites = cartItem.composites && cartItem.composites.length > 0
        ? cartItem.composites.map(composite => ({
            variantId: composite.variantId,
            name: composite.name,
            quantity: composite.quantity,
            // No type field in CartItemCompositeViewModel, so we'll omit it
        }))
        : undefined;

    return {
        // Get product ID from the variant's product reference
        productId: productId,
        // The variant ID is the key field that must match a valid ID in the product_variant table
        variantId: cartItem.variant.id,
        quantity: cartItem.quantity,
        price: cartItem.price,
        unitPrice: cartItem.price, // Same as price, needed for compatibility
        // Get product name from the variant's product reference
        productName: productName,
        // Get variant name directly from the variant
        variantName: cartItem.variant.name,
        // Include composite items
        composites
    }
}

interface OrderQueryResult extends Order {
    items: Array<OrderItem>;
    addresses: Array<OrderAddress>;
    statusHistory?: Array<OrderStatusHistory>;
    payments?: Array<PaymentTransaction>;
    refunds?: Array<Refund>;
}

export class OrderRepository {
    /**
     * Validates the order data before creation
     * @param data - The order data to validate
     * @throws Error if validation fails
     */
    private validate(data: CreateOrderViewModel): void {
        if (data.items.length === 0) {
            throw new Error('Order must have at least one item');
        }
        if (data.subtotal <= 0) {
            throw new Error('Order subtotal must be greater than 0');
        }
        if (data.taxAmount < 0) {
            throw new Error('Tax amount cannot be negative');
        }
        if (data.shipping.amount < 0) {
            throw new Error('Shipping amount cannot be negative');
        }
        if (data.discountAmount && data.discountAmount < 0) {
            throw new Error('Discount amount cannot be negative');
        }
        if (!data.shipping.address.email) {
            throw new Error('Shipping email is required');
        }
        if (!data.shipping.address.firstName || !data.shipping.address.lastName) {
            throw new Error('Shipping name is required');
        }
        if (!data.shipping.address.address1 || !data.shipping.address.city ||
            !data.shipping.address.postalCode || !data.shipping.address.country) {
            throw new Error('Complete shipping address is required');
        }

        // Ensure state is at least an empty string
        if (data.shipping.address.state === undefined) {
            data.shipping.address.state = '';
        }
    }

    /**
     * Creates a new order
     * @param data - The order data
     * @returns The created order
     * @throws Error if order creation fails
     */
    async createOrder(data: CreateOrderViewModel): Promise<Order> {
        this.validate(data);

        const orderId = randomUUID();
        console.log('Generated new order ID:', orderId);
        const totalAmount = data.subtotal + data.taxAmount + data.shipping.amount - (data.discountAmount || 0);
        console.log('Calculated total amount:', totalAmount);

        try {
            // Use Prisma transaction
            await prisma.$transaction(async (tx) => {
                // Create order
                await tx.order.create({
                    data: {
                        id: orderId,
                        userId: data.userId,
                        cartId: data.cartId,
                        status: OrderStatus.PENDING_PAYMENT,
                        email: data.shipping.address.email,
                        firstName: data.shipping.address.firstName,
                        lastName: data.shipping.address.lastName,
                        subtotal: data.subtotal,
                        discountAmount: data.discountAmount || 0,
                        total: totalAmount,
                        stripePaymentIntentId: data.payment.intentId
                    }
                });

                // Create order items
                const orderItemsData = data.items
                    .filter(isValidOrderItem)
                    .map(item => ({
                        id: randomUUID(),
                        orderId,
                        productId: item.productId,
                        variantId: item.variantId,
                        quantity: item.quantity,
                        price: item.unitPrice,
                        name: item.productName || 'Product',
                        variantName: item.variantName || 'Variant',
                        // Prisma expects a JSON value for the composites field
                        composites: item.composites ? JSON.parse(JSON.stringify(item.composites)) : []
                    }));

                console.log('Order items after filtering:', orderItemsData);

                // Only insert order items if there are any
                if (orderItemsData.length > 0) {
                    try {
                        // Insert the order items - we've already validated them
                        await tx.orderItem.createMany({
                            data: orderItemsData
                        });
                    } catch (error) {
                        console.error('Error inserting order items:', error);
                        throw new Error('Failed to create order items. No valid product variant IDs found. Please check your cart items.');
                    }
                } else {
                    throw new Error('Order must have at least one item');
                }

                // Create shipping address
                await tx.orderAddress.create({
                    data: {
                        id: randomUUID(),
                        orderId,
                        type: 'shipping',
                        firstName: data.shipping.address.firstName,
                        lastName: data.shipping.address.lastName,
                        address1: data.shipping.address.address1,
                        address2: data.shipping.address.address2,
                        city: data.shipping.address.city,
                        state: data.shipping.address.state,
                        postalCode: data.shipping.address.postalCode,
                        country: data.shipping.address.country,
                        phone: data.shipping.address.phone
                    }
                });

                // Create initial status history
                await tx.orderStatusHistory.create({
                    data: {
                        id: randomUUID(),
                        orderId,
                        status: OrderStatus.PENDING_PAYMENT,
                        note: 'Order created'
                    }
                });

                // Update inventory
                for (const item of data.items) {
                    if (item.variantId) {
                        await tx.inventoryTransaction.create({
                            data: {
                                id: randomUUID(),
                                variantId: item.variantId,
                                orderId,
                                type: TransactionType.ORDER,
                                quantity: -item.quantity,
                                note: `Order ${orderId}`
                            }
                        });
                    }
                }
            });

            console.log('Transaction completed successfully, fetching order view model');
            const orderViewModel = await this.getOrderById(orderId);
            if (!orderViewModel) {
                console.error('Failed to get order view model after creation');
                throw new Error('Failed to create order');
            }
            console.log('Order view model retrieved successfully');

            // Get the full Order record from the database
            console.log('Fetching full order record from database');
            const createdOrder = await prisma.order.findUnique({
                where: { id: orderId }
            });

            if (!createdOrder) {
                console.error('Failed to retrieve created order from database');
                throw new Error('Failed to retrieve created order');
            }

            console.log('Created order retrieved successfully, ID:', createdOrder.id);
            return createdOrder;
        } catch (error) {
            console.error('Error creating order:', error);
            throw error;
        }
    }

    /**
     * Maps the database order data to a view model
     * @param orderData - The order data from the database
     * @returns The order view model or null if mapping fails
     */
    private mapToViewModel(orderData: OrderQueryResult): OrderViewModel | null {
        const shippingAddress = orderData.addresses?.[0];
        if (!shippingAddress) return null;

        return {
            id: orderData.id,
            orderNumber: formatOrderNumber(orderData.id, orderData.createdAt),
            status: orderData.status,
            total: orderData.total,
            subtotal: orderData.subtotal,
            taxAmount: 0,
            shippingAmount: 0,
            discountAmount: orderData.discountAmount || undefined,
            currency: 'USD',
            shippingMethod: 'standard',
            paymentMethod: orderData.stripePaymentIntentId ? 'stripe' : 'unknown',
            createdAt: orderData.createdAt.toISOString(),
            items: orderData.items.map((item) => {
                // Handle composites which could be a string, array, or object
                let composites = [];
                try {
                    if (typeof item.composites === 'string' && item.composites.trim() !== '') {
                        // If it's a non-empty string, try to parse it
                        composites = JSON.parse(item.composites);
                    } else if (Array.isArray(item.composites)) {
                        // If it's already an array, use it directly
                        composites = item.composites;
                    } else if (typeof item.composites === 'object' && item.composites !== null) {
                        // If it's an object (like Prisma's JsonValue), convert it to an array if possible
                        const jsonValue = item.composites as any;
                        if (jsonValue.length !== undefined) {
                            composites = Array.from(jsonValue);
                        }
                    }
                } catch (e) {
                    console.error('Error handling composites:', e);
                    composites = [];
                }

                return {
                    id: item.id,
                    productId: item.productId,
                    variantId: item.variantId,
                    quantity: item.quantity,
                    unitPrice: item.price,
                    totalPrice: item.quantity * item.price,
                    name: item.name,
                    variantName: item.variantName,
                    composites: composites.length > 0 ? composites : undefined
                };
            }),
            shippingAddress: {
                firstName: shippingAddress.firstName,
                lastName: shippingAddress.lastName,
                address1: shippingAddress.address1,
                address2: shippingAddress.address2 || undefined,
                city: shippingAddress.city,
                state: shippingAddress.state,
                postalCode: shippingAddress.postalCode,
                country: shippingAddress.country,
                phone: shippingAddress.phone || undefined,
                email: orderData.email
            }
        };
    }

    /**
     * Gets an order by its ID
     * @param id - The order ID
     * @returns The order view model or null if not found
     */
    async getOrderById(id: string): Promise<OrderViewModel | null> {
        try {
            console.log('Repository: Getting order by ID:', id);
            const result = await prisma.order.findUnique({
                where: { id },
                include: {
                    items: true,
                    addresses: {
                        where: {
                            type: 'shipping'
                        }
                    }
                }
            }) as OrderQueryResult | null;

            console.log('Repository: Order query result:', result ? 'Found' : 'Not found');

            if (!result) {
                console.log('Repository: Order not found in database');
                return null;
            }

            if (!result.items?.length || !result.addresses?.length) {
                console.log('Repository: Order found but missing items or addresses');
                return null;
            }

            const viewModel = this.mapToViewModel(result);
            console.log('Repository: Mapped order to view model:', viewModel ? 'Success' : 'Failed');
            console.log('Repository: Order ID in view model:', viewModel?.id);
            console.log('Repository: Order number in view model:', viewModel?.orderNumber);

            return viewModel;
        } catch (error) {
            console.error(`Error getting order ${id}:`, error);
            return null;
        }
    }

    /**
     * Updates the status of an order
     * @param id - The order ID
     * @param status - The new status
     * @param note - Optional note about the status change
     */
    async updateOrderStatus(id: string, status: OrderStatus, note?: string): Promise<void> {
        try {
            await prisma.$transaction(async (tx) => {
                // Update the order status
                await tx.order.update({
                    where: { id },
                    data: {
                        status,
                        updatedAt: new Date()
                    }
                });

                // Create a status history entry
                await tx.orderStatusHistory.create({
                    data: {
                        id: randomUUID(),
                        orderId: id,
                        status,
                        note
                    }
                });
            });
        } catch (error) {
            console.error(`Error updating order status for ${id}:`, error);
            throw new Error(`Failed to update order status: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Creates a payment transaction for an order
     * @param orderId - The order ID
     * @param amount - The payment amount
     * @param paymentMethod - The payment method
     * @param paymentIntentId - Optional payment intent ID
     * @param status - The payment status (default: 'pending')
     */
    async createPaymentTransaction(
        orderId: string,
        amount: number,
        paymentMethod: string,
        paymentIntentId?: string,
        status: PaymentStatus = PaymentStatus.PENDING
    ): Promise<void> {
        try {
            await prisma.paymentTransaction.create({
                data: {
                    id: randomUUID(),
                    orderId,
                    status,
                    amount,
                    currency: 'USD',
                    stripePaymentIntentId: paymentIntentId || randomUUID(),
                    stripePaymentMethodId: paymentMethod
                }
            });
        } catch (error) {
            console.error(`Error creating payment transaction for order ${orderId}:`, error);
            throw new Error(`Failed to create payment transaction: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Creates a refund for an order
     * @param orderId - The order ID
     * @param transactionId - The payment transaction ID
     * @param amount - The refund amount
     * @param reason - Optional reason for the refund
     * @param refundId - Optional refund ID
     */
    async createRefund(
        orderId: string,
        transactionId: string,
        amount: number,
        reason?: string,
        refundId?: string
    ): Promise<void> {
        try {
            await prisma.$transaction(async (tx) => {
                // Create the refund
                await tx.refund.create({
                    data: {
                        id: randomUUID(),
                        orderId,
                        transactionId,
                        amount,
                        reason: reason || 'Refund requested',
                        status: 'pending',
                        stripeRefundId: refundId
                    }
                });

                // Update the order status
                await tx.order.update({
                    where: { id: orderId },
                    data: {
                        status: 'refunded',
                        updatedAt: new Date()
                    }
                });

                // Create status history entry
                await tx.orderStatusHistory.create({
                    data: {
                        id: randomUUID(),
                        orderId,
                        status: 'refunded',
                        note: reason
                    }
                });
            });
        } catch (error) {
            console.error(`Error creating refund for order ${orderId}:`, error);
            throw new Error(`Failed to create refund: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Gets all orders for a user
     * @param userId - The user ID
     * @returns Array of order view models
     */
    async getOrdersByUserId(userId: string): Promise<OrderViewModel[]> {
        try {
            const results = await prisma.order.findMany({
                where: { userId },
                include: {
                    items: true,
                    addresses: {
                        where: {
                            type: 'shipping'
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }) as OrderQueryResult[];

            const orders = results.map(result => this.mapToViewModel(result));
            return orders.filter((order): order is OrderViewModel => order !== null);
        } catch (error) {
            console.error(`Error getting orders for user ${userId}:`, error);
            return [];
        }
    }

    /**
     * Gets the status history for an order
     * @param orderId - The order ID
     * @returns Array of status history entries
     */
    async getOrderStatusHistory(orderId: string): Promise<Array<{ status: OrderStatus | string; note?: string; createdAt: string }>> {
        try {
            const history = await prisma.orderStatusHistory.findMany({
                where: { orderId },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            return history.map(item => ({
                status: item.status,
                note: item.note ?? undefined,
                createdAt: item.createdAt.toISOString()
            }));
        } catch (error) {
            console.error(`Error getting status history for order ${orderId}:`, error);
            return [];
        }
    }

    /**
     * Gets all orders with a specific status
     * @param status - The order status
     * @returns Array of order view models
     */
    async getOrdersByStatus(status: OrderStatus): Promise<OrderViewModel[]> {
        try {
            const results = await prisma.order.findMany({
                where: { status },
                include: {
                    items: true,
                    addresses: {
                        where: {
                            type: 'shipping'
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }) as OrderQueryResult[];

            const orders = results.map(result => this.mapToViewModel(result));
            return orders.filter((order): order is OrderViewModel => order !== null);
        } catch (error) {
            console.error(`Error getting orders with status ${status}:`, error);
            return [];
        }
    }

    /**
     * Gets all payment transactions for an order
     * @param orderId - The order ID
     * @returns Array of payment transactions
     */
    async getOrderPaymentTransactions(orderId: string): Promise<PaymentTransaction[]> {
        try {
            const transactions = await prisma.paymentTransaction.findMany({
                where: { orderId },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            return transactions;
        } catch (error) {
            console.error(`Error getting payment transactions for order ${orderId}:`, error);
            return [];
        }
    }
}

// Export an instance of the repository
export const orderRepository = new OrderRepository();
