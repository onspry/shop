import { sql } from 'drizzle-orm';
import * as t from "drizzle-orm/sqlite-core";
import { user } from './user';

export const orderStatus = [
    'pending',
    'paid',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded'
] as const;

export type OrderStatus = typeof orderStatus[number];

export const orders = t.sqliteTable('orders', {
    id: t.text('id').primaryKey(),
    userId: t.text('user_id').references(() => user.id),
    status: t.text('status', { enum: orderStatus }).notNull().default('pending'),
    totalAmount: t.integer('total_amount', { mode: 'number' }).notNull(),
    subtotal: t.integer('subtotal', { mode: 'number' }).notNull(),
    taxAmount: t.integer('tax_amount', { mode: 'number' }).notNull(),
    shippingAmount: t.integer('shipping_amount', { mode: 'number' }).notNull(),
    discountAmount: t.integer('discount_amount', { mode: 'number' }),
    currency: t.text('currency').notNull().default('USD'),
    shippingMethod: t.text('shipping_method').notNull(),
    paymentMethod: t.text('payment_method').notNull(),
    paymentIntentId: t.text('payment_intent_id'),
    createdAt: t.integer('created_at', { mode: 'timestamp' })
        .notNull()
        .default(sql`(unixepoch())`),
    updatedAt: t.integer('updated_at', { mode: 'timestamp' })
        .notNull()
        .default(sql`(unixepoch())`)
}, (table) => ({
    // Index for order history queries
    createdAtIndex: t.index('orders_created_at_idx').on(table.createdAt),
    // Index for user order queries
    userIdIndex: t.index('orders_user_id_idx').on(table.userId),
    // Index for status-based queries
    statusIndex: t.index('orders_status_idx').on(table.status)
}));

// Export types
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert; 