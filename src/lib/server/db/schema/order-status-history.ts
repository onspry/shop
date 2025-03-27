import { sql } from 'drizzle-orm';
import { text, sqliteTable, index } from 'drizzle-orm/sqlite-core';
import { orders, orderStatus } from './order';

export const orderStatusHistory = sqliteTable('order_status_history', {
    id: text('id').primaryKey(),
    orderId: text('order_id')
        .notNull()
        .references(() => orders.id),
    status: text('status', { enum: orderStatus }).notNull(),
    note: text('note'),
    createdAt: text('created_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
    // Index for order lookups
    orderIdIndex: index('order_status_history_order_id_idx').on(table.orderId),
    // Index for status-based lookups
    statusIndex: index('order_status_history_status_idx').on(table.status),
    // Index for chronological lookups
    createdAtIndex: index('order_status_history_created_at_idx').on(table.createdAt)
}));

// Export types
export type OrderStatusHistory = typeof orderStatusHistory.$inferSelect;
export type NewOrderStatusHistory = typeof orderStatusHistory.$inferInsert; 