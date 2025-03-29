import { eq, desc, between } from 'drizzle-orm';
import { randomUUID } from 'crypto';

import {
    db,
    type OrderStatus,
    type PaymentStatus,
    type PaymentTransaction,
    type Refund,
    type Order,
    type OrderItem,
    type OrderAddress
} from '$lib/server/db';

import { order } from '../db/schema/order';
import { orderItem } from '../db/schema/order-item';
import { orderAddress } from '../db/schema/order-address';
import { orderStatusHistory } from '../db/schema/order-status-history';
import { inventoryTransaction } from '../db/schema/inventory-transaction';
import { paymentTransaction } from '../db/schema/payment-transaction';
import { refund } from '../db/schema/refund';


interface CreateOrderData {
    userId?: string;
    cartId: string;
    items: Array<{
        productId: string;
        variantId?: string;
        quantity: number;
        unitPrice: number;
        name: string;
        variantName: string;
    }>;
    shipping: {
        method: string;
        amount: number;
        address: {
            firstName: string;
            lastName: string;
            address1: string;
            address2?: string;
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
    total: number;
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
        name: string;
        variantName: string;
    }>;
    shippingAddress: {
        firstName: string;
        lastName: string;
        address1: string;
        address2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        phone?: string;
        email: string;
    };
}

interface OrderQueryResult extends Order {
    items: Array<OrderItem>;
    addresses: Array<OrderAddress>;
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
        if (!data.shipping.address.address1 || !data.shipping.address.city ||
            !data.shipping.address.state || !data.shipping.address.postalCode ||
            !data.shipping.address.country) {
            throw new Error('Complete shipping address is required');
        }
    }

    async createOrder(data: CreateOrderData): Promise<OrderViewModel> {
        this.validate(data);

        const orderId = randomUUID();
        const totalAmount = data.subtotal + data.taxAmount + data.shipping.amount - (data.discountAmount || 0);

        await db.transaction(async (tx) => {
            // Create order
            await tx
                .insert(order)
                .values({
                    id: orderId,
                    userId: data.userId,
                    cartId: data.cartId,
                    status: 'pending_payment',
                    email: data.shipping.address.email,
                    firstName: data.shipping.address.firstName,
                    lastName: data.shipping.address.lastName,
                    subtotal: data.subtotal,
                    discountAmount: data.discountAmount || 0,
                    total: totalAmount,
                    stripePaymentIntentId: data.payment.intentId
                });

            // Create order items
            const orderItemsData = data.items.map(item => ({
                id: randomUUID(),
                orderId,
                productVariantId: item.variantId || '',
                quantity: item.quantity,
                price: item.unitPrice,
                name: item.name,
                variantName: item.variantName
            }));

            await tx.insert(orderItem).values(orderItemsData);

            // Create shipping address
            await tx.insert(orderAddress).values({
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
            });

            // Create initial status history
            await tx.insert(orderStatusHistory).values({
                id: randomUUID(),
                orderId,
                status: 'pending_payment',
                note: 'Order created'
            });

            // Update inventory
            for (const item of data.items) {
                if (item.variantId) {
                    await tx.insert(inventoryTransaction).values({
                        id: randomUUID(),
                        productVariantId: item.variantId,
                        orderId,
                        type: 'order',
                        quantity: -item.quantity,
                        note: `Order ${orderId}`
                    });
                }
            }
        });

        const createdOrder = await this.getOrderById(orderId);
        if (!createdOrder) {
            throw new Error('Failed to create order');
        }
        return createdOrder;
    }

    private mapToViewModel(orderData: OrderQueryResult): OrderViewModel | null {
        const shippingAddress = orderData.addresses?.[0];
        if (!shippingAddress) return null;

        return {
            id: orderData.id,
            status: orderData.status,
            total: orderData.total,
            subtotal: orderData.subtotal,
            taxAmount: 0, // Tax is included in total
            shippingAmount: 0, // Shipping is included in total
            discountAmount: orderData.discountAmount || undefined,
            currency: 'USD',
            shippingMethod: 'standard', // Default shipping method
            paymentMethod: orderData.stripePaymentIntentId ? 'stripe' : 'unknown',
            createdAt: orderData.createdAt.toISOString(),
            items: orderData.items.map((item) => ({
                id: item.id,
                productId: item.productVariantId,
                variantId: item.productVariantId,
                quantity: item.quantity,
                unitPrice: item.price,
                totalPrice: item.quantity * item.price,
                name: item.name,
                variantName: item.variantName
            })),
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

    async getOrderById(id: string): Promise<OrderViewModel | null> {
        const result = await db.query.order.findFirst({
            where: eq(order.id, id),
            with: {
                items: true,
                addresses: {
                    where: eq(orderAddress.type, 'shipping')
                }
            }
        }) as OrderQueryResult | null;

        if (!result) return null;
        if (!result.items?.length || !result.addresses?.length) return null;

        return this.mapToViewModel(result);
    }

    async updateOrderStatus(id: string, status: OrderStatus, note?: string): Promise<void> {
        await db.transaction(async (tx) => {
            await tx
                .update(order)
                .set({
                    status,
                    updatedAt: new Date()
                })
                .where(eq(order.id, id));

            await tx.insert(orderStatusHistory).values({
                id: randomUUID(),
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
        status: PaymentStatus = 'pending'
    ): Promise<void> {
        await db.insert(paymentTransaction).values({
            id: randomUUID(),
            orderId,
            status,
            amount,
            currency: 'USD',
            stripePaymentIntentId: paymentIntentId || randomUUID(),
            stripePaymentMethodId: paymentMethod
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
            await tx.insert(refund).values({
                id: randomUUID(),
                orderId,
                transactionId,
                amount,
                reason: reason || 'Refund requested',
                status: 'pending',
                stripeRefundId: refundId || undefined
            });

            await this.updateOrderStatus(orderId, 'refunded', reason);
        });
    }

    async getOrdersByUserId(userId: string): Promise<OrderViewModel[]> {
        const results = await db.query.order.findMany({
            where: eq(order.userId, userId),
            with: {
                items: true,
                addresses: {
                    where: eq(orderAddress.type, 'shipping')
                }
            },
            orderBy: [desc(order.createdAt)]
        }) as OrderQueryResult[];

        const orders = results.map(result => this.mapToViewModel(result));
        return orders.filter((order): order is OrderViewModel => order !== null);
    }

    async getOrderStatusHistory(orderId: string): Promise<Array<{ status: OrderStatus; note?: string; createdAt: string }>> {
        const history = await db.query.orderStatusHistory.findMany({
            where: eq(orderStatusHistory.orderId, orderId),
            orderBy: [desc(orderStatusHistory.createdAt)]
        });

        return history.map(item => ({
            status: item.status,
            note: item.note ?? undefined,
            createdAt: item.createdAt.toISOString()
        }));
    }

    async getOrdersByEmail(email: string): Promise<OrderViewModel[]> {
        const results = await db.query.order.findMany({
            where: eq(order.email, email),
            with: {
                items: true,
                addresses: {
                    where: eq(orderAddress.type, 'shipping')
                }
            },
            orderBy: [desc(order.createdAt)]
        }) as OrderQueryResult[];

        const orders = results.map(result => this.mapToViewModel(result));
        return orders.filter((order): order is OrderViewModel => order !== null);
    }

    async getOrdersByDateRange(startDate: Date, endDate: Date): Promise<OrderViewModel[]> {
        const results = await db.query.order.findMany({
            where: between(order.createdAt, startDate, endDate),
            with: {
                items: true,
                addresses: {
                    where: eq(orderAddress.type, 'shipping')
                }
            },
            orderBy: [desc(order.createdAt)]
        }) as OrderQueryResult[];

        const orders = results.map(result => this.mapToViewModel(result));
        return orders.filter((order): order is OrderViewModel => order !== null);
    }

    async getOrdersByStatus(status: OrderStatus): Promise<OrderViewModel[]> {
        const results = await db.query.order.findMany({
            where: eq(order.status, status),
            with: {
                items: true,
                addresses: {
                    where: eq(orderAddress.type, 'shipping')
                }
            },
            orderBy: [desc(order.createdAt)]
        }) as OrderQueryResult[];

        const orders = results.map(result => this.mapToViewModel(result));
        return orders.filter((order): order is OrderViewModel => order !== null);
    }

    async getOrderPaymentTransactions(orderId: string): Promise<PaymentTransaction[]> {
        const transactions = await db.query.paymentTransaction.findMany({
            where: eq(paymentTransaction.orderId, orderId),
            orderBy: [desc(paymentTransaction.createdAt)]
        });

        return transactions;
    }

    async getOrderRefunds(orderId: string): Promise<Refund[]> {
        const orderRefunds = await db.query.refund.findMany({
            where: eq(refund.orderId, orderId),
            with: {
                transaction: true
            },
            orderBy: [desc(refund.createdAt)]
        });

        return orderRefunds;
    }
} 