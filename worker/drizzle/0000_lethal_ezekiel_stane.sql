CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`id_token` text,
	`password` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `appointments` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_pid` text NOT NULL,
	`booked_by` text NOT NULL,
	`scheduled_at` integer NOT NULL,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`patient_pid`) REFERENCES `patients`(`pid`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`booked_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `patients` (
	`pid` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`full_name` text NOT NULL,
	`mobile` text NOT NULL,
	`dob` text,
	`gender` text,
	`booked_by_staff_id` text,
	`is_first_login` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`booked_by_staff_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `pid_counter` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`value` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pre_consultation` (
	`id` text PRIMARY KEY NOT NULL,
	`appointment_id` text NOT NULL,
	`chief_complaint` text,
	`history` text,
	`diagnosis_draft` text,
	`form_type` text DEFAULT 'general',
	`form_data` text,
	`synced` integer DEFAULT true NOT NULL,
	`recorded_by` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recorded_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `prescriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`appointment_id` text NOT NULL,
	`doctor_name` text NOT NULL,
	`entered_by` text NOT NULL,
	`medicines` text DEFAULT '[]' NOT NULL,
	`tests` text DEFAULT '[]' NOT NULL,
	`notes` text,
	`finalized_at` integer,
	`whatsapp_sent` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`entered_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`phone_number` text,
	`phone_number_verified` integer DEFAULT false NOT NULL,
	`username` text,
	`role` text DEFAULT 'user' NOT NULL,
	`is_first_login` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `vitals` (
	`id` text PRIMARY KEY NOT NULL,
	`appointment_id` text NOT NULL,
	`bp_systolic` integer,
	`bp_diastolic` integer,
	`pulse` integer,
	`spo2` integer,
	`temperature` integer,
	`weight_kg` integer,
	`height_cm` integer,
	`recorded_by` text NOT NULL,
	`recorded_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recorded_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
