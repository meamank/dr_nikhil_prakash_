import { Moon, Sun } from "lucide-react"
import { useMatchRoute, useRouterState } from "@tanstack/react-router"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { useAppointmentsHeader } from "@/features/appointments/appointments-header-context"

export function SiteHeader() {
  const { summary: appointmentsSummary } = useAppointmentsHeader()
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"
  const routeMatch = useMatchRoute()

  const patientMatch = useRouterState({
    select: (s) =>
      s.matches.find(
        (m) => m.routeId === "/_authenticated/patients/$patientId"
      ),
  })
  const patientLoader = (patientMatch?.loaderData ?? null) as {
    patient?: { fullName?: string }
  } | null
  const patientParams = (patientMatch?.params ?? {}) as {
    patientId?: string
  }
  const isPatientPage = !!routeMatch({ to: "/patients/$patientId" })
  const patientTitle =
    patientLoader?.patient?.fullName ?? patientParams.patientId ?? "Patient"
  const title = routeMatch({ to: "/appointments" })
    ? "Appointments"
    : isPatientPage
      ? patientTitle.toUpperCase()
      : routeMatch({ to: "/patients" })
        ? "All Patients"
        : routeMatch({ to: "/messages" })
          ? "Messages"
          : routeMatch({ to: "/settings" })
            ? "Settings"
            : "Dashboard"

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
        {routeMatch({ to: "/appointments" }) && appointmentsSummary && (
          <span className="text-base font-medium text-muted-foreground">
            - {appointmentsSummary.lastQueueNumber}
          </span>
        )}
        <div className="ml-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun /> : <Moon />}
          </Button>
        </div>
      </div>
    </header>
  )
}
