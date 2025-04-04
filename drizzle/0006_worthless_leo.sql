ALTER TABLE `cart` RENAME COLUMN "guest_email" TO "email";--> statement-breakpoint
ALTER TABLE `cart` RENAME COLUMN "guest_first_name" TO "first_name";--> statement-breakpoint
ALTER TABLE `cart` RENAME COLUMN "guest_last_name" TO "last_name";--> statement-breakpoint
DROP INDEX `cart_guest_email_idx`;--> statement-breakpoint
CREATE INDEX `cart_email_idx` ON `cart` (`email`);