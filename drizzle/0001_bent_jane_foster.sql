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
	`discount_code` text,
	`discount_amount` integer DEFAULT 0,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cart_session_id_unique` ON `cart` (`session_id`);--> statement-breakpoint
CREATE INDEX `cart_user_id_idx` ON `cart` (`user_id`);--> statement-breakpoint
CREATE INDEX `cart_session_id_idx` ON `cart` (`session_id`);--> statement-breakpoint
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
CREATE INDEX `product_category_idx` ON `product` (`category`);--> statement-breakpoint
CREATE INDEX `product_slug_idx` ON `product` (`slug`);--> statement-breakpoint
CREATE INDEX `product_name_idx` ON `product` (`name`);--> statement-breakpoint
CREATE INDEX `product_image_product_id_idx` ON `product_image` (`product_id`);--> statement-breakpoint
CREATE INDEX `product_image_position_idx` ON `product_image` (`position`);--> statement-breakpoint
CREATE INDEX `product_variant_product_id_idx` ON `product_variant` (`product_id`);--> statement-breakpoint
CREATE INDEX `product_variant_sku_idx` ON `product_variant` (`sku`);--> statement-breakpoint
CREATE INDEX `product_variant_price_idx` ON `product_variant` (`price`);