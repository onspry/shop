import { sql } from 'drizzle-orm';
import * as t from "drizzle-orm/sqlite-core";
import { product } from './product';
import { cartItem } from './cart_item';
import { relations } from 'drizzle-orm';

export const productVariant = t.sqliteTable('product_variant', {
    id: t.text('id').primaryKey(),
    productId: t.text('product_id')
        .notNull()
        .references(() => product.id, { onDelete: 'cascade' }),
    sku: t.text('sku').notNull().unique(),
    name: t.text('name').notNull(),
    price: t.integer('price').notNull(), // Store price in cents
    stockQuantity: t.integer('stock_quantity').notNull().default(0),
    createdAt: t.integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedAt: t.integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    attributes: t.text('attributes', { mode: 'json' }).$type<Record<string, string>>().default({})
}, (table) => [
    t.index('product_variant_product_id_idx').on(table.productId),
    t.index('product_variant_sku_idx').on(table.sku),
    t.index('product_variant_price_idx').on(table.price)
]);

export const productVariantRelations = relations(productVariant, ({ one, many }) => ({
    product: one(product, {
        fields: [productVariant.productId],
        references: [product.id],
    }),
    cartItems: many(cartItem),
}));

// Export types
export type ProductVariant = typeof productVariant.$inferSelect;
export type NewProductVariant = typeof productVariant.$inferInsert; 