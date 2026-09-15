import { createFileRoute } from "@tanstack/react-router"
import Dashboard from "@/features/dashboard/components/Dashboard"

export type DashboardRange = "total" | "7d" | "30d" | "90d" | "custom"

type DashboardSearch = {
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
      range,
      from,
      to: from && to && to >= from ? to : undefined,
    }
  },
  component: Dashboard,
})
