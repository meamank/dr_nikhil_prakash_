import { useEffect, useState } from "react"
import { Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DataTable, type AppointmentRow } from "@/components/data-table"
import { apiGet, apiPatch, apiPost } from "@/lib/api"
import {
  EditAppointmentSheet,
  type AppointmentPatch,
} from "./edit-appointment-sheet"

type Clinic = "juran_chhapra" | "bhagwanpur"

const CLINICS: { id: Clinic; label: string }[] = [
  { id: "juran_chhapra", label: "Juran Chhapra" },
  { id: "bhagwanpur", label: "Bhagwanpur" },
]

function todayIST(): string {
  const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000)
  return ist.toISOString().slice(0, 10)
}

export default function AppointmentsPage() {
  const [clinic, setClinic] = useState<Clinic>("juran_chhapra")
  const [date, setDate] = useState(todayIST())
  const [search, setSearch] = useState("")
  const [rows, setRows] = useState<AppointmentRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [editing, setEditing] = useState<AppointmentRow | null>(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ clinic, date })
      if (search.trim()) params.set("q", search.trim())
      const data = await apiGet<{ appointments?: AppointmentRow[] }>(
        `/api/booking/appointments?${params}`
      )
      setRows(data?.appointments ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load appointments")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinic, date])

  async function markPaid(id: string) {
    setPayingId(id)
    setError(null)
    try {
      await apiPost(`/api/booking/appointments/${id}/mark-paid`)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mark paid failed")
    } finally {
      setPayingId(null)
    }
  }

  async function saveEdit(id: string | null, patch: AppointmentPatch) {
    setSaving(true)
    setError(null)
    try {
      if (id === null) return
      await apiPatch(`/api/booking/appointments/${id}`, patch)
      setEditing(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
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
              onClick={() => setClinic(c.id)}
            >
              {c.label}
            </Button>
          ))}
        </div>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-auto"
        />
        <div className="flex gap-2">
          <Input
            placeholder="Search name, mobile, address…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            className="w-44"
          />
          <Button variant="outline" onClick={load}>
            Search
          </Button>
        </div>
        <Button variant="ghost" onClick={load} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </Button>
        <Button className="ml-auto" asChild>
          <Link to="/appointments/add">+ Add Appointment</Link>
        </Button>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      {/* List */}
      {rows.length === 0 && !loading ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No bookings for {CLINICS.find((c) => c.id === clinic)?.label} on{" "}
            {date}.
          </CardContent>
        </Card>
      ) : (
        <DataTable
          data={rows}
          onMarkPaid={markPaid}
          payingId={payingId}
          onEdit={setEditing}
        />
      )}

      <EditAppointmentSheet
        appointment={editing}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        onSave={saveEdit}
        saving={saving}
        mode="edit"
      />
    </div>
  )
}
