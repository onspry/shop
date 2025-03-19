import { dev } from '$app/environment';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { env } from '$env/dynamic/private';

// Import all schemas
import * as userSchema from './schema/user';
import * as productSchema from './schema/product';
import * as productVariantSchema from './schema/product_variant';
import * as productImageSchema from './schema/product_image';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
if (!dev && !env.DATABASE_AUTH_TOKEN) throw new Error('DATABASE_AUTH_TOKEN is not set');

const client = createClient({ url: env.DATABASE_URL, authToken: env.DATABASE_AUTH_TOKEN });

// Combine all schemas
const schema = {
	...userSchema,
	...productSchema,
	...productVariantSchema,
	...productImageSchema
};

export const db = drizzle(client, { schema });

// Re-export all schemas
export * from './schema/user';
export * from './schema/product';
export * from './schema/product_variant';
export * from './schema/product_image';
