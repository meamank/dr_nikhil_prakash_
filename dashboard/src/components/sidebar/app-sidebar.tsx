import * as React from "react"

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
  Mail,
  Settings,
  UserCog,
  LogOut,
} from "lucide-react"
import ClinicHeader from "./ClinicHeader"
import { Link, useMatchRoute } from "@tanstack/react-router"
import Username from "../common/Username"

const items = [
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

type NavItemProps = (typeof items)[number] & {
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
        className="gap-4.5"
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
          <span>{title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { setOpenMobile } = useSidebar()

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <ClinicHeader />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="pt-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
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
                <Username name="Aman" userType="Admin" />
              </div>
              <button
                onClick={() => console.log("Logout clicked")}
                title="Log out"
                className="rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
