import { sql } from 'drizzle-orm';
import * as t from "drizzle-orm/sqlite-core";
import { order } from './order';
import { paymentTransaction } from './payment-transaction';

export const refundStatus = ['pending', 'succeeded', 'failed'] as const;
export type RefundStatus = typeof refundStatus[number];

export const refund = t.sqliteTable('refund', {
    id: t.text('id').primaryKey(),
    orderId: t.text('order_id')
        .notNull()
        .references(() => order.id),
    status: t.text('status', { enum: refundStatus }).notNull().default('pending'),
    amount: t.integer('amount').notNull(), // Store amount in cents
    reason: t.text('reason').notNull(),
    note: t.text('note'),
    stripeRefundId: t.text('stripe_refund_id'),
    errorMessage: t.text('error_message'),
    createdAt: t.integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedAt: t.integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    transactionId: t.text('transaction_id')
        .notNull()
        .references(() => paymentTransaction.id),
    refundId: t.text('refund_id')
}, (table) => [
    t.index('refund_order_id_idx').on(table.orderId),
    t.index('refund_status_idx').on(table.status),
    t.index('refund_stripe_refund_id_idx').on(table.stripeRefundId),
    t.index('refund_transaction_id_idx').on(table.transactionId),
    t.index('refund_refund_id_idx').on(table.refundId)
]);

// Export types
export type Refund = typeof refund.$inferSelect;
export type NewRefund = typeof refund.$inferInsert; 