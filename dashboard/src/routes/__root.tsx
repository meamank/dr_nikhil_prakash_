import { Outlet, createRootRoute } from "@tanstack/react-router"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import NotFoundPage from "@/features/notFound/NotFoundPage"

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: () => <NotFoundPage />,
})
function RootComponent() {
  return (
    <ThemeProvider defaultTheme="light">
      <TooltipProvider>
        <Outlet />
        <Toaster richColors position="top-right" />
      </TooltipProvider>
    </ThemeProvider>
  )
}
