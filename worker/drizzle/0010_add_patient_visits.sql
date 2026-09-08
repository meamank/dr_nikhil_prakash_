CREATE TABLE `patient_visits` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_pid` text NOT NULL,
	`visit_date` text NOT NULL,
	`details` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`patient_pid`) REFERENCES `patients`(`pid`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `patient_visits_patient_date_idx` ON `patient_visits` (`patient_pid`,`visit_date`);
