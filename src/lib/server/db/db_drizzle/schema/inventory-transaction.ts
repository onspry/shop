import { sql } from 'drizzle-orm';
import * as t from "drizzle-orm/sqlite-core";
import { productVariant } from './product_variant';
import { order } from './order';

export const transactionType = ['order', 'manual_adjustment', 'return'] as const;
export type TransactionType = typeof transactionType[number];

export const inventoryTransaction = t.sqliteTable('inventory_transaction', {
    id: t.text('id').primaryKey(),
    productVariantId: t.text('product_variant_id')
        .notNull()
        .references(() => productVariant.id),
    orderId: t.text('order_id')
        .references(() => order.id),
    type: t.text('type', { enum: transactionType }).notNull(),
    quantity: t.integer('quantity').notNull(), // Negative for outgoing, positive for incoming
    note: t.text('note'),
    createdAt: t.integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`)
}, (table) => [
    t.index('inventory_transaction_product_variant_id_idx').on(table.productVariantId),
    t.index('inventory_transaction_order_id_idx').on(table.orderId),
    t.index('inventory_transaction_type_idx').on(table.type)
]);

// Export types
export type InventoryTransaction = typeof inventoryTransaction.$inferSelect;
export type NewInventoryTransaction = typeof inventoryTransaction.$inferInsert; 