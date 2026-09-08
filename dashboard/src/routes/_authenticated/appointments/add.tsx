import { createFileRoute } from "@tanstack/react-router"
import AddAppointmentPage from "@/features/appointments/components/AddAppointmentPage"

export const Route = createFileRoute("/_authenticated/appointments/add")({
  component: AddAppointmentPage,
})
