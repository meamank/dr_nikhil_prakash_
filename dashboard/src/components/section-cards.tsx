"use client"

import { keepPreviousData, useIsFetching, useQuery, useQueryClient } from "@tanstack/react-query"
import { format, subDays } from "date-fns"
import type { DateRange } from "react-day-picker"

import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { apiGet } from "@/lib/api"
import {
  Route as DashboardRoute,
  type DashboardClinic,
  type DashboardRange,
} from "@/routes/_authenticated/index"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  CalendarDaysIcon,
  ChevronDownIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  RefreshCwIcon,
} from "lucide-react"

type DashboardSummary = {
  totalAppointments: number
  paidAppointments: number
  focAppointments: number
  refundedAppointments: number
  appointmentFee: number
  totalRevenue: number
  totalPatients: number
  genderDistribution: {
    male: number
    female: number
  }
  patientTrend: {
    currentPatients: number
    previousPatients: number
  }
  trend: {
    currentRevenue: number
    previousRevenue: number
    currentAppointments: number
    previousAppointments: number
    comparison: "day" | "week" | "month" | "period"
  }
}

const DASHBOARD_PERIODS: { value: DashboardRange; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "total", label: "All time" },
  { value: "custom", label: "Custom range" },
]

const periodDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "Asia/Kolkata",
})

function rangeForPeriod(period: DashboardRange): DateRange | undefined {
  if (period === "total") return undefined
  if (period === "custom") return undefined
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90
  const to = new Date()
  return { from: subDays(to, days - 1), to }
}

function dateRangeLabel(range: DateRange | undefined, allTime: boolean) {
  if (allTime) return "All time"
  if (!range?.from) return "Select dates"
  if (!range.to) return periodDate.format(range.from)
  return `${periodDate.format(range.from)} - ${periodDate.format(range.to)}`
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

function revenueTrend(summary: DashboardSummary | undefined) {
  if (!summary) return null
  const { currentRevenue, previousRevenue, comparison } = summary.trend
  if (currentRevenue === previousRevenue) {
    return {
      direction: "flat" as const,
      text: `No change from previous ${comparison}`,
    }
  }
  if (previousRevenue === 0) {
    return {
      direction: "up" as const,
      text: `New revenue from previous ${comparison}`,
    }
  }
  const direction = currentRevenue > previousRevenue ? "up" : "down"
  const percentage = Math.round(
    (Math.abs(currentRevenue - previousRevenue) / previousRevenue) * 100
  )
  return {
    direction,
    text: `${direction === "up" ? "↑" : "↓"} ${percentage}% from previous ${comparison}`,
  }
}

function appointmentTrend(summary: DashboardSummary | undefined) {
  if (!summary) return null
  const { currentAppointments, previousAppointments } = summary.trend
  if (currentAppointments === previousAppointments) {
    return { direction: "flat" as const, text: "No change from previous day" }
  }
  if (previousAppointments === 0) {
    return {
      direction: "up" as const,
      text: "New appointments from previous day",
    }
  }
  const direction = currentAppointments > previousAppointments ? "up" : "down"
  const percentage = Math.round(
    (Math.abs(currentAppointments - previousAppointments) /
      previousAppointments) *
      100
  )
  return {
    direction,
    text: `${direction === "up" ? "↑" : "↓"} ${percentage}% from previous day`,
  }
}

function patientTrend(summary: DashboardSummary | undefined) {
  if (!summary) return null
  const { currentPatients, previousPatients } = summary.patientTrend
  const comparison = summary.trend.comparison
  if (currentPatients === previousPatients) {
    return {
      direction: "flat" as const,
      text: `No change from previous ${comparison}`,
    }
  }
  if (previousPatients === 0) {
    return {
      direction: "up" as const,
      text: `New patients from previous ${comparison}`,
    }
  }
  const direction = currentPatients > previousPatients ? "up" : "down"
  const percentage = Math.round(
    (Math.abs(currentPatients - previousPatients) / previousPatients) * 100
  )
  return {
    direction,
    text: `${direction === "up" ? "↑" : "↓"} ${percentage}% from previous ${comparison}`,
  }
}

export function SectionCards() {
  const queryClient = useQueryClient()
  const refreshing = useIsFetching({ queryKey: ["dashboard"] }) > 0
  const search = DashboardRoute.useSearch()
  const navigate = DashboardRoute.useNavigate()
  const clinic = search.clinic ?? "bhagwanpur"
  const dashboardPeriod = search.range ?? "30d"
  const customRange =
    dashboardPeriod === "custom" && search.from
      ? {
          from: new Date(`${search.from}T00:00:00`),
          to: search.to ? new Date(`${search.to}T00:00:00`) : undefined,
        }
      : undefined
  const dateRange = customRange ?? rangeForPeriod(dashboardPeriod)
  const from = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : null
  const to = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : from
  const filteredQuery =
    dashboardPeriod === "total" || !from || !to
      ? "period=total"
      : `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
  const summaryQuery = useQuery({
    queryKey: ["dashboard", "summary", { dashboardPeriod, from, to, clinic }],
    queryFn: ({ signal }) =>
      apiGet<DashboardSummary>(
        `/api/booking/dashboard-summary?${filteredQuery}&clinic=${clinic}`,
        { signal }
      ),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    enabled: dashboardPeriod === "total" || Boolean(from && to),
  })
  const todayQuery = useQuery({
    queryKey: ["dashboard", "summary", "today", { clinic }],
    queryFn: ({ signal }) =>
      apiGet<DashboardSummary>(
        `/api/booking/dashboard-summary?period=1d&clinic=${clinic}`,
        { signal }
      ),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })
  const summary = summaryQuery.data
  const trend = revenueTrend(summary)
  const todaySummary = todayQuery.data
  const todayTrend = appointmentTrend(todaySummary)
  const patientsTrend = patientTrend(summary)
  const totalPatients = summary?.totalPatients ?? 0
  const malePatients = summary?.genderDistribution.male ?? 0
  const femalePatients = summary?.genderDistribution.female ?? 0
  const malePercentage = totalPatients
    ? Math.round((malePatients / totalPatients) * 100)
    : 0
  const femalePercentage = totalPatients
    ? Math.round((femalePatients / totalPatients) * 100)
    : 0

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-end gap-2 px-4 lg:px-6">
        <Button
          variant="outline"
          disabled={refreshing}
          onClick={() => void queryClient.invalidateQueries({ queryKey: ["dashboard"] })}
        >
          <RefreshCwIcon className={refreshing ? "animate-spin" : undefined} />
          Refresh
        </Button>
        <NativeSelect
          aria-label="Dashboard clinic"
          value={clinic}
          onChange={(event) => {
            const nextClinic = event.target.value as DashboardClinic
            navigate({
              search: (previous) => ({ ...previous, clinic: nextClinic }),
            })
          }}
          className="rounded-full bg-background shadow-xs [&>select]:h-9 [&>select]:rounded-full [&>select]:pl-4 [&>select]:font-medium"
        >
          <NativeSelectOption value="bhagwanpur">Fardo Gola</NativeSelectOption>
          <NativeSelectOption value="juran_chhapra">
            Juran Chhapra
          </NativeSelectOption>
          <NativeSelectOption value="all">All clinics</NativeSelectOption>
        </NativeSelect>
        <div className="flex overflow-hidden rounded-full border bg-background shadow-xs">
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 border-r px-4 py-2 text-sm font-medium tabular-nums hover:bg-muted/60"
              >
                <CalendarDaysIcon className="size-4 text-muted-foreground" />
                <span>
                  {dateRangeLabel(dateRange, dashboardPeriod === "total")}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-0">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(nextRange) => {
                  const nextFrom = nextRange?.from
                  if (!nextFrom) return
                  navigate({
                    replace: true,
                    search: (previous) => ({
                      ...previous,
                      range: "custom",
                      from: format(nextFrom, "yyyy-MM-dd"),
                      to: nextRange.to
                        ? format(nextRange.to, "yyyy-MM-dd")
                        : undefined,
                    }),
                  })
                }}
                defaultMonth={dateRange?.from}
                numberOfMonths={1}
              />
            </PopoverContent>
          </Popover>
          <label className="relative flex items-center">
            <span className="sr-only">Dashboard date range</span>
            <select
              value={dashboardPeriod}
              onChange={(event) => {
                const nextPeriod = event.target.value as DashboardRange
                navigate({
                  search: (previous) => ({
                    ...previous,
                    ...(nextPeriod === "custom" && dateRange?.from
                      ? {
                          range: "custom",
                          from: format(dateRange.from, "yyyy-MM-dd"),
                          to: dateRange.to
                            ? format(dateRange.to, "yyyy-MM-dd")
                            : undefined,
                        }
                      : { range: nextPeriod, from: undefined, to: undefined }),
                  }),
                })
              }}
              className="h-full appearance-none bg-transparent py-2 pr-9 pl-4 text-sm font-medium outline-none"
            >
              {DASHBOARD_PERIODS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-3 size-4 text-muted-foreground" />
          </label>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Revenue</CardDescription>
            <CardAction>
              {trend?.direction === "up" && (
                <TrendingUpIcon className="size-5 text-emerald-600" />
              )}
              {trend?.direction === "down" && (
                <TrendingDownIcon className="size-5 text-destructive" />
              )}
            </CardAction>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {summary ? inr.format(summary.totalRevenue) : "—"}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div
              className={`line-clamp-1 flex items-center gap-1 font-medium ${
                trend?.direction === "up"
                  ? "text-emerald-600"
                  : trend?.direction === "down"
                    ? "text-destructive"
                    : ""
              }`}
            >
              {trend?.text ?? "Calculating revenue trend…"}
            </div>
          </CardFooter>
        </Card>
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Today's Appointment</CardDescription>
            <CardAction>
              {todayTrend?.direction === "up" && (
                <TrendingUpIcon className="size-5 text-emerald-600" />
              )}
              {todayTrend?.direction === "down" && (
                <TrendingDownIcon className="size-5 text-destructive" />
              )}
            </CardAction>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {todaySummary?.totalAppointments ?? "—"}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div
              className={`line-clamp-1 flex items-center gap-1 font-medium ${
                todayTrend?.direction === "up"
                  ? "text-emerald-600"
                  : todayTrend?.direction === "down"
                    ? "text-destructive"
                    : ""
              }`}
            >
              {todayTrend?.text ?? "Calculating appointment trend…"}
            </div>
          </CardFooter>
        </Card>
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Patients</CardDescription>
            <CardAction>
              {patientsTrend?.direction === "up" && (
                <TrendingUpIcon className="size-5 text-emerald-600" />
              )}
              {patientsTrend?.direction === "down" && (
                <TrendingDownIcon className="size-5 text-destructive" />
              )}
            </CardAction>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {summary?.totalPatients ?? "—"}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div
              className={`line-clamp-1 flex items-center gap-1 font-medium ${
                patientsTrend?.direction === "up"
                  ? "text-emerald-600"
                  : patientsTrend?.direction === "down"
                    ? "text-destructive"
                    : ""
              }`}
            >
              {patientsTrend?.text ?? "Calculating patient trend…"}
            </div>
          </CardFooter>
        </Card>
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Gender</CardDescription>
            <div className="grid grid-cols-2 divide-x">
              {[
                {
                  label: "Male",
                  count: malePatients,
                  percentage: malePercentage,
                  color: "bg-sky-500",
                },
                {
                  label: "Female",
                  count: femalePatients,
                  percentage: femalePercentage,
                  color: "bg-pink-500",
                },
              ].map(({ label, count, percentage, color }) => (
                <div key={label} className="min-w-0 px-4 first:pl-0 last:pr-0">
                  <div>
                    <p className="text-3xl font-semibold tabular-nums">
                      {count}
                    </p>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-xs font-medium text-muted-foreground tabular-nums">
                      {percentage}% of total
                    </p>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={`${label}: ${percentage}% of all patients`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percentage}
                    className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted"
                  >
                    <div
                      className={`h-full rounded-full transition-[width] duration-500 ease-out ${color}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
