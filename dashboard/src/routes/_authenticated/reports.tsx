import { createFileRoute } from "@tanstack/react-router"

import ReportsPage from "@/features/reports/components/ReportsPage"

export type ReportPeriod = "1d" | "7d" | "30d" | "90d" | "180d" | "custom"

type ReportsSearch = {
  period?: ReportPeriod
  from?: string
  to?: string
  clinic?: "all" | "juran_chhapra" | "bhagwanpur"
}

const validDate = (value: unknown): value is string =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)

export const Route = createFileRoute("/_authenticated/reports")({
  validateSearch: (search: Record<string, unknown>): ReportsSearch => ({
    period: ["1d", "7d", "30d", "90d", "180d", "custom"].includes(
      typeof search.period === "string" ? search.period : ""
    )
      ? (search.period as ReportPeriod)
      : undefined,
    from: validDate(search.from) ? search.from : undefined,
    to: validDate(search.to) ? search.to : undefined,
    clinic:
      search.clinic === "juran_chhapra" ||
      search.clinic === "bhagwanpur" ||
      search.clinic === "all"
        ? search.clinic
        : undefined,
  }),
  component: ReportsPage,
})
