import { getSession } from "@/lib/auth-client"
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_auth")({
  beforeLoad: async () => {
    const { data: session } = await getSession()

    if (session) {
      const dest = (session.user as any).role === "user" ? "/" : "/"
      throw redirect({ to: dest })
    }
  },
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <Outlet />
      </div>
    </div>
  )
}
