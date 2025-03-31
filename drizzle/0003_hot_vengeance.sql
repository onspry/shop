PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_cart_item` (
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
INSERT INTO `__new_cart_item`("id", "cart_id", "product_variant_id", "quantity", "price", "created_at", "updated_at") SELECT "id", "cart_id", "product_variant_id", "quantity", "price", "created_at", "updated_at" FROM `cart_item`;--> statement-breakpoint
DROP TABLE `cart_item`;--> statement-breakpoint
ALTER TABLE `__new_cart_item` RENAME TO `cart_item`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `cart_item_cart_id_idx` ON `cart_item` (`cart_id`);--> statement-breakpoint
CREATE INDEX `cart_item_product_variant_id_idx` ON `cart_item` (`product_variant_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `cart_item_cart_id_product_variant_id_unique_idx` ON `cart_item` (`cart_id`,`product_variant_id`);