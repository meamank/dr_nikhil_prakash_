import PatientDetail from "@/features/patients/components/PatientDetail"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/patients/$patientId")({
  component: PatientDetail,
})
