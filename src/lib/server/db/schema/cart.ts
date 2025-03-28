import { sql, relations } from 'drizzle-orm';
import * as t from "drizzle-orm/sqlite-core";
import { user } from './user';
import { cartItem } from './cart_item';
import { productVariant } from './product_variant';

export const cartStatus = ['active', 'merged', 'converted_to_order', 'abandoned'] as const;
export type CartStatus = typeof cartStatus[number];

export const cart = t.sqliteTable('cart', {
    id: t.text('id').primaryKey(),
    userId: t.text('user_id')
        .references(() => user.id),
    sessionId: t.text('session_id').notNull(),
    status: t.text('status', { enum: cartStatus }).notNull().default('active'),
    guestEmail: t.text('guest_email'),
    guestFirstName: t.text('guest_first_name'),
    guestLastName: t.text('guest_last_name'),
    discountCode: t.text('discount_code'),
    discountAmount: t.integer('discount_amount').default(0), // Store amount in cents
    lastActivityAt: t.integer('last_activity_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    createdAt: t.integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedAt: t.integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`)
}, (table) => [
    t.index('cart_user_id_idx').on(table.userId),
    t.index('cart_session_id_idx').on(table.sessionId),
    t.index('cart_guest_email_idx').on(table.guestEmail),
    t.index('cart_status_idx').on(table.status),
    t.index('cart_last_activity_at_idx').on(table.lastActivityAt)
]);

export const cartToCartItemRelations = relations(cart, ({ many }) => ({
    items: many(cartItem)
}));

export const cartToUserRelations = relations(cart, ({ one }) => ({
    user: one(user, {
        fields: [cart.userId],
        references: [user.id]
    })
}));

export const cartItemToProductVariantRelations = relations(cartItem, ({ one }) => ({
    variant: one(productVariant, {
        fields: [cartItem.productVariantId],
        references: [productVariant.id]
    })
}));

// Export types
export type Cart = typeof cart.$inferSelect;
export type NewCart = typeof cart.$inferInsert; 