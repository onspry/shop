import * as t from "drizzle-orm/sqlite-core";
import { relations } from 'drizzle-orm';
import { user } from './user';

export const emailVerificationRequest = t.sqliteTable('email_verification_request', {
    id: t.text('id').notNull().primaryKey(),
    userId: t.text('user_id').notNull().references(() => user.id),
    email: t.text('email').notNull(),
    code: t.text('code').notNull(),
    expiresAt: t.integer('expires_at', { mode: 'timestamp' }).notNull()
});

export const emailVerificationRequestRelations = relations(emailVerificationRequest, ({ one }) => ({
    user: one(user, {
        fields: [emailVerificationRequest.userId],
        references: [user.id],
    }),
}));

// Export types
export type EmailVerificationRequest = typeof emailVerificationRequest.$inferSelect; 