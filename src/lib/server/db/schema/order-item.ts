import { text, integer, sqliteTable, index } from 'drizzle-orm/sqlite-core';
import { orders } from './order';
import { product } from './product';
import { productVariant } from './product_variant';

export const orderItems = sqliteTable('order_items', {
    id: text('id').primaryKey(),
    orderId: text('order_id')
        .notNull()
        .references(() => orders.id),
    productId: text('product_id')
        .notNull()
        .references(() => product.id),
    variantId: text('variant_id')
        .references(() => productVariant.id),
    quantity: integer('quantity').notNull(),
    unitPrice: integer('unit_price', { mode: 'number' }).notNull(),
    totalPrice: integer('total_price', { mode: 'number' }).notNull()
}, (table) => ({
    // Index for order lookups
    orderIdIndex: index('order_items_order_id_idx').on(table.orderId),
    // Index for product lookups
    productIdIndex: index('order_items_product_id_idx').on(table.productId),
    // Index for variant lookups
    variantIdIndex: index('order_items_variant_id_idx').on(table.variantId)
}));

// Export types
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert; 