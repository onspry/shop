import { sql } from 'drizzle-orm';
import * as t from "drizzle-orm/sqlite-core";
import { orders, orderStatus } from './order';

export const orderStatusHistory = t.sqliteTable('order_status_history', {
    id: t.text('id').primaryKey(),
    orderId: t.text('order_id')
        .notNull()
        .references(() => orders.id),
    status: t.text('status', { enum: orderStatus }).notNull(),
    note: t.text('note'),
    createdAt: t.integer('created_at', { mode: 'timestamp' })
        .notNull()
        .default(sql`(unixepoch())`)
}, (table) => ({
    // Index for order lookups
    orderIdIndex: t.index('order_status_history_order_id_idx').on(table.orderId),
    // Index for status-based lookups
    statusIndex: t.index('order_status_history_status_idx').on(table.status),
    // Index for chronological lookups
    createdAtIndex: t.index('order_status_history_created_at_idx').on(table.createdAt)
}));

// Export types
export type OrderStatusHistory = typeof orderStatusHistory.$inferSelect;
export type NewOrderStatusHistory = typeof orderStatusHistory.$inferInsert; 