PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_email_verification_request` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`code` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_email_verification_request`("id", "user_id", "email", "code", "expires_at") SELECT "id", "user_id", "email", "code", "expires_at" FROM `email_verification_request`;--> statement-breakpoint
DROP TABLE `email_verification_request`;--> statement-breakpoint
ALTER TABLE `__new_email_verification_request` RENAME TO `email_verification_request`;--> statement-breakpoint
PRAGMA foreign_keys=ON;