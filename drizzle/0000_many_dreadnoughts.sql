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
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`isAdmin` integer DEFAULT false NOT NULL,
	`stripe_customer_id` text(100) NOT NULL,
	PRIMARY KEY(`provider`, `provider_id`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_id_unique` ON `user` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_stripe_customer_id_unique` ON `user` (`stripe_customer_id`);