import { sql, relations } from 'drizzle-orm';
import * as t from "drizzle-orm/sqlite-core";
import { cart } from './cart';
import { productVariant } from './product_variant';

export const cartItem = t.sqliteTable('cart_item', {
    id: t.text('id').primaryKey(),
    cartId: t.text('cart_id')
        .notNull()
        .references(() => cart.id, { onDelete: 'cascade' }),
    productVariantId: t.text('product_variant_id')
        .notNull()
        .references(() => productVariant.id),
    quantity: t.integer('quantity').notNull().default(1),
    price: t.integer('price').notNull(), // Store price in cents at time of adding to cart
    composites: t.text('composites', { mode: 'json' }).$type<Array<{
        variantId: string;
        name: string;
        quantity: number;
    }>>().default([]),
    createdAt: t.integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedAt: t.integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`)
}, (table) => [
    t.index('cart_item_cart_id_idx').on(table.cartId),
    t.index('cart_item_product_variant_id_idx').on(table.productVariantId)
]);

export const cartItemToProductVariantRelations = relations(cartItem, ({ one }) => ({
    variant: one(productVariant, {
        fields: [cartItem.productVariantId],
        references: [productVariant.id]
    })
}));

export const cartItemToCartRelations = relations(cartItem, ({ one }) => ({
    cart: one(cart, {
        fields: [cartItem.cartId],
        references: [cart.id]
    })
}));

// Export types
export type CartItem = typeof cartItem.$inferSelect;
export type NewCartItem = typeof cartItem.$inferInsert; 