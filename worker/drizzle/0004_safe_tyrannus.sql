PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_appointments` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_pid` text,
	`booked_mobile` text NOT NULL,
	`patient_name` text NOT NULL,
	`patient_mobile` text NOT NULL,
	`patient_address` text,
	`patient_gender` text,
	`patient_age_years` integer,
	`clinic` text DEFAULT 'juran_chhapra' NOT NULL,
	`queue_number` integer DEFAULT 0 NOT NULL,
	`booked_by` text,
	`scheduled_at` integer NOT NULL,
	`status` text DEFAULT 'not_paid' NOT NULL,
	`payment_status` text DEFAULT 'unpaid' NOT NULL,
	`payment_mode` text,
	`checked_in_by` text,
	`checked_in_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`patient_pid`) REFERENCES `patients`(`pid`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`booked_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`checked_in_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_appointments`("id", "patient_pid", "booked_mobile", "patient_name", "patient_mobile", "patient_address", "patient_gender", "patient_age_years", "clinic", "queue_number", "booked_by", "scheduled_at", "status", "payment_status", "payment_mode", "checked_in_by", "checked_in_at", "created_at") SELECT "id", "patient_pid", "booked_mobile", "patient_name", "patient_mobile", "patient_address", "patient_gender", "patient_age_years", "clinic", "queue_number", "booked_by", "scheduled_at", "status", "payment_status", "payment_mode", "checked_in_by", "checked_in_at", "created_at" FROM `appointments`;--> statement-breakpoint
DROP TABLE `appointments`;--> statement-breakpoint
ALTER TABLE `__new_appointments` RENAME TO `appointments`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
UPDATE `appointments` SET `status` = 'not_paid' WHERE `status` IN ('requested', 'confirmed');