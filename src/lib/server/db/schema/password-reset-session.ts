import * as t from "drizzle-orm/sqlite-core";
import { relations } from 'drizzle-orm';
import { user } from './user';

export const passwordResetSession = t.sqliteTable('password_reset_session', {
    id: t.text('id').primaryKey(),
    userId: t.text('user_id').notNull().references(() => user.id),
    email: t.text('email').notNull(),
    code: t.text('code').notNull(),
    expiresAt: t.integer('expires_at', { mode: 'timestamp' }).notNull(),
    email_verified: t.integer('email_verified', { mode: 'boolean' }).notNull().default(false),
    twoFactorVerified: t.integer('two_factor_verified', { mode: 'boolean' }).notNull().default(false)
});

export const passwordResetSessionRelations = relations(passwordResetSession, ({ one }) => ({
    user: one(user, {
        fields: [passwordResetSession.userId],
        references: [user.id],
    }),
}));

// Export types
export type PasswordResetSession = typeof passwordResetSession.$inferSelect; 