import { dev } from '$app/environment';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { env } from '$env/dynamic/private';

// Import all schemas
import { user, type User, type NewUser } from './user';
import { session, type Session } from './session';
import { emailVerificationRequest, type EmailVerificationRequest } from './email-verification-request';
import { passwordResetSession, type PasswordResetSession } from './password-reset-session';
import { Providers, userStatus, orderStatus, type Provider } from './types';

import {
	product, type Product,
	productRelations
} from './product';

import {
	productVariant, type ProductVariant,
	productVariantRelations
} from './product_variant';

import {
	productImage, type ProductImage,
	productImageRelations
} from './product_image';

import {
	cart, cartStatus, type CartStatus, type Cart, type NewCart,
	cartToCartItemRelations, cartToUserRelations
} from './cart';

import {
	cartItem, type CartItem, type NewCartItem,
	cartItemToProductVariantRelations, cartItemToCartRelations
} from './cart_item';

import {
	discount, type Discount, type NewDiscount
} from './discount';

import {
	order, type OrderStatus, type Order, type NewOrder,
	orderRelations
} from './order';

import {
	orderItem, type OrderItem, type NewOrderItem,
	orderItemRelations
} from './order-item';

import {
	orderAddress, addressType, type AddressType, type OrderAddress, type NewOrderAddress,
	orderAddressRelations
} from './order-address';

import {
	orderStatusHistory, type OrderStatusHistory, type NewOrderStatusHistory
} from './order-status-history';

import {
	paymentTransaction, paymentStatus, type PaymentStatus, type PaymentTransaction, type NewPaymentTransaction
} from './payment-transaction';

import {
	refund, refundStatus, type RefundStatus, type Refund, type NewRefund
} from './refund';

import {
	inventoryTransaction, transactionType, type TransactionType, type InventoryTransaction, type NewInventoryTransaction
} from './inventory-transaction';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
if (!dev && !env.DATABASE_AUTH_TOKEN) throw new Error('DATABASE_AUTH_TOKEN is not set');

const client = createClient({ url: env.DATABASE_URL, authToken: env.DATABASE_AUTH_TOKEN });

// Define schema tables and relations
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
	inventoryTransaction,
	// Register relations
	cartToCartItemRelations,
	cartToUserRelations,
	cartItemToProductVariantRelations,
	cartItemToCartRelations,
	productRelations,
	productVariantRelations,
	productImageRelations,
	orderRelations,
	orderItemRelations,
	orderAddressRelations
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
