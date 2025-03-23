import { sql } from 'drizzle-orm';
import * as t from "drizzle-orm/sqlite-core";
import { user } from './user';

export const cart = t.sqliteTable('cart', {
    id: t.text('id').primaryKey(),
    userId: t.text('user_id')
        .references(() => user.id),
    sessionId: t.text('session_id').notNull().unique(),
    discountCode: t.text('discount_code'),
    discountAmount: t.integer('discount_amount').default(0), // Store amount in cents
    createdAt: t.integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedAt: t.integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`)
}, (table) => [
    t.index('cart_user_id_idx').on(table.userId),
    t.index('cart_session_id_idx').on(table.sessionId)
]);

// Export types
export type Cart = typeof cart.$inferSelect;
export type NewCart = typeof cart.$inferInsert; 