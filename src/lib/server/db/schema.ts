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
	username: t.text('username').notNull().unique(),
	passwordHash: t.text('password_hash').notNull(),
	email_verified: t.integer().notNull().default(0),
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

