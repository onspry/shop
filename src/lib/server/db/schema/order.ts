import { sql } from 'drizzle-orm';
import * as t from "drizzle-orm/sqlite-core";
import { user } from './user';
import { relations } from 'drizzle-orm';
import { orderItem } from './order-item';
import { orderAddress } from './order-address';
import { orderStatusHistory } from './order-status-history';
import { paymentTransaction } from './payment-transaction';
import { refund } from './refund';
import { inventoryTransaction } from './inventory-transaction';
import { orderStatus } from './types';

export type { OrderStatus } from './types';

export const order = t.sqliteTable('order', {
    id: t.text('id').primaryKey(),
    userId: t.text('user_id')
        .references(() => user.id),
    cartId: t.text('cart_id').notNull(),
    status: t.text('status', { enum: orderStatus }).notNull().default('pending_payment'),
    email: t.text('email').notNull(),
    firstName: t.text('first_name').notNull(),
    lastName: t.text('last_name').notNull(),
    subtotal: t.integer('subtotal').notNull(), // Store amount in cents
    discountCode: t.text('discount_code'),
    discountAmount: t.integer('discount_amount').default(0), // Store amount in cents
    total: t.integer('total').notNull(), // Store amount in cents
    stripePaymentIntentId: t.text('stripe_payment_intent_id'),
    stripeClientSecret: t.text('stripe_client_secret'),
    createdAt: t.integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedAt: t.integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`)
}, (table) => [
    t.index('order_user_id_idx').on(table.userId),
    t.index('order_cart_id_idx').on(table.cartId),
    t.index('order_email_idx').on(table.email),
    t.index('order_status_idx').on(table.status),
    t.index('order_stripe_payment_intent_id_idx').on(table.stripePaymentIntentId)
]);

export const orderRelations = relations(order, ({ one, many }) => ({
    user: one(user, {
        fields: [order.userId],
        references: [user.id],
    }),
    items: many(orderItem),
    addresses: many(orderAddress),
    statusHistory: many(orderStatusHistory),
    paymentTransactions: many(paymentTransaction),
    refunds: many(refund),
    inventoryTransactions: many(inventoryTransaction)
}));

// Export types
export type Order = typeof order.$inferSelect;
export type NewOrder = typeof order.$inferInsert; 