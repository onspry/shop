import { dev } from '$app/environment';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { env } from '$env/dynamic/private';

// Import all schemas
import {
	user, session, emailVerificationRequest, passwordResetSession,
	userStatus, Providers, type Provider, type User, type NewUser,
	type Session, type EmailVerificationRequest, type PasswordResetSession
} from './schema/user';

import {
	product, type Product
} from './schema/product';

import {
	productVariant, type ProductVariant
} from './schema/product_variant';

import {
	productImage, type ProductImage
} from './schema/product_image';

import {
	cart, cartStatus, type CartStatus, type Cart, type NewCart
} from './schema/cart';

import {
	cartItem, type CartItem, type NewCartItem
} from './schema/cart_item';

import {
	discount, type Discount, type NewDiscount
} from './schema/discount';

import {
	order, orderStatus, type OrderStatus, type Order, type NewOrder
} from './schema/order';

import {
	orderItem, type OrderItem, type NewOrderItem
} from './schema/order-item';

import {
	orderAddress, addressType, type AddressType, type OrderAddress, type NewOrderAddress
} from './schema/order-address';

import {
	orderStatusHistory, type OrderStatusHistory, type NewOrderStatusHistory
} from './schema/order-status-history';

import {
	paymentTransaction, paymentStatus, type PaymentStatus, type PaymentTransaction, type NewPaymentTransaction
} from './schema/payment-transaction';

import {
	refund, refundStatus, type RefundStatus, type Refund, type NewRefund
} from './schema/refund';

import {
	inventoryTransaction, transactionType, type TransactionType, type InventoryTransaction, type NewInventoryTransaction
} from './schema/inventory-transaction';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
if (!dev && !env.DATABASE_AUTH_TOKEN) throw new Error('DATABASE_AUTH_TOKEN is not set');

const client = createClient({ url: env.DATABASE_URL, authToken: env.DATABASE_AUTH_TOKEN });

// Define schema tables
const schema = {
	user,
	session,
	emailVerificationRequest,
	passwordResetSession,
	product,
	productVariant,
	productImage,
	cart,
	cartItem,
	discount,
	order,
	orderItem,
	orderAddress,
	orderStatusHistory,
	paymentTransaction,
	refund,
	inventoryTransaction
};

export const db = drizzle(client, { schema });

// Re-export all types and enums
export {
	userStatus, Providers,
	cartStatus,
	orderStatus,
	addressType,
	paymentStatus,
	refundStatus,
	transactionType
};

export type {
	Provider,
	User, NewUser,
	Session,
	EmailVerificationRequest,
	PasswordResetSession,
	Product,
	ProductVariant,
	ProductImage,
	CartStatus, Cart, NewCart,
	CartItem, NewCartItem,
	Discount, NewDiscount,
	OrderStatus, Order, NewOrder,
	OrderItem, NewOrderItem,
	AddressType, OrderAddress, NewOrderAddress,
	OrderStatusHistory, NewOrderStatusHistory,
	PaymentStatus, PaymentTransaction, NewPaymentTransaction,
	RefundStatus, Refund, NewRefund,
	TransactionType, InventoryTransaction, NewInventoryTransaction
};
