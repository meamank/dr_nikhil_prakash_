import { createFileRoute } from "@tanstack/react-router"

import AppointmentsPage from "@/features/appointments/components/AppointmentsPage"

export const Route = createFileRoute("/_authenticated/appointments")({
  component: AppointmentsPage,
})
