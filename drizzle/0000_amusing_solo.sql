CREATE TABLE `cart_item` (
	`id` text PRIMARY KEY NOT NULL,
	`cart_id` text NOT NULL,
	`product_variant_id` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`price` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`cart_id`) REFERENCES `cart`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_variant_id`) REFERENCES `product_variant`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `cart_item_cart_id_idx` ON `cart_item` (`cart_id`);--> statement-breakpoint
CREATE INDEX `cart_item_product_variant_id_idx` ON `cart_item` (`product_variant_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `cart_item_cart_id_product_variant_id_unique_idx` ON `cart_item` (`cart_id`,`product_variant_id`);--> statement-breakpoint
CREATE TABLE `cart` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`session_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`guest_email` text,
	`guest_first_name` text,
	`guest_last_name` text,
	`discount_code` text,
	`discount_amount` integer DEFAULT 0,
	`last_activity_at` integer DEFAULT (unixepoch()) NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `cart_user_id_idx` ON `cart` (`user_id`);--> statement-breakpoint
CREATE INDEX `cart_session_id_idx` ON `cart` (`session_id`);--> statement-breakpoint
CREATE INDEX `cart_guest_email_idx` ON `cart` (`guest_email`);--> statement-breakpoint
CREATE INDEX `cart_status_idx` ON `cart` (`status`);--> statement-breakpoint
CREATE INDEX `cart_last_activity_at_idx` ON `cart` (`last_activity_at`);--> statement-breakpoint
CREATE TABLE `discount` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`description` text,
	`type` text NOT NULL,
	`value` integer NOT NULL,
	`min_spend` integer,
	`max_uses` integer,
	`used_count` integer DEFAULT 0 NOT NULL,
	`valid_from` integer DEFAULT (unixepoch()) NOT NULL,
	`valid_until` integer,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `discount_code_unique` ON `discount` (`code`);--> statement-breakpoint
CREATE INDEX `discount_code_idx` ON `discount` (`code`);--> statement-breakpoint
CREATE INDEX `discount_active_idx` ON `discount` (`active`);--> statement-breakpoint
CREATE TABLE `email_verification_request` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`code` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `password_reset_session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`code` text NOT NULL,
	`expires_at` integer NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`two_factor_verified` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text NOT NULL,
	`provider` text NOT NULL,
	`provider_id` text NOT NULL,
	`email` text(100) NOT NULL,
	`image` text(255),
	`firstname` text(100) NOT NULL,
	`lastname` text(100) NOT NULL,
	`password_hash` text,
	`status` text DEFAULT 'active' NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`is_admin` integer DEFAULT false NOT NULL,
	`stripe_customer_id` text(100),
	`last_login_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`provider`, `provider_id`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_id_unique` ON `user` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE INDEX `user_email_idx` ON `user` (`email`);--> statement-breakpoint
CREATE INDEX `user_stripe_customer_id_idx` ON `user` (`stripe_customer_id`);--> statement-breakpoint
CREATE INDEX `user_status_idx` ON `user` (`status`);--> statement-breakpoint
CREATE TABLE `product` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`category` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`features` text DEFAULT '[]',
	`specifications` text DEFAULT '{}',
	`is_accessory` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_slug_unique` ON `product` (`slug`);--> statement-breakpoint
CREATE INDEX `product_category_idx` ON `product` (`category`);--> statement-breakpoint
CREATE INDEX `product_slug_idx` ON `product` (`slug`);--> statement-breakpoint
CREATE INDEX `product_name_idx` ON `product` (`name`);--> statement-breakpoint
CREATE TABLE `product_variant` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`sku` text NOT NULL,
	`name` text NOT NULL,
	`price` integer NOT NULL,
	`stock_quantity` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`attributes` text DEFAULT '{}',
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_variant_sku_unique` ON `product_variant` (`sku`);--> statement-breakpoint
CREATE INDEX `product_variant_product_id_idx` ON `product_variant` (`product_id`);--> statement-breakpoint
CREATE INDEX `product_variant_sku_idx` ON `product_variant` (`sku`);--> statement-breakpoint
CREATE INDEX `product_variant_price_idx` ON `product_variant` (`price`);--> statement-breakpoint
CREATE TABLE `product_image` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`url` text NOT NULL,
	`alt` text NOT NULL,
	`position` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `product_image_product_id_idx` ON `product_image` (`product_id`);--> statement-breakpoint
CREATE INDEX `product_image_position_idx` ON `product_image` (`position`);--> statement-breakpoint
CREATE TABLE `order` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`cart_id` text NOT NULL,
	`status` text DEFAULT 'pending_payment' NOT NULL,
	`email` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`subtotal` integer NOT NULL,
	`discount_code` text,
	`discount_amount` integer DEFAULT 0,
	`total` integer NOT NULL,
	`stripe_payment_intent_id` text,
	`stripe_client_secret` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `order_user_id_idx` ON `order` (`user_id`);--> statement-breakpoint
CREATE INDEX `order_cart_id_idx` ON `order` (`cart_id`);--> statement-breakpoint
CREATE INDEX `order_email_idx` ON `order` (`email`);--> statement-breakpoint
CREATE INDEX `order_status_idx` ON `order` (`status`);--> statement-breakpoint
CREATE INDEX `order_stripe_payment_intent_id_idx` ON `order` (`stripe_payment_intent_id`);--> statement-breakpoint
CREATE TABLE `order_item` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product_variant_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`price` integer NOT NULL,
	`name` text NOT NULL,
	`variant_name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `order`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_variant_id`) REFERENCES `product_variant`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `order_item_order_id_idx` ON `order_item` (`order_id`);--> statement-breakpoint
CREATE INDEX `order_item_product_variant_id_idx` ON `order_item` (`product_variant_id`);--> statement-breakpoint
CREATE TABLE `order_address` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`type` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`company` text,
	`address1` text NOT NULL,
	`address2` text,
	`city` text NOT NULL,
	`state` text NOT NULL,
	`postal_code` text NOT NULL,
	`country` text NOT NULL,
	`phone` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `order`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `order_address_order_id_idx` ON `order_address` (`order_id`);--> statement-breakpoint
CREATE INDEX `order_address_type_idx` ON `order_address` (`type`);--> statement-breakpoint
CREATE TABLE `order_status_history` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`status` text NOT NULL,
	`note` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `order`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `order_status_history_order_id_idx` ON `order_status_history` (`order_id`);--> statement-breakpoint
CREATE INDEX `order_status_history_status_idx` ON `order_status_history` (`status`);--> statement-breakpoint
CREATE TABLE `payment_transaction` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`amount` integer NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`stripe_payment_intent_id` text NOT NULL,
	`stripe_payment_method_id` text,
	`error_message` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `order`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `payment_transaction_order_id_idx` ON `payment_transaction` (`order_id`);--> statement-breakpoint
CREATE INDEX `payment_transaction_status_idx` ON `payment_transaction` (`status`);--> statement-breakpoint
CREATE INDEX `payment_transaction_stripe_payment_intent_id_idx` ON `payment_transaction` (`stripe_payment_intent_id`);--> statement-breakpoint
CREATE TABLE `refund` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`amount` integer NOT NULL,
	`reason` text NOT NULL,
	`note` text,
	`stripe_refund_id` text,
	`error_message` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`transaction_id` text NOT NULL,
	`refund_id` text,
	FOREIGN KEY (`order_id`) REFERENCES `order`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`transaction_id`) REFERENCES `payment_transaction`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `refund_order_id_idx` ON `refund` (`order_id`);--> statement-breakpoint
CREATE INDEX `refund_status_idx` ON `refund` (`status`);--> statement-breakpoint
CREATE INDEX `refund_stripe_refund_id_idx` ON `refund` (`stripe_refund_id`);--> statement-breakpoint
CREATE INDEX `refund_transaction_id_idx` ON `refund` (`transaction_id`);--> statement-breakpoint
CREATE INDEX `refund_refund_id_idx` ON `refund` (`refund_id`);--> statement-breakpoint
CREATE TABLE `inventory_transaction` (
	`id` text PRIMARY KEY NOT NULL,
	`product_variant_id` text NOT NULL,
	`order_id` text,
	`type` text NOT NULL,
	`quantity` integer NOT NULL,
	`note` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`product_variant_id`) REFERENCES `product_variant`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`order_id`) REFERENCES `order`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `inventory_transaction_product_variant_id_idx` ON `inventory_transaction` (`product_variant_id`);--> statement-breakpoint
CREATE INDEX `inventory_transaction_order_id_idx` ON `inventory_transaction` (`order_id`);--> statement-breakpoint
CREATE INDEX `inventory_transaction_type_idx` ON `inventory_transaction` (`type`);