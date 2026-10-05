"use client"

import * as React from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { apiGet } from "@/lib/api"
import { Route as DashboardRoute } from "@/routes/_authenticated/index"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type ChartMetric = "revenue" | "patients" | "appointments"

type ChartPoint = {
  date: string
  revenue: number
  patients: number
  appointments: number
}

const metrics: { value: ChartMetric; label: string }[] = [
  { value: "revenue", label: "Total Revenue" },
  { value: "patients", label: "Total Patients" },
  { value: "appointments", label: "Total Appointments" },
]

const chartConfig = {
  revenue: { label: "Revenue", color: "var(--primary)" },
  patients: { label: "Patients", color: "var(--primary)" },
  appointments: { label: "Appointments", color: "var(--primary)" },
} satisfies ChartConfig

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
})

function filterQuery(search: ReturnType<typeof DashboardRoute.useSearch>) {
  const range = search.range ?? "30d"
  const clinic = search.clinic ?? "bhagwanpur"
  if (range === "custom" && search.from) {
    return `from=${encodeURIComponent(search.from)}&to=${encodeURIComponent(search.to ?? search.from)}&clinic=${clinic}`
  }
  return `period=${range === "custom" ? "30d" : range}&clinic=${clinic}`
}

export function ChartAreaInteractive() {
  const search = DashboardRoute.useSearch()
  const [metric, setMetric] = React.useState<ChartMetric>("revenue")
  const query = filterQuery(search)
  const chartQuery = useQuery({
    queryKey: ["dashboard", "chart", { query }],
    queryFn: ({ signal }) =>
      apiGet<{ points: ChartPoint[] }>(
        `/api/booking/dashboard-chart?${query}`,
        { signal }
      ),
    staleTime: 10_000,
    placeholderData: keepPreviousData,
  })
  const points = chartQuery.data?.points ?? []
  const rangeLabel =
    search.range === "custom" && search.from
      ? search.to
        ? `${search.from} to ${search.to}`
        : search.from
      : search.range === "total"
        ? "All time"
        : search.range === "7d"
          ? "Last 7 days"
          : search.range === "90d"
            ? "Last 90 days"
            : "Last 30 days"

  return (
    <Tabs
      value={metric}
      onValueChange={(value) => setMetric(value as ChartMetric)}
      className="w-full"
    >
      <Card className="@container/card">
        <CardHeader className="gap-3">
          <div className="no-scrollbar overflow-x-auto">
            <TabsList>
              {metrics.map(({ value, label }) => (
                <TabsTrigger key={value} value={value}>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <CardDescription>{rangeLabel}</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-2 sm:px-6 sm:pt-4">
          {points.length === 0 && !chartQuery.isLoading ? (
            <div className="grid h-[250px] place-items-center text-sm text-muted-foreground">
              No data for this date range.
            </div>
          ) : (
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[250px] w-full"
            >
              <AreaChart data={points}>
                <defs>
                  <linearGradient id="dashboardMetricFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={`var(--color-${metric})`} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={`var(--color-${metric})`} stopOpacity={0.08} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(value: string) =>
                    new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      labelFormatter={(value) =>
                        new Date(`${value}T00:00:00`).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" }
                        )
                      }
                      formatter={(value) =>
                        metric === "revenue"
                          ? inr.format(Number(value))
                          : Number(value).toLocaleString("en-IN")
                      }
                    />
                  }
                />
                <Area
                  dataKey={metric}
                  type="monotone"
                  fill="url(#dashboardMetricFill)"
                  stroke={`var(--color-${metric})`}
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </Tabs>
  )
}
