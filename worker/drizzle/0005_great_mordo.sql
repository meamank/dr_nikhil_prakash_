ALTER TABLE `patients` ADD `age_years` integer;--> statement-breakpoint
UPDATE `patients` SET `age_years` = NULL WHERE 1=1;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_patients` (
	`pid` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`full_name` text NOT NULL,
	`mobile` text NOT NULL,
	`age_years` integer,
	`gender` text,
	`booked_by_staff_id` text,
	`is_first_login` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`booked_by_staff_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_patients`("pid", "user_id", "full_name", "mobile", "age_years", "gender", "booked_by_staff_id", "is_first_login", "created_at") SELECT "pid", "user_id", "full_name", "mobile", "age_years", "gender", "booked_by_staff_id", "is_first_login", "created_at" FROM `patients`;--> statement-breakpoint
DROP TABLE `patients`;--> statement-breakpoint
ALTER TABLE `__new_patients` RENAME TO `patients`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
