import * as React from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiGet, apiPost } from "@/lib/api"
import type { AppointmentRow } from "@/components/data-table"

type PatientHit = {
  pid: string
  fullName: string
  mobile: string
  ageYears: number | null
  gender: string | null
}

export function LinkPidDialog({
  appointment,
  open,
  onOpenChange,
  onLinked,
}: {
  appointment: AppointmentRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onLinked: () => void
}) {
  const [q, setQ] = React.useState("")
  const [hits, setHits] = React.useState<PatientHit[]>([])
  const [searching, setSearching] = React.useState(false)
  const [linking, setLinking] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open && appointment) {
      // Prefill with the booked mobile so old patients surface immediately
      setQ(appointment.patientMobile)
      search(appointment.patientMobile)
    } else {
      setQ("")
      setHits([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, appointment?.id])

  async function search(query = q) {
    if (!query.trim()) {
      setHits([])
      return
    }
    setSearching(true)
    try {
      const params = new URLSearchParams({ q: query.trim(), limit: "10" })
      const data = await apiGet<{ patients?: PatientHit[] }>(
        `/api/patients?${params}`
      )
      setHits(data?.patients ?? [])
    } catch {
      setHits([])
    } finally {
      setSearching(false)
    }
  }

  async function link(pid: string) {
    if (!appointment) return
    setLinking(pid)
    try {
      await apiPost(`/api/booking/appointments/${appointment.id}/mark-paid`, {
        pid,
      })
      toast.success(`Linked ${pid} — marked paid`)
      onOpenChange(false)
      onLinked()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Link failed")
    } finally {
      setLinking(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Link existing PID</DialogTitle>
          <DialogDescription>
            {appointment
              ? `Booking for ${appointment.patientName} — find the returning patient, or close and use Mark Paid for a new PID.`
              : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="link-pid-q">Search PID, name, mobile</Label>
              <Input
                id="link-pid-q"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && search()}
                placeholder="PID000001, name, mobile…"
              />
            </div>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => search()}
              disabled={searching}
            >
              {searching ? "…" : "Search"}
            </Button>
          </div>
          {hits.length === 0 && !searching ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No matches. Use Mark Paid to issue a new PID.
            </p>
          ) : (
            <ul className="max-h-64 divide-y overflow-y-auto rounded-lg border">
              {hits.map((p) => (
                <li key={p.pid} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {p.fullName}{" "}
                      <span className="font-mono text-xs text-muted-foreground">
                        {p.pid}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.mobile}
                      {p.ageYears != null && ` · ${p.ageYears}y`}
                      {p.gender && ` · ${p.gender}`}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    disabled={linking === p.pid}
                    onClick={() => link(p.pid)}
                  >
                    {linking === p.pid ? "Linking…" : "Link + Paid"}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
