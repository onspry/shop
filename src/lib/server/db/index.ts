import { dev } from '$app/environment';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { env } from '$env/dynamic/private';

// Import all schemas
import * as userSchema from './schema/user';
import * as productSchema from './schema/product';
import * as productVariantSchema from './schema/product_variant';
import * as productImageSchema from './schema/product_image';
import * as cartSchema from './schema/cart';
import * as cartItemSchema from './schema/cart_item';
import * as discountSchema from './schema/discount';
import * as orderSchema from './schema/order';
import * as orderItemSchema from './schema/order-item';
import * as orderAddressSchema from './schema/order-address';
import * as orderStatusHistorySchema from './schema/order-status-history';
import * as paymentTransactionSchema from './schema/payment-transaction';
import * as refundSchema from './schema/refund';
import * as inventoryTransactionSchema from './schema/inventory-transaction';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
if (!dev && !env.DATABASE_AUTH_TOKEN) throw new Error('DATABASE_AUTH_TOKEN is not set');

const client = createClient({ url: env.DATABASE_URL, authToken: env.DATABASE_AUTH_TOKEN });

// Combine all schemas
const schema = {
	...userSchema,
	...productSchema,
	...productVariantSchema,
	...productImageSchema,
	...cartSchema,
	...cartItemSchema,
	...discountSchema,
	...orderSchema,
	...orderItemSchema,
	...orderAddressSchema,
	...orderStatusHistorySchema,
	...paymentTransactionSchema,
	...refundSchema,
	...inventoryTransactionSchema
};

export const db = drizzle(client, { schema });

// Re-export schema tables to ensure proper access and relation resolution
export * from './schema/user';
export * from './schema/product';
export * from './schema/product_variant';
export * from './schema/product_image';
export * from './schema/cart';
export * from './schema/cart_item';
export * from './schema/discount';
export * from './schema/order';
export * from './schema/order-item';
export * from './schema/order-address';
export * from './schema/order-status-history';
export * from './schema/payment-transaction';
export * from './schema/refund';
export * from './schema/inventory-transaction';
