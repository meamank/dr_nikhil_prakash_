import { Activity } from "lucide-react"

export default function ClinicHeader() {
  return (
    <div className="flex items-center gap-3 overflow-hidden px-1 py-1.5 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0">
      <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
        <Activity className="size-4 shrink-0" />
      </div>

      <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
        <h1 className="truncate text-base font-bold text-zinc-900">
          Dr. (Maj) Nikhil Prakash
        </h1>
        <h3 className="truncate text-xs text-zinc-500">General Physician</h3>
      </div>
    </div>
  )
}
