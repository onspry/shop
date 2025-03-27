import { sql } from 'drizzle-orm';
import { text, integer, sqliteTable, index } from 'drizzle-orm/sqlite-core';
import { orders } from './order';

export const transactionStatus = [
    'succeeded',
    'pending',
    'failed'
] as const;

export type TransactionStatus = typeof transactionStatus[number];

export const paymentTransactions = sqliteTable('payment_transactions', {
    id: text('id').primaryKey(),
    orderId: text('order_id')
        .notNull()
        .references(() => orders.id),
    amount: integer('amount', { mode: 'number' }).notNull(),
    currency: text('currency').notNull().default('USD'),
    status: text('status', { enum: transactionStatus }).notNull(),
    paymentMethod: text('payment_method').notNull(),
    paymentIntentId: text('payment_intent_id'),
    errorMessage: text('error_message'),
    createdAt: text('created_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
    // Index for order lookups
    orderIdIndex: index('payment_transactions_order_id_idx').on(table.orderId),
    // Index for status-based lookups
    statusIndex: index('payment_transactions_status_idx').on(table.status),
    // Index for payment intent lookups
    paymentIntentIdIndex: index('payment_transactions_payment_intent_id_idx').on(table.paymentIntentId)
}));

// Export types
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type NewPaymentTransaction = typeof paymentTransactions.$inferInsert; 