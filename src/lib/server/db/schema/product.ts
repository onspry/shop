import { sql } from 'drizzle-orm';
import * as t from "drizzle-orm/sqlite-core";
import { relations } from 'drizzle-orm';
import { productVariant } from './product_variant';
import { productImage } from './product_image';

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
}, (table) => [
    t.index('product_category_idx').on(table.category),
    t.index('product_slug_idx').on(table.slug),
    t.index('product_name_idx').on(table.name)
]);

export const productRelations = relations(product, ({ many }) => ({
    variants: many(productVariant),
    images: many(productImage),
}));

// Export types
export type Product = typeof product.$inferSelect; 