import * as t from "drizzle-orm/sqlite-core";
import { orders } from './order';

export const addressType = ['shipping', 'billing'] as const;
export type AddressType = typeof addressType[number];

export const orderAddresses = t.sqliteTable('order_addresses', {
    id: t.text('id').primaryKey(),
    orderId: t.text('order_id')
        .notNull()
        .references(() => orders.id),
    type: t.text('type', { enum: addressType }).notNull(),
    firstName: t.text('first_name').notNull(),
    lastName: t.text('last_name').notNull(),
    addressLine1: t.text('address_line1').notNull(),
    addressLine2: t.text('address_line2'),
    city: t.text('city').notNull(),
    state: t.text('state').notNull(),
    postalCode: t.text('postal_code').notNull(),
    country: t.text('country').notNull(),
    email: t.text('email').notNull(),
    phone: t.text('phone')
}, (table) => ({
    // Index for order lookups
    orderIdIndex: t.index('order_addresses_order_id_idx').on(table.orderId),
    // Index for email lookups (guest orders)
    emailIndex: t.index('order_addresses_email_idx').on(table.email),
    // Index for type-based lookups
    typeIndex: t.index('order_addresses_type_idx').on(table.type)
}));

// Export types
export type OrderAddress = typeof orderAddresses.$inferSelect;
export type NewOrderAddress = typeof orderAddresses.$inferInsert; 