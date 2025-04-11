import * as t from "drizzle-orm/sqlite-core";
import { relations } from 'drizzle-orm';
import { user } from './user';

export const session = t.sqliteTable('session', {
    id: t.text('id').primaryKey(),
    userId: t.text('user_id')
        .notNull()
        .references(() => user.id),
    expiresAt: t.integer('expires_at', { mode: 'timestamp' }).notNull()
});

export const sessionRelations = relations(session, ({ one }) => ({
    user: one(user, {
        fields: [session.userId],
        references: [user.id],
    }),
}));

// Export types
export type Session = typeof session.$inferSelect; 