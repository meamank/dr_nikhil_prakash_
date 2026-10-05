import { createFileRoute } from "@tanstack/react-router"
import Dashboard from "@/features/dashboard/components/Dashboard"
import type { Clinic } from "@/features/appointments/appointment-queries"

export type DashboardRange = "total" | "7d" | "30d" | "90d" | "custom"
export type DashboardClinic = Clinic | "all"

type DashboardSearch = {
  clinic?: DashboardClinic
  range?: DashboardRange
  from?: string
  to?: string
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

export const Route = createFileRoute("/_authenticated/")({
  validateSearch: (search: Record<string, unknown>): DashboardSearch => {
    const range = ["total", "7d", "30d", "90d", "custom"].includes(
      typeof search.range === "string" ? search.range : ""
    )
      ? (search.range as DashboardRange)
      : undefined
    const from = validDate(search.from) ? search.from : undefined
    const to = validDate(search.to) ? search.to : undefined
    return {
      clinic:
        search.clinic === "bhagwanpur" ||
        search.clinic === "juran_chhapra" ||
        search.clinic === "all"
          ? search.clinic
          : undefined,
      range,
      from,
      to: from && to && to >= from ? to : undefined,
    }
  },
  component: Dashboard,
})
