import { Outlet, createRootRoute } from "@tanstack/react-router"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from "@/components/theme-provider"
import NotFoundPage from "@/features/notFound/NotFoundPage"

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: () => <NotFoundPage />,
})
function RootComponent() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <Outlet />
      </TooltipProvider>
    </ThemeProvider>
  )
}
