import { createFileRoute } from "@tanstack/react-router"
import AppointmentsPage from "@/features/appointments/components/AppointmentsPage"
import {
  appointmentsQueryOptions,
  todayIST,
} from "@/features/appointments/appointment-queries"

type AppointmentSearch = {
  clinic?: "juran_chhapra" | "bhagwanpur"
  date?: string
  query?: string
  page?: number
  pageSize?: number
}

export const Route = createFileRoute("/_authenticated/appointments/")({
  validateSearch: (search: Record<string, unknown>): AppointmentSearch => ({
    clinic:
      search.clinic === "juran_chhapra" || search.clinic === "bhagwanpur"
        ? search.clinic
        : undefined,
    date:
      typeof search.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(search.date)
        ? search.date
        : undefined,
    query: typeof search.query === "string" ? search.query : undefined,
    page:
      typeof search.page === "number" &&
      Number.isInteger(search.page) &&
      search.page >= 0
        ? search.page
        : undefined,
    pageSize:
      typeof search.pageSize === "number" &&
      [10, 15, 20, 30, 40, 50].includes(search.pageSize)
        ? search.pageSize
        : undefined,
  }),
  loaderDeps: ({ search }) => ({
    clinic: search.clinic ?? "juran_chhapra",
    date: search.date ?? todayIST(),
  }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(
      appointmentsQueryOptions(deps.clinic, deps.date)
    ),
  component: AppointmentsPage,
})
