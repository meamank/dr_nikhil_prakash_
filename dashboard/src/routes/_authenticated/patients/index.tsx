import PatientsListPage from "@/features/patients/components/PatientsListPage"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/patients/")({
  component: PatientsListPage,
})
