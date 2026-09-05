CREATE TABLE `booking_otps` (
	`id` text PRIMARY KEY NOT NULL,
	`mobile` text NOT NULL,
	`code_hash` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`verified` integer DEFAULT false NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `booking_otps_mobile_idx` ON `booking_otps` (`mobile`);--> statement-breakpoint
CREATE TABLE `whatsapp_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`to_mobile` text NOT NULL,
	`template` text NOT NULL,
	`appointment_id` text,
	`provider_id` text,
	`status` text DEFAULT 'queued' NOT NULL,
	`error` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_appointments` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_pid` text,
	`booked_mobile` text NOT NULL,
	`patient_name` text NOT NULL,
	`patient_mobile` text NOT NULL,
	`patient_gender` text,
	`patient_age_years` integer,
	`clinic` text DEFAULT 'juran_chhapra' NOT NULL,
	`booked_by` text,
	`scheduled_at` integer NOT NULL,
	`status` text DEFAULT 'requested' NOT NULL,
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
INSERT INTO `__new_appointments`("id", "patient_pid", "booked_mobile", "patient_name", "patient_mobile", "patient_gender", "patient_age_years", "clinic", "booked_by", "scheduled_at", "status", "payment_status", "payment_mode", "checked_in_by", "checked_in_at", "created_at") SELECT "id", "patient_pid", "booked_mobile", "patient_name", "patient_mobile", "patient_gender", "patient_age_years", "clinic", "booked_by", "scheduled_at", "status", "payment_status", "payment_mode", "checked_in_by", "checked_in_at", "created_at" FROM `appointments`;--> statement-breakpoint
DROP TABLE `appointments`;--> statement-breakpoint
ALTER TABLE `__new_appointments` RENAME TO `appointments`;--> statement-breakpoint
PRAGMA foreign_keys=ON;