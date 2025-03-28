import { sql } from 'drizzle-orm';
import * as t from "drizzle-orm/sqlite-core";
import { orders } from './order';
import { product } from './product';
import { productVariant } from './product_variant';

export const orderItems = t.sqliteTable('order_items', {
    id: t.text('id').primaryKey(),
    orderId: t.text('order_id')
        .notNull()
        .references(() => orders.id),
    productId: t.text('product_id')
        .notNull()
        .references(() => product.id),
    variantId: t.text('variant_id')
        .references(() => productVariant.id),
    quantity: t.integer('quantity').notNull(),
    unitPrice: t.integer('unit_price', { mode: 'number' }).notNull(),
    totalPrice: t.integer('total_price', { mode: 'number' }).notNull(),
    createdAt: t.integer('created_at', { mode: 'timestamp' })
        .notNull()
        .default(sql`(unixepoch())`),
    updatedAt: t.integer('updated_at', { mode: 'timestamp' })
        .notNull()
        .default(sql`(unixepoch())`)
}, (table) => ({
    // Index for order lookups
    orderIdIndex: t.index('order_items_order_id_idx').on(table.orderId),
    // Index for product lookups
    productIdIndex: t.index('order_items_product_id_idx').on(table.productId),
    // Index for variant lookups
    variantIdIndex: t.index('order_items_variant_id_idx').on(table.variantId)
}));

// Export types
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert; 