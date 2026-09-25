import { useState } from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  ClipboardClock,
  UserSearch,
  FileChartColumn,
  Mail,
  Settings,
  UserCog,
  LogOut,
} from "lucide-react"
import ClinicHeader from "./ClinicHeader"
import { Link, useMatchRoute } from "@tanstack/react-router"
import Username from "../common/Username"
import { signOut, useSession } from "@/lib/auth-client"

const adminItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Appointments",
    url: "/appointments",
    icon: ClipboardClock,
  },
  {
    title: "Patients",
    url: "/patients",
    icon: UserSearch,
  },
  {
    title: "Reports",
    url: "/reports",
    icon: FileChartColumn,
  },
  {
    title: "Messages",
    url: "/messages",
    icon: Mail,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

const userItems = [
  {
    title: "Appointments",
    url: "/appointments",
    icon: ClipboardClock,
  },
]

const staffItems = adminItems.filter((item) => item.url !== "/settings")

type NavItemProps = (typeof adminItems)[number] & {
  onNavigate: () => void
}
function NavItem({ title, url, icon: Icon, onNavigate }: NavItemProps) {
  const matchRoute = useMatchRoute()
  const isActive = Boolean(matchRoute({ to: url, fuzzy: url !== "/" }))

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        tooltip={title}
        className="gap-4.5 py-5"
        isActive={isActive}
      >
        <Link
          to={url}
          activeProps={{
            className:
              "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
          }}
          activeOptions={{ exact: url === "/", includeSearch: false }}
          onClick={onNavigate}
        >
          <Icon />
          <span className="text-base sm:text-sm">{title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { setOpenMobile } = useSidebar()

  const { data: session } = useSession()

  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const res = (await signOut()) as
        { success?: boolean; error?: unknown } | undefined
      // better-auth resolves (not throws) on HTTP errors — surface them
      if (res?.error || res?.success === false) {
        console.error("Sign out failed:", res?.error)
      }
    } catch (err) {
      console.error("Sign out Error:", err)
    } finally {
      setIsLoggingOut(false)
      // Hard navigation (not router navigate) so any cached session state is
      // dropped and the _auth guard revalidates against the cleared cookie.
      window.location.assign("/login")
    }
  }

  const name = session?.user?.name || "User"
  const role = session?.user?.role ? session.user.role.toUpperCase() : "user"

  const navBar =
    role === "ADMIN" ? adminItems : role === "STAFF" ? staffItems : userItems

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <ClinicHeader />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="pt-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {navBar.map((item) => (
                <NavItem
                  key={item.title}
                  {...item}
                  onNavigate={() => setOpenMobile(false)}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="group flex items-center justify-between rounded-md p-2 hover:bg-sidebar-accent/50">
              <div className="flex items-center gap-3 overflow-hidden">
                <UserCog className="size-5 shrink-0 text-muted-foreground" />
                <Username name={name} userType={role} />
              </div>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                title="Log out"
                className="flex items-center gap-2 rounded p-1 px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-destructive hover:text-white"
              >
                <LogOut className="size-3" />
                Logout
              </button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
