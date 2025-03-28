import { sql } from 'drizzle-orm';
import * as t from "drizzle-orm/sqlite-core";
import { orders } from './order';

export const transactionStatus = [
    'succeeded',
    'pending',
    'failed'
] as const;

export type TransactionStatus = typeof transactionStatus[number];

export const paymentTransactions = t.sqliteTable('payment_transactions', {
    id: t.text('id').primaryKey(),
    orderId: t.text('order_id')
        .notNull()
        .references(() => orders.id),
    amount: t.integer('amount', { mode: 'number' }).notNull(),
    currency: t.text('currency').notNull().default('USD'),
    status: t.text('status', { enum: transactionStatus }).notNull(),
    paymentMethod: t.text('payment_method').notNull(),
    paymentIntentId: t.text('payment_intent_id'),
    errorMessage: t.text('error_message'),
    createdAt: t.integer('created_at', { mode: 'timestamp' })
        .notNull()
        .default(sql`(unixepoch())`)
}, (table) => ({
    // Index for order lookups
    orderIdIndex: t.index('payment_transactions_order_id_idx').on(table.orderId),
    // Index for status-based lookups
    statusIndex: t.index('payment_transactions_status_idx').on(table.status),
    // Index for payment intent lookups
    paymentIntentIdIndex: t.index('payment_transactions_payment_intent_id_idx').on(table.paymentIntentId)
}));

// Export types
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type NewPaymentTransaction = typeof paymentTransactions.$inferInsert; 