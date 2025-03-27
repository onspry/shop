import { sql } from 'drizzle-orm';
import { text, integer, sqliteTable, index } from 'drizzle-orm/sqlite-core';
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

export const orders = sqliteTable('orders', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => user.id),
    status: text('status', { enum: orderStatus }).notNull().default('pending'),
    totalAmount: integer('total_amount', { mode: 'number' }).notNull(),
    subtotal: integer('subtotal', { mode: 'number' }).notNull(),
    taxAmount: integer('tax_amount', { mode: 'number' }).notNull(),
    shippingAmount: integer('shipping_amount', { mode: 'number' }).notNull(),
    discountAmount: integer('discount_amount', { mode: 'number' }),
    currency: text('currency').notNull().default('USD'),
    shippingMethod: text('shipping_method').notNull(),
    paymentMethod: text('payment_method').notNull(),
    paymentIntentId: text('payment_intent_id'),
    createdAt: text('created_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
    // Index for order history queries
    createdAtIndex: index('orders_created_at_idx').on(table.createdAt),
    // Index for user order queries
    userIdIndex: index('orders_user_id_idx').on(table.userId),
    // Index for status-based queries
    statusIndex: index('orders_status_idx').on(table.status)
}));

// Export types
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert; 