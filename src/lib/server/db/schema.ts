import { sql } from 'drizzle-orm';
import * as t from "drizzle-orm/sqlite-core";

export const Providers = {
	email: 'email',
	microsoft: 'microsoft',
	google: 'google',
	github: 'github',
	facebook: 'facebook'
} as const;

export type Provider = typeof Providers[keyof typeof Providers];

export const user = t.sqliteTable('user', {
	id: t.text('id').unique().notNull(),
	provider: t.text('provider', { enum: Object.values(Providers) as [Provider, ...Provider[]] }).notNull(),
	providerId: t.text('provider_id').notNull(),
	email: t.text('email', { length: 100 }).notNull().unique(),
	image: t.text('image', { length: 255 }),
	firstname: t.text('firstname', { length: 100 }).notNull(),
	lastname: t.text('lastname', { length: 100 }).notNull(),
	passwordHash: t.text('password_hash').notNull(),
	email_verified: t.integer({ mode: 'boolean' }).notNull().default(false),
	isAdmin: t.integer({ mode: 'boolean' }).notNull().default(false),
	stripeCustomerId: t.text('stripe_customer_id', { length: 100 }).notNull().unique(),
}, (table) => [
	t.primaryKey({ columns: [table.provider, table.providerId] })
]);

export const session = t.sqliteTable('session', {
	id: t.text('id').primaryKey(),
	userId: t.text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: t.integer('expires_at', { mode: 'timestamp' }).notNull()
});

export type Session = typeof session.$inferSelect;

export type User = typeof user.$inferSelect;

export const emailVerificationRequest = t.sqliteTable('email_verification_request', {
	id: t.text('id').notNull().primaryKey(),
	userId: t.text('user_id').notNull().references(() => user.id),
	email: t.text('email').notNull(),
	code: t.text('code').notNull(),
	expiresAt: t.integer('expires_at', { mode: 'timestamp' }).notNull()
});

export const passwordResetSession = t.sqliteTable('password_reset_session', {
	id: t.text('id').primaryKey(),
	userId: t.text('user_id').notNull().references(() => user.id),
	email: t.text('email').notNull(),
	code: t.text('code').notNull(),
	expiresAt: t.integer('expires_at', { mode: 'timestamp' }).notNull(),
	email_verified: t.integer('email_verified', { mode: 'boolean' }).notNull().default(false),
	twoFactorVerified: t.integer('two_factor_verified', { mode: 'boolean' }).notNull().default(false)
});

// Product-related schemas
export const product = t.sqliteTable('product', {
	id: t.text('id').primaryKey(),
	slug: t.text('slug').notNull().unique(),
	category: t.text('category').notNull(),
	name: t.text('name').notNull(),
	description: t.text('description').notNull(),
	features: t.text('features', { mode: 'json' }).$type<string[]>().default([]),
	specifications: t.text('specifications', { mode: 'json' }).$type<Record<string, string>>().default({}),
	isAccessory: t.integer('is_accessory', { mode: 'boolean' }).notNull().default(false),
	createdAt: t.integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
	updatedAt: t.integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`)
});

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
});

export const productImage = t.sqliteTable('product_image', {
	id: t.text('id').primaryKey(),
	productId: t.text('product_id')
		.notNull()
		.references(() => product.id),
	url: t.text('url').notNull(),
	alt: t.text('alt').notNull(),
	position: t.integer('position').notNull()
});

// Export types
export type Product = typeof product.$inferSelect;
export type ProductVariant = typeof productVariant.$inferSelect;
export type ProductImage = typeof productImage.$inferSelect;