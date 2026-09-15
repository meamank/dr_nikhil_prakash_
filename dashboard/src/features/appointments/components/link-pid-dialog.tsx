import * as React from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiGet, apiPost } from "@/lib/api"
import type { AppointmentRow } from "../appointment-row"

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
  const [appliedQuery, setAppliedQuery] = React.useState("")

  React.useEffect(() => {
    if (open && appointment) {
      // Prefill with the booked mobile so old patients surface immediately
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQ(appointment.patientMobile)
      setAppliedQuery(appointment.patientMobile)
    } else {
      setQ("")
      setAppliedQuery("")
    }
  }, [open, appointment])

  const patientSearchQuery = useQuery({
    queryKey: ["patient-search", appliedQuery] as const,
    queryFn: async () => {
      const params = new URLSearchParams({ q: appliedQuery, limit: "10" })
      const data = await apiGet<{ patients?: PatientHit[] }>(
        `/api/patients?${params}`
      )
      return data.patients ?? []
    },
    enabled: open && appliedQuery.length > 0,
    staleTime: 30_000,
  })
  const hits = patientSearchQuery.data ?? []

  const linkMutation = useMutation({
    mutationFn: (pid: string) => {
      if (!appointment) throw new Error("Appointment not found")
      return apiPost(`/api/booking/appointments/${appointment.id}/mark-paid`, {
        pid,
      })
    },
    onSuccess: (_data, pid) => {
      toast.success(`Linked ${pid} — marked paid`)
      onOpenChange(false)
      onLinked()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Link failed")
    },
  })

  function search() {
    setAppliedQuery(q.trim())
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
              onClick={search}
              disabled={patientSearchQuery.isFetching}
            >
              {patientSearchQuery.isFetching ? "…" : "Search"}
            </Button>
          </div>
          {hits.length === 0 && !patientSearchQuery.isFetching ? (
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
                    disabled={linkMutation.isPending}
                    onClick={() => linkMutation.mutate(p.pid)}
                  >
                    {linkMutation.isPending && linkMutation.variables === p.pid
                      ? "Linking…"
                      : "Link + Paid"}
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
