import { sql } from 'drizzle-orm';
import * as t from "drizzle-orm/sqlite-core";

export const discount = t.sqliteTable('discount', {
    id: t.text('id').primaryKey(),
    code: t.text('code').notNull().unique(),
    description: t.text('description'),
    type: t.text('type', { enum: ['percentage', 'fixed', 'shipping'] }).notNull(),
    value: t.integer('value').notNull(), // For percentage: 10 = 10%, for fixed: amount in cents
    minSpend: t.integer('min_spend'), // Minimum cart value in cents
    maxUses: t.integer('max_uses'), // Maximum number of uses
    usedCount: t.integer('used_count').notNull().default(0),
    validFrom: t.integer('valid_from', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    validUntil: t.integer('valid_until', { mode: 'timestamp' }),
    active: t.integer('active', { mode: 'boolean' }).notNull().default(true),
    createdAt: t.integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedAt: t.integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`)
}, (table) => [
    t.index('discount_code_idx').on(table.code),
    t.index('discount_active_idx').on(table.active)
]);

// Export types
export type Discount = typeof discount.$inferSelect;
export type NewDiscount = typeof discount.$inferInsert; 