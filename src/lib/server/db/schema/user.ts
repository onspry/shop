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
}, (table) => ({
    emailIdx: t.index('user_email_idx').on(table.email),
    providerIdIdx: t.index('user_provider_id_idx').on(table.providerId),
    primaryKey: t.primaryKey({ columns: [table.provider, table.providerId] })
}));

export const session = t.sqliteTable('session', {
    id: t.text('id').primaryKey(),
    userId: t.text('user_id')
        .notNull()
        .references(() => user.id),
    expiresAt: t.integer('expires_at', { mode: 'timestamp' }).notNull()
});

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

// Export types
export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;
export type EmailVerificationRequest = typeof emailVerificationRequest.$inferSelect;
export type PasswordResetSession = typeof passwordResetSession.$inferSelect; 