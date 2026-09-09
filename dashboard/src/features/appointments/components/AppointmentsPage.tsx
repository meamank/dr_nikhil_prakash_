import { useEffect, useState } from "react"
import { Link } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DataTable, type AppointmentRow } from "@/components/data-table"
import { apiGet, apiPatch, apiPost } from "@/lib/api"
import {
  EditAppointmentSheet,
  type AppointmentPatch,
} from "./edit-appointment-sheet"
import { useAppointmentsHeader } from "../appointments-header-context"

type Clinic = "juran_chhapra" | "bhagwanpur"
type Pagination = { pageIndex: number; pageSize: number }

const CLINICS: { id: Clinic; label: string }[] = [
  { id: "juran_chhapra", label: "Juran Chhapra" },
  { id: "bhagwanpur", label: "Bhagwanpur" },
]

function todayIST(): string {
  const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000)
  return ist.toISOString().slice(0, 10)
}

function initialPagination(): Pagination {
  const isMobile =
    typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
  return { pageIndex: 0, pageSize: isMobile ? 15 : 10 }
}

function matchesAppointmentSearch(appointment: AppointmentRow, query: string) {
  const search = query.trim().toLowerCase()
  if (!search) return true
  return (
    appointment.patientName.toLowerCase().startsWith(search) ||
    appointment.patientMobile.includes(search) ||
    appointment.patientPid?.toLowerCase().includes(search) === true ||
    appointment.patientAddress?.toLowerCase().includes(search) === true
  )
}

export default function AppointmentsPage() {
  const queryClient = useQueryClient()
  const { setSummary } = useAppointmentsHeader()
  const [clinic, setClinic] = useState<Clinic>("juran_chhapra")
  const [date, setDate] = useState(todayIST())
  const [search, setSearch] = useState("")
  const [pagination, setPagination] = useState<Pagination>(initialPagination)
  const [editing, setEditing] = useState<AppointmentRow | null>(null)
  const key = ["appointments", { clinic, date }] as const
  const appointmentsQuery = useQuery({
    queryKey: key,
    queryFn: async () => {
      const params = new URLSearchParams({ clinic, date })
      const data = await apiGet<{ appointments?: AppointmentRow[] }>(
        `/api/booking/appointments?${params}`
      )
      return data.appointments ?? []
    },
    staleTime: 30_000,
  })
  const rows = appointmentsQuery.data ?? []
  // The complete clinic/day queue is already loaded, so searching is instant
  // and does not make an API request for each typed character.
  const visibleRows = rows.filter((appointment) =>
    matchesAppointmentSearch(appointment, search)
  )
  const lastQueueNumber = visibleRows.reduce(
    (highest, appointment) => Math.max(highest, appointment.queueNumber),
    0
  )

  useEffect(() => {
    setSummary(
      visibleRows.length > 0
        ? { count: visibleRows.length, lastQueueNumber }
        : null
    )
    return () => setSummary(null)
  }, [lastQueueNumber, setSummary, visibleRows.length])

  const markPaidMutation = useMutation({
    mutationFn: (id: string) =>
      apiPost(`/api/booking/appointments/${encodeURIComponent(id)}/mark-paid`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  })

  const saveEditMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: AppointmentPatch }) =>
      apiPatch(`/api/booking/appointments/${encodeURIComponent(id)}`, patch),
    onSuccess: () => {
      setEditing(null)
      return queryClient.invalidateQueries({ queryKey: key })
    },
  })
  const requestError =
    appointmentsQuery.error ?? markPaidMutation.error ?? saveEditMutation.error

  function resetToFirstPage() {
    setPagination((current) => ({ ...current, pageIndex: 0 }))
  }

  function changeClinic(next: Clinic) {
    setClinic(next)
    resetToFirstPage()
  }

  function changeDate(next: string) {
    setDate(next)
    resetToFirstPage()
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex gap-2">
          {CLINICS.map((c) => (
            <Button
              key={c.id}
              variant={clinic === c.id ? "default" : "outline"}
              onClick={() => changeClinic(c.id)}
            >
              {c.label}
            </Button>
          ))}
        </div>
        <Input
          type="date"
          value={date}
          onChange={(e) => changeDate(e.target.value)}
          className="w-auto"
        />
        <div className="flex gap-2">
          <Input
            placeholder="Search name, mobile, PID, address…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              resetToFirstPage()
            }}
            className="w-44"
          />
        </div>
        <Button
          variant="ghost"
          onClick={() => queryClient.invalidateQueries({ queryKey: key })}
          disabled={appointmentsQuery.isFetching}
        >
          {appointmentsQuery.isFetching ? "Loading…" : "Refresh"}
        </Button>
        <Button className="ml-auto" asChild>
          <Link to="/appointments/add">+ Add Appointment</Link>
        </Button>
      </div>

      {requestError && (
        <p
          role="alert"
          className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {requestError instanceof Error
            ? requestError.message
            : "Could not update appointments."}
        </p>
      )}

      {/* List */}
      {visibleRows.length === 0 && !appointmentsQuery.isLoading ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No bookings for {CLINICS.find((c) => c.id === clinic)?.label} on{" "}
            {date}.
          </CardContent>
        </Card>
      ) : (
        <DataTable
          data={visibleRows}
          onMarkPaid={(id) => markPaidMutation.mutate(id)}
          payingId={
            markPaidMutation.isPending
              ? markPaidMutation.variables ?? null
              : null
          }
          onEdit={setEditing}
          pagination={pagination}
          onPaginationChange={setPagination}
        />
      )}

      <EditAppointmentSheet
        appointment={editing}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        onSave={(id, patch) => {
          if (id !== null) saveEditMutation.mutate({ id, patch })
        }}
        saving={saveEditMutation.isPending}
        mode="edit"
      />
    </div>
  )
}
