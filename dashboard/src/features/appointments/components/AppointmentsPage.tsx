import { useEffect, useState } from "react"
import { Link } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { DataTable } from "@/components/data-table"
import type { AppointmentRow } from "../appointment-row"
import { apiDelete, apiPatch, apiPost } from "@/lib/api"
import { toast } from "sonner"
import {
  EditAppointmentSheet,
  type AppointmentPatch,
} from "./edit-appointment-sheet"
import { useAppointmentsHeader } from "../appointments-header-context"
import { Route } from "@/routes/_authenticated/appointments/index"
import {
  appointmentKeys,
  appointmentsQueryOptions,
  todayIST,
} from "../appointment-queries"

type Clinic = "juran_chhapra" | "bhagwanpur"
type Pagination = { pageIndex: number; pageSize: number }

const CLINICS: { id: Clinic; label: string }[] = [
  { id: "juran_chhapra", label: "Juran Chhapra" },
  { id: "bhagwanpur", label: "Bhagwanpur" },
]

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
  const searchParams = Route.useSearch()
  const navigate = Route.useNavigate()
  const queryClient = useQueryClient()
  const { setSummary } = useAppointmentsHeader()
  const {
    clinic = "juran_chhapra",
    date = todayIST(),
    query: search = "",
    page = 0,
    pageSize = 10,
  } = searchParams
  const [refreshing, setRefreshing] = useState(false)
  const [editing, setEditing] = useState<AppointmentRow | null>(null)
  const [pendingDelete, setPendingDelete] = useState<AppointmentRow | null>(
    null
  )
  const key = appointmentKeys.list(clinic, date)
  const appointmentsQuery = useQuery(appointmentsQueryOptions(clinic, date))

  async function invalidateAppointmentData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["appointments"] }),
      queryClient.invalidateQueries({ queryKey: ["patients"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
    ])
  }
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
  const lastPage = Math.max(0, Math.ceil(visibleRows.length / pageSize) - 1)

  useEffect(() => {
    if (appointmentsQuery.isSuccess && page > lastPage) {
      navigate({
        replace: true,
        search: (current) => ({ ...current, page: lastPage }),
      })
    }
  }, [appointmentsQuery.isSuccess, lastPage, navigate, page])

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
    onSuccess: invalidateAppointmentData,
  })

  const saveEditMutation = useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string
      patch: AppointmentPatch
    }) => {
      const appointment = rows.find((row) => row.id === id)
      const requestedPaymentStatus =
        patch.status === "paid" || patch.status === "foc" ? patch.status : null

      if (requestedPaymentStatus && !appointment?.patientPid) {
        const details = { ...patch }
        delete details.status
        await apiPatch(
          `/api/booking/appointments/${encodeURIComponent(id)}`,
          details
        )
        return apiPost(
          `/api/booking/appointments/${encodeURIComponent(id)}/mark-paid`,
          requestedPaymentStatus === "foc"
            ? { paymentStatus: "foc" }
            : undefined
        )
      }

      return apiPatch(
        `/api/booking/appointments/${encodeURIComponent(id)}`,
        patch
      )
    },
    onSuccess: () => {
      setEditing(null)
      return invalidateAppointmentData()
    },
  })
  const deleteAppointmentMutation = useMutation({
    mutationFn: (id: string) =>
      apiDelete<{ deletedPatient?: boolean }>(
        `/api/booking/appointments/${encodeURIComponent(id)}`
      ),
    onSuccess: (data) => {
      setPendingDelete(null)
      toast.success(
        data.deletedPatient
          ? "Appointment and patient record deleted"
          : "Appointment deleted"
      )
      return invalidateAppointmentData()
    },
  })
  const requestError =
    appointmentsQuery.error ??
    markPaidMutation.error ??
    saveEditMutation.error ??
    deleteAppointmentMutation.error

  function changeClinic(next: Clinic) {
    navigate({
      search: (current) => ({ ...current, clinic: next, page: 0 }),
    })
  }

  function changeDate(next: string) {
    navigate({
      search: (current) => ({ ...current, date: next, page: 0 }),
    })
  }

  function changeSearch(next: string) {
    navigate({
      replace: true,
      search: (current) => ({ ...current, query: next, page: 0 }),
    })
  }

  function changePagination(next: React.SetStateAction<Pagination>) {
    const current = { pageIndex: page, pageSize }
    const pagination = typeof next === "function" ? next(current) : next
    navigate({
      search: (previous) => ({
        ...previous,
        page: Math.max(0, pagination.pageIndex),
        pageSize: pagination.pageSize,
      }),
    })
  }

  async function refreshAppointments() {
    setRefreshing(true)
    try {
      await queryClient.invalidateQueries({ queryKey: key })
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex items-end gap-2 md:gap-3">
          <div className="flex flex-col gap-1">
            <NativeSelect
              id="appointments-clinic"
              value={clinic}
              onChange={(event) =>
                changeClinic(
                  event.target.value === "bhagwanpur"
                    ? "bhagwanpur"
                    : "juran_chhapra"
                )
              }
            >
              {CLINICS.map((item) => (
                <NativeSelectOption key={item.id} value={item.id}>
                  {item.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <Input
            type="date"
            value={date}
            onChange={(e) => changeDate(e.target.value)}
            className="w-[8.5rem] md:w-auto"
          />
          <Button
            variant="ghost"
            onClick={() => void refreshAppointments()}
            disabled={refreshing}
          >
            {refreshing ? "Loading…" : "Refresh"}
          </Button>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Search name, mobile, PID, address…"
            value={search}
            onChange={(e) => {
              changeSearch(e.target.value)
            }}
            className="w-44"
          />
        </div>
        <Button className="ml-auto" asChild>
          <Link to="/appointments/add" search={{ clinic, date }}>
            + Add Appointment
          </Link>
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
              ? (markPaidMutation.variables ?? null)
              : null
          }
          onStatusChange={(appointment, status) =>
            saveEditMutation.mutate({
              id: appointment.id,
              patch: { status },
            })
          }
          statusChangingId={
            saveEditMutation.isPending
              ? (saveEditMutation.variables?.id ?? null)
              : null
          }
          onEdit={setEditing}
          onDelete={setPendingDelete}
          pagination={{ pageIndex: page, pageSize }}
          onPaginationChange={changePagination}
        />
      )}

      <EditAppointmentSheet
        appointment={editing}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        onSave={(id, patch) => {
          if (id !== null) saveEditMutation.mutate({ id, patch })
        }}
        onDelete={(id) => {
          const appointment = rows.find((row) => row.id === id)
          if (appointment) {
            setEditing(null)
            setPendingDelete(appointment)
          }
        }}
        saving={saveEditMutation.isPending}
        deleting={deleteAppointmentMutation.isPending}
        mode="edit"
      />
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete appointment?"
        description={
          pendingDelete
            ? `Delete the appointment for ${pendingDelete.patientName}?`
            : "Delete this appointment?"
        }
        confirmLabel="Delete appointment"
        onConfirm={() => {
          if (pendingDelete) deleteAppointmentMutation.mutate(pendingDelete.id)
        }}
        loading={deleteAppointmentMutation.isPending}
      />
    </div>
  )
}
