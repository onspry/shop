import { sql } from 'drizzle-orm';
import * as t from "drizzle-orm/sqlite-core";
import { relations } from 'drizzle-orm';
import { cart } from './cart';
import { order } from './order';
import { session } from './session';
import { emailVerificationRequest } from './email-verification-request';
import { passwordResetSession } from './password-reset-session';
import { type Provider, Providers, userStatus } from './types';

export const user = t.sqliteTable('user', {
    id: t.text('id').unique().notNull(),
    provider: t.text('provider', { enum: Object.values(Providers) as [Provider, ...Provider[]] }).notNull(),
    providerId: t.text('provider_id').notNull(),
    email: t.text('email', { length: 100 }).notNull().unique(),
    image: t.text('image', { length: 255 }),
    firstname: t.text('firstname', { length: 100 }).notNull(),
    lastname: t.text('lastname', { length: 100 }).notNull(),
    passwordHash: t.text('password_hash'),
    status: t.text('status', { enum: userStatus }).notNull().default('active'),
    emailVerified: t.integer('email_verified', { mode: 'boolean' }).notNull().default(false),
    isAdmin: t.integer('is_admin', { mode: 'boolean' }).notNull().default(false),
    stripeCustomerId: t.text('stripe_customer_id', { length: 100 }),
    lastLoginAt: t.integer('last_login_at', { mode: 'timestamp' }),
    createdAt: t.integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedAt: t.integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`)
}, (table) => [
    t.primaryKey({ columns: [table.provider, table.providerId] }),
    t.index('user_email_idx').on(table.email),
    t.index('user_stripe_customer_id_idx').on(table.stripeCustomerId),
    t.index('user_status_idx').on(table.status)
]);

export const userRelations = relations(user, ({ many }) => ({
    sessions: many(session),
    emailVerificationRequests: many(emailVerificationRequest),
    passwordResetSessions: many(passwordResetSession),
    carts: many(cart),
    orders: many(order),
}));

// Export types
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert; 