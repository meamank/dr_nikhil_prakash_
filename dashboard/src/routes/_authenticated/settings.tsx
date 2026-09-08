import { createFileRoute, redirect } from "@tanstack/react-router"
import { getSession } from "@/lib/auth-client"

import SettingsPage from "@/features/settings/components/SettingsPage"

export const Route = createFileRoute("/_authenticated/settings")({
  beforeLoad: async () => {
    const { data: session } = await getSession()
    if (session?.user.role !== "admin") throw redirect({ to: "/" })
  },
  component: SettingsPage,
})
