import * as t from "drizzle-orm/sqlite-core";
import { relations } from 'drizzle-orm';
import { product } from './product';

export const productImage = t.sqliteTable('product_image', {
    id: t.text('id').primaryKey(),
    productId: t.text('product_id')
        .notNull()
        .references(() => product.id),
    url: t.text('url').notNull(),
    alt: t.text('alt').notNull(),
    position: t.integer('position').notNull()
}, (table) => [
    t.index('product_image_product_id_idx').on(table.productId),
    t.index('product_image_position_idx').on(table.position)
]);

export const productImageRelations = relations(productImage, ({ one }) => ({
    product: one(product, {
        fields: [productImage.productId],
        references: [product.id],
    }),
}));

// Export types
export type ProductImage = typeof productImage.$inferSelect; 