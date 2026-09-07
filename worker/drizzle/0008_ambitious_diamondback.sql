CREATE TABLE `clinical_options` (
	`category` text NOT NULL,
	`normalized_label` text NOT NULL,
	`label` text NOT NULL,
	PRIMARY KEY(`category`, `normalized_label`)
);
