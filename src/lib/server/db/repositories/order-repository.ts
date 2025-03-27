import { db } from '$lib/server/db';
import { eq, desc, and, between } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type {
    OrderStatus,
    TransactionStatus,
    PaymentTransaction,
    Refund
} from '$lib/server/db/schema';
import {
    orders,
    orderItems,
    orderAddresses,
    orderStatusHistory,
    paymentTransactions,
    refunds,
    inventoryTransactions
} from '$lib/server/db/schema';

interface CreateOrderData {
    userId?: string;
    items: Array<{
        productId: string;
        variantId?: string;
        quantity: number;
        unitPrice: number;
    }>;
    shipping: {
        method: string;
        amount: number;
        address: {
            firstName: string;
            lastName: string;
            addressLine1: string;
            addressLine2?: string;
            city: string;
            state: string;
            postalCode: string;
            country: string;
            phone?: string;
            email: string;
        };
    };
    payment: {
        method: string;
        intentId?: string;
    };
    subtotal: number;
    taxAmount: number;
    discountAmount?: number;
    currency?: string;
}

interface OrderViewModel {
    id: string;
    status: OrderStatus;
    totalAmount: number;
    subtotal: number;
    taxAmount: number;
    shippingAmount: number;
    discountAmount?: number;
    currency: string;
    shippingMethod: string;
    paymentMethod: string;
    createdAt: string;
    items: Array<{
        id: string;
        productId: string;
        variantId?: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
    }>;
    shippingAddress: {
        firstName: string;
        lastName: string;
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        phone?: string;
        email: string;
    };
}

export class OrderRepository {
    private validate(data: CreateOrderData): void {
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
        if (!data.shipping.address.addressLine1 || !data.shipping.address.city ||
            !data.shipping.address.state || !data.shipping.address.postalCode ||
            !data.shipping.address.country) {
            throw new Error('Complete shipping address is required');
        }
    }

    async createOrder(data: CreateOrderData): Promise<OrderViewModel> {
        this.validate(data);

        const orderId = nanoid();
        const totalAmount = data.subtotal + data.taxAmount + data.shipping.amount - (data.discountAmount || 0);

        await db.transaction(async (tx) => {
            // Create order
            await tx
                .insert(orders)
                .values({
                    id: orderId,
                    userId: data.userId,
                    status: 'pending',
                    totalAmount,
                    subtotal: data.subtotal,
                    taxAmount: data.taxAmount,
                    shippingAmount: data.shipping.amount,
                    discountAmount: data.discountAmount,
                    currency: data.currency || 'USD',
                    shippingMethod: data.shipping.method,
                    paymentMethod: data.payment.method,
                    paymentIntentId: data.payment.intentId
                });

            // Create order items
            const orderItemsData = data.items.map(item => ({
                id: nanoid(),
                orderId,
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.quantity * item.unitPrice
            }));

            await tx.insert(orderItems).values(orderItemsData);

            // Create shipping address
            await tx.insert(orderAddresses).values({
                id: nanoid(),
                orderId,
                type: 'shipping',
                ...data.shipping.address
            });

            // Create initial status history
            await tx.insert(orderStatusHistory).values({
                id: nanoid(),
                orderId,
                status: 'pending',
                note: 'Order created'
            });

            // Update inventory
            for (const item of data.items) {
                await tx.insert(inventoryTransactions).values({
                    id: nanoid(),
                    productId: item.productId,
                    variantId: item.variantId,
                    quantity: -item.quantity,
                    type: 'order',
                    referenceId: orderId,
                    note: `Order ${orderId}`
                });
            }
        });

        const order = await this.getOrderById(orderId);
        if (!order) {
            throw new Error('Failed to create order');
        }
        return order;
    }

    async getOrderById(id: string): Promise<OrderViewModel | null> {
        const order = await db.query.orders.findFirst({
            where: eq(orders.id, id),
            with: {
                items: true,
                addresses: {
                    where: eq(orderAddresses.type, 'shipping')
                }
            }
        });

        if (!order) return null;

        return {
            id: order.id,
            status: order.status,
            totalAmount: order.totalAmount,
            subtotal: order.subtotal,
            taxAmount: order.taxAmount,
            shippingAmount: order.shippingAmount,
            discountAmount: order.discountAmount ?? undefined,
            currency: order.currency,
            shippingMethod: order.shippingMethod,
            paymentMethod: order.paymentMethod,
            createdAt: order.createdAt,
            items: order.items,
            shippingAddress: order.addresses[0]
        };
    }

    async updateOrderStatus(id: string, status: OrderStatus, note?: string): Promise<void> {
        await db.transaction(async (tx) => {
            await tx
                .update(orders)
                .set({
                    status,
                    updatedAt: new Date().toISOString()
                })
                .where(eq(orders.id, id));

            await tx.insert(orderStatusHistory).values({
                id: nanoid(),
                orderId: id,
                status,
                note
            });
        });
    }

    async createPaymentTransaction(
        orderId: string,
        amount: number,
        paymentMethod: string,
        paymentIntentId?: string,
        status: TransactionStatus = 'pending'
    ): Promise<void> {
        await db.insert(paymentTransactions).values({
            id: nanoid(),
            orderId,
            amount,
            status,
            paymentMethod,
            paymentIntentId
        });
    }

    async createRefund(
        orderId: string,
        transactionId: string,
        amount: number,
        reason?: string,
        refundId?: string
    ): Promise<void> {
        await db.transaction(async (tx) => {
            await tx.insert(refunds).values({
                id: nanoid(),
                orderId,
                transactionId,
                amount,
                reason,
                status: 'pending',
                refundId
            });

            await this.updateOrderStatus(orderId, 'refunded', reason);
        });
    }

    async getOrdersByUserId(userId: string): Promise<OrderViewModel[]> {
        const userOrders = await db.query.orders.findMany({
            where: eq(orders.userId, userId),
            with: {
                items: true,
                addresses: {
                    where: eq(orderAddresses.type, 'shipping')
                }
            },
            orderBy: [desc(orders.createdAt)]
        });

        return userOrders.map(order => ({
            id: order.id,
            status: order.status,
            totalAmount: order.totalAmount,
            subtotal: order.subtotal,
            taxAmount: order.taxAmount,
            shippingAmount: order.shippingAmount,
            discountAmount: order.discountAmount ?? undefined,
            currency: order.currency,
            shippingMethod: order.shippingMethod,
            paymentMethod: order.paymentMethod,
            createdAt: order.createdAt,
            items: order.items,
            shippingAddress: order.addresses[0]
        }));
    }

    async getOrderStatusHistory(orderId: string): Promise<Array<{ status: OrderStatus; note?: string; createdAt: string }>> {
        const history = await db.query.orderStatusHistory.findMany({
            where: eq(orderStatusHistory.orderId, orderId),
            orderBy: [desc(orderStatusHistory.createdAt)]
        });

        return history.map(item => ({
            status: item.status,
            note: item.note ?? undefined,
            createdAt: item.createdAt
        }));
    }

    async getOrdersByEmail(email: string): Promise<OrderViewModel[]> {
        const userOrders = await db.query.orders.findMany({
            where: and(
                eq(orderAddresses.email, email),
                eq(orderAddresses.type, 'shipping')
            ),
            with: {
                items: true,
                addresses: {
                    where: eq(orderAddresses.type, 'shipping')
                }
            },
            orderBy: [desc(orders.createdAt)]
        });

        return userOrders.map(order => ({
            id: order.id,
            status: order.status,
            totalAmount: order.totalAmount,
            subtotal: order.subtotal,
            taxAmount: order.taxAmount,
            shippingAmount: order.shippingAmount,
            discountAmount: order.discountAmount ?? undefined,
            currency: order.currency,
            shippingMethod: order.shippingMethod,
            paymentMethod: order.paymentMethod,
            createdAt: order.createdAt,
            items: order.items,
            shippingAddress: order.addresses[0]
        }));
    }

    async getOrdersByDateRange(startDate: Date, endDate: Date): Promise<OrderViewModel[]> {
        const dateRangeOrders = await db.query.orders.findMany({
            where: between(orders.createdAt, startDate.toISOString(), endDate.toISOString()),
            with: {
                items: true,
                addresses: {
                    where: eq(orderAddresses.type, 'shipping')
                }
            },
            orderBy: [desc(orders.createdAt)]
        });

        return dateRangeOrders.map(order => ({
            id: order.id,
            status: order.status,
            totalAmount: order.totalAmount,
            subtotal: order.subtotal,
            taxAmount: order.taxAmount,
            shippingAmount: order.shippingAmount,
            discountAmount: order.discountAmount ?? undefined,
            currency: order.currency,
            shippingMethod: order.shippingMethod,
            paymentMethod: order.paymentMethod,
            createdAt: order.createdAt,
            items: order.items,
            shippingAddress: order.addresses[0]
        }));
    }

    async getOrdersByStatus(status: OrderStatus): Promise<OrderViewModel[]> {
        const statusOrders = await db.query.orders.findMany({
            where: eq(orders.status, status),
            with: {
                items: true,
                addresses: {
                    where: eq(orderAddresses.type, 'shipping')
                }
            },
            orderBy: [desc(orders.createdAt)]
        });

        return statusOrders.map(order => ({
            id: order.id,
            status: order.status,
            totalAmount: order.totalAmount,
            subtotal: order.subtotal,
            taxAmount: order.taxAmount,
            shippingAmount: order.shippingAmount,
            discountAmount: order.discountAmount ?? undefined,
            currency: order.currency,
            shippingMethod: order.shippingMethod,
            paymentMethod: order.paymentMethod,
            createdAt: order.createdAt,
            items: order.items,
            shippingAddress: order.addresses[0]
        }));
    }

    async getOrderPaymentTransactions(orderId: string): Promise<PaymentTransaction[]> {
        const transactions = await db.query.paymentTransactions.findMany({
            where: eq(paymentTransactions.orderId, orderId),
            orderBy: [desc(paymentTransactions.createdAt)]
        });

        return transactions;
    }

    async getOrderRefunds(orderId: string): Promise<Refund[]> {
        const orderRefunds = await db.query.refunds.findMany({
            where: eq(refunds.orderId, orderId),
            with: {
                transaction: true
            },
            orderBy: [desc(refunds.createdAt)]
        });

        return orderRefunds;
    }
} 