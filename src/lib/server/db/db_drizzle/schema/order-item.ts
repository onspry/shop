import { sql } from 'drizzle-orm';
import * as t from "drizzle-orm/sqlite-core";
import { order } from './order';
import { productVariant } from './product_variant';
import { relations } from 'drizzle-orm';

export const orderItem = t.sqliteTable('order_item', {
    id: t.text('id').primaryKey(),
    orderId: t.text('order_id')
        .notNull()
        .references(() => order.id, { onDelete: 'cascade' }),
    productVariantId: t.text('product_variant_id')
        .notNull()
        .references(() => productVariant.id),
    quantity: t.integer('quantity').notNull(),
    price: t.integer('price').notNull(), // Store price in cents at time of order
    name: t.text('name').notNull(), // Store product name at time of order
    variantName: t.text('variant_name').notNull(), // Store variant name at time of order
    createdAt: t.integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedAt: t.integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`)
}, (table) => [
    t.index('order_item_order_id_idx').on(table.orderId),
    t.index('order_item_product_variant_id_idx').on(table.productVariantId)
]);

export const orderItemRelations = relations(orderItem, ({ one }) => ({
    order: one(order, {
        fields: [orderItem.orderId],
        references: [order.id]
    }),
    productVariant: one(productVariant, {
        fields: [orderItem.productVariantId],
        references: [productVariant.id]
    })
}));

// Export types
export type OrderItem = typeof orderItem.$inferSelect;
export type NewOrderItem = typeof orderItem.$inferInsert; 