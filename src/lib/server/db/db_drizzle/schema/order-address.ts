import { sql } from 'drizzle-orm';
import * as t from "drizzle-orm/sqlite-core";
import { order } from './order';
import { relations } from 'drizzle-orm';

export const addressType = ['shipping', 'billing'] as const;
export type AddressType = typeof addressType[number];

export const orderAddress = t.sqliteTable('order_address', {
    id: t.text('id').primaryKey(),
    orderId: t.text('order_id')
        .notNull()
        .references(() => order.id, { onDelete: 'cascade' }),
    type: t.text('type', { enum: addressType }).notNull(),
    firstName: t.text('first_name').notNull(),
    lastName: t.text('last_name').notNull(),
    company: t.text('company'),
    address1: t.text('address1').notNull(),
    address2: t.text('address2'),
    city: t.text('city').notNull(),
    state: t.text('state').notNull(),
    postalCode: t.text('postal_code').notNull(),
    country: t.text('country').notNull(),
    phone: t.text('phone'),
    createdAt: t.integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedAt: t.integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`)
}, (table) => [
    t.index('order_address_order_id_idx').on(table.orderId),
    t.index('order_address_type_idx').on(table.type)
]);

export const orderAddressRelations = relations(orderAddress, ({ one }) => ({
    order: one(order, {
        fields: [orderAddress.orderId],
        references: [order.id]
    })
}));

// Export types
export type OrderAddress = typeof orderAddress.$inferSelect;
export type NewOrderAddress = typeof orderAddress.$inferInsert; 