import { sql } from 'drizzle-orm';
import { text, integer, sqliteTable, index } from 'drizzle-orm/sqlite-core';
import { orders } from './order';
import { paymentTransactions } from './payment-transaction';

export const refundStatus = ['pending', 'succeeded', 'failed'] as const;
export type RefundStatus = typeof refundStatus[number];

export const refunds = sqliteTable('refunds', {
    id: text('id').primaryKey(),
    orderId: text('order_id')
        .notNull()
        .references(() => orders.id),
    transactionId: text('transaction_id')
        .notNull()
        .references(() => paymentTransactions.id),
    amount: integer('amount', { mode: 'number' }).notNull(),
    reason: text('reason'),
    status: text('status', { enum: refundStatus }).notNull(),
    refundId: text('refund_id'),
    createdAt: text('created_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
    // Index for order lookups
    orderIdIndex: index('refunds_order_id_idx').on(table.orderId),
    // Index for transaction lookups
    transactionIdIndex: index('refunds_transaction_id_idx').on(table.transactionId),
    // Index for status-based lookups
    statusIndex: index('refunds_status_idx').on(table.status),
    // Index for refund ID lookups
    refundIdIndex: index('refunds_refund_id_idx').on(table.refundId)
}));

// Export types
export type Refund = typeof refunds.$inferSelect;
export type NewRefund = typeof refunds.$inferInsert; 