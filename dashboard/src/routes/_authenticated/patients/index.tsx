import PatientsListPage from "@/features/patients/components/PatientsListPage"
import { createFileRoute } from "@tanstack/react-router"

export type PatientScope = "date" | "all"

type PatientSearch = {
  scope?: PatientScope
  date?: string
  query?: string
  page?: number
  pageSize?: number
}

export const Route = createFileRoute("/_authenticated/patients/")({
  validateSearch: (search: Record<string, unknown>): PatientSearch => ({
    scope: search.scope === "all" ? "all" : undefined,
    date:
      typeof search.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(search.date)
        ? search.date
        : undefined,
    query:
      typeof search.query === "string" && search.query.trim()
        ? search.query.trim()
        : undefined,
    page:
      typeof search.page === "number" &&
      Number.isInteger(search.page) &&
      search.page >= 0
        ? search.page
        : undefined,
    pageSize:
      typeof search.pageSize === "number" &&
      [10, 20, 30, 40, 50].includes(search.pageSize)
        ? search.pageSize
        : undefined,
  }),
  component: PatientsListPage,
})
