import { text, sqliteTable, index } from 'drizzle-orm/sqlite-core';
import { orders } from './order';

export const addressType = ['shipping', 'billing'] as const;
export type AddressType = typeof addressType[number];

export const orderAddresses = sqliteTable('order_addresses', {
    id: text('id').primaryKey(),
    orderId: text('order_id')
        .notNull()
        .references(() => orders.id),
    type: text('type', { enum: addressType }).notNull(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    addressLine1: text('address_line1').notNull(),
    addressLine2: text('address_line2'),
    city: text('city').notNull(),
    state: text('state').notNull(),
    postalCode: text('postal_code').notNull(),
    country: text('country').notNull(),
    email: text('email').notNull(),
    phone: text('phone')
}, (table) => ({
    // Index for order lookups
    orderIdIndex: index('order_addresses_order_id_idx').on(table.orderId),
    // Index for email lookups (guest orders)
    emailIndex: index('order_addresses_email_idx').on(table.email),
    // Index for type-based lookups
    typeIndex: index('order_addresses_type_idx').on(table.type)
}));

// Export types
export type OrderAddress = typeof orderAddresses.$inferSelect;
export type NewOrderAddress = typeof orderAddresses.$inferInsert; 