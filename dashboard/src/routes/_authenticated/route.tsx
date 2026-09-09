import * as React from "react"
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { getSession } from "@/lib/auth-client"
import { AppointmentsHeaderProvider } from "@/features/appointments/appointments-header-context"

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    const { data: session } = await getSession()

    if (!session) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      })
    }

    if (session.user.role === "user") {
      const isAppointments =
        location.pathname === "/appointments" ||
        location.pathname.startsWith("/appointments/")
      if (!isAppointments) {
        throw redirect({ to: "/appointments" })
      }
    }
    return { session }
  },
  component: AppLayout,
})

function AppLayout() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppointmentsHeaderProvider>
        <div className="flex min-h-svh w-full">
          <AppSidebar variant="inset" />
          <SidebarInset>
            <SiteHeader />
            <div className="flex flex-1 flex-col">
              <div className="@container/main flex flex-1 flex-col gap-2">
                <Outlet />
              </div>
            </div>
          </SidebarInset>
        </div>
      </AppointmentsHeaderProvider>
    </SidebarProvider>
  )
}
