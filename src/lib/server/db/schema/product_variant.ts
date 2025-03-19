import * as t from "drizzle-orm/sqlite-core";
import { product } from './product';

export const productVariant = t.sqliteTable('product_variant', {
    id: t.text('id').primaryKey(),
    productId: t.text('product_id')
        .notNull()
        .references(() => product.id),
    sku: t.text('sku').notNull().unique(),
    name: t.text('name').notNull(),
    price: t.integer('price').notNull(), // Store price in cents
    stockQuantity: t.integer('stock_quantity').notNull(),
    attributes: t.text('attributes', { mode: 'json' }).$type<Record<string, string>>().default({})
}, (table) => [
    t.index('product_variant_product_id_idx').on(table.productId),
    t.index('product_variant_sku_idx').on(table.sku),
    t.index('product_variant_price_idx').on(table.price)
]);

// Export types
export type ProductVariant = typeof productVariant.$inferSelect; 