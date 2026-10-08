CREATE INDEX `patients_created_at_idx` ON `patients` (`created_at`);
CREATE INDEX `appointments_clinic_scheduled_at_idx` ON `appointments` (`clinic`, `scheduled_at`);
CREATE INDEX `appointments_clinic_patient_pid_idx` ON `appointments` (`clinic`, `patient_pid`);
CREATE INDEX `appointments_clinic_payment_patient_pid_idx` ON `appointments` (`clinic`, `payment_patient_pid`);
