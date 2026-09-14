import { createFileRoute } from "@tanstack/react-router"
import AppointmentsPage from "@/features/appointments/components/AppointmentsPage"

function todayIST(): string {
  const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000)
  return ist.toISOString().slice(0, 10)
}

export const Route = createFileRoute("/_authenticated/appointments/")({
  validateSearch: (search: Record<string, unknown>) => ({
    clinic: search.clinic === "bhagwanpur" ? "bhagwanpur" : "juran_chhapra",
    date:
      typeof search.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(search.date)
        ? search.date
        : todayIST(),
    query: typeof search.query === "string" ? search.query : "",
    page:
      typeof search.page === "number" &&
      Number.isInteger(search.page) &&
      search.page >= 0
        ? search.page
        : 0,
    pageSize:
      typeof search.pageSize === "number" &&
      [10, 15, 20, 30, 40, 50].includes(search.pageSize)
        ? search.pageSize
        : 10,
  }),
  component: AppointmentsPage,
})
