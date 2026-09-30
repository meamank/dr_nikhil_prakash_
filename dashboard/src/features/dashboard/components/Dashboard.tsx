import { lazy, Suspense } from "react"

import { SectionCards } from "@/components/section-cards"

const ChartAreaInteractive = lazy(() =>
  import("@/components/chart-area-interactive").then((module) => ({
    default: module.ChartAreaInteractive,
  }))
)

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards />
      <div className="px-4 lg:px-6">
        <Suspense
          fallback={
            <div
              className="h-[322px] animate-pulse rounded-xl border bg-muted/40 motion-reduce:animate-none"
              aria-label="Loading dashboard chart"
            />
          }
        >
          <ChartAreaInteractive />
        </Suspense>
      </div>
    </div>
  )
}
