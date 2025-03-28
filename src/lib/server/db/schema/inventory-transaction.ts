import { sql } from 'drizzle-orm';
import * as t from "drizzle-orm/sqlite-core";
import { product } from './product';
import { productVariant } from './product_variant';

export const inventoryTransactionType = ['order', 'restock', 'adjustment'] as const;
export type InventoryTransactionType = typeof inventoryTransactionType[number];

export const inventoryTransactions = t.sqliteTable('inventory_transactions', {
    id: t.text('id').primaryKey(),
    productId: t.text('product_id')
        .notNull()
        .references(() => product.id),
    variantId: t.text('variant_id')
        .references(() => productVariant.id),
    quantity: t.integer('quantity').notNull(), // negative for outgoing, positive for incoming
    type: t.text('type', { enum: inventoryTransactionType }).notNull(),
    referenceId: t.text('reference_id'), // order ID or other reference
    note: t.text('note'),
    createdAt: t.integer('created_at', { mode: 'timestamp' })
        .notNull()
        .default(sql`(unixepoch())`)
}, (table) => ({
    productIdIndex: t.index('inventory_transactions_product_id_idx').on(table.productId),
    variantIdIndex: t.index('inventory_transactions_variant_id_idx').on(table.variantId),
    typeIndex: t.index('inventory_transactions_type_idx').on(table.type),
    createdAtIndex: t.index('inventory_transactions_created_at_idx').on(table.createdAt)
}));

// Export types
export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;
export type NewInventoryTransaction = typeof inventoryTransactions.$inferInsert; 