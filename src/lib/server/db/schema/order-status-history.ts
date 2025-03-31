import { sql } from 'drizzle-orm';
import * as t from "drizzle-orm/sqlite-core";
import { order } from './order';
import { orderStatus } from './types';

export const orderStatusHistory = t.sqliteTable('order_status_history', {
    id: t.text('id').primaryKey(),
    orderId: t.text('order_id')
        .notNull()
        .references(() => order.id, { onDelete: 'cascade' }),
    status: t.text('status', { enum: orderStatus }).notNull(),
    note: t.text('note'),
    createdAt: t.integer('created_at', { mode: 'timestamp' })
        .notNull()
        .default(sql`(unixepoch())`)
}, (table) => [
    t.index('order_status_history_order_id_idx').on(table.orderId),
    t.index('order_status_history_status_idx').on(table.status)
]);

// Export types
export type OrderStatusHistory = typeof orderStatusHistory.$inferSelect;
export type NewOrderStatusHistory = typeof orderStatusHistory.$inferInsert; 