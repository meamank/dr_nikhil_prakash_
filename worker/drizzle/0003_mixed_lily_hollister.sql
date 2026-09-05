ALTER TABLE `appointments` ADD `patient_address` text;--> statement-breakpoint
ALTER TABLE `appointments` ADD `queue_number` integer DEFAULT 0 NOT NULL;