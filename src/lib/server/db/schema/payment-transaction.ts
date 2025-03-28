import { sql } from 'drizzle-orm';
import * as t from "drizzle-orm/sqlite-core";
import { order } from './order';

export const paymentStatus = ['pending', 'succeeded', 'failed', 'refunded'] as const;
export type PaymentStatus = typeof paymentStatus[number];

export const paymentTransaction = t.sqliteTable('payment_transaction', {
    id: t.text('id').primaryKey(),
    orderId: t.text('order_id')
        .notNull()
        .references(() => order.id),
    status: t.text('status', { enum: paymentStatus }).notNull().default('pending'),
    amount: t.integer('amount').notNull(), // Store amount in cents
    currency: t.text('currency').notNull().default('USD'),
    stripePaymentIntentId: t.text('stripe_payment_intent_id').notNull(),
    stripePaymentMethodId: t.text('stripe_payment_method_id'),
    errorMessage: t.text('error_message'),
    createdAt: t.integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedAt: t.integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`)
}, (table) => [
    t.index('payment_transaction_order_id_idx').on(table.orderId),
    t.index('payment_transaction_status_idx').on(table.status),
    t.index('payment_transaction_stripe_payment_intent_id_idx').on(table.stripePaymentIntentId)
]);

// Export types
export type PaymentTransaction = typeof paymentTransaction.$inferSelect;
export type NewPaymentTransaction = typeof paymentTransaction.$inferInsert; 