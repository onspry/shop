import { sql } from 'drizzle-orm';
import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core';
import { product } from './product';
import { productVariant } from './product_variant';

export const inventoryTransactionType = ['order', 'restock', 'adjustment'] as const;
export type InventoryTransactionType = typeof inventoryTransactionType[number];

export const inventoryTransactions = sqliteTable('inventory_transactions', {
    id: text('id').primaryKey(),
    productId: text('product_id')
        .notNull()
        .references(() => product.id),
    variantId: text('variant_id')
        .references(() => productVariant.id),
    quantity: integer('quantity').notNull(), // negative for outgoing, positive for incoming
    type: text('type', { enum: inventoryTransactionType }).notNull(),
    referenceId: text('reference_id'), // order ID or other reference
    note: text('note'),
    createdAt: text('created_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`)
});

// Export types
export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;
export type NewInventoryTransaction = typeof inventoryTransactions.$inferInsert; 