import { createFileRoute } from "@tanstack/react-router"
import AddAppointmentPage from "@/features/appointments/components/AddAppointmentPage"
import type { Clinic } from "@/features/appointments/appointment-queries"

type AddAppointmentSearch = {
  clinic?: Clinic
  date?: string
}

export const Route = createFileRoute("/_authenticated/appointments/add")({
  validateSearch: (search: Record<string, unknown>): AddAppointmentSearch => ({
    clinic:
      search.clinic === "juran_chhapra" || search.clinic === "bhagwanpur"
        ? search.clinic
        : undefined,
    date:
      typeof search.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(search.date)
        ? search.date
        : undefined,
  }),
  component: AddAppointmentPage,
})
