DROP INDEX "user_id_unique";--> statement-breakpoint
DROP INDEX "user_email_unique";--> statement-breakpoint
DROP INDEX "user_stripe_customer_id_unique";--> statement-breakpoint
ALTER TABLE `user` ALTER COLUMN "firstname" TO "firstname" text(100) NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `user_id_unique` ON `user` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_stripe_customer_id_unique` ON `user` (`stripe_customer_id`);--> statement-breakpoint
ALTER TABLE `user` ALTER COLUMN "lastname" TO "lastname" text(100) NOT NULL;