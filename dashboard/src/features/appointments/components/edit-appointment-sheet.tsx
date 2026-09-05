import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { AppointmentRow } from "@/components/data-table"

export type AppointmentPatch = {
  patientName?: string
  patientAddress?: string | null
  patientMobile?: string
  patientAgeYears?: number | null
  patientGender?: "male" | "female" | "other" | null
  clinic?: "juran_chhapra" | "bhagwanpur"
  date?: string
  status?: string
}

const STATUSES = [
  "not_paid",
  "paid",
  "in_progress",
  "done",
  "cancelled",
  "no_show",
] as const

const STATUS_LABELS: Record<string, string> = {
  not_paid: "Not Paid",
  paid: "Paid",
  in_progress: "In Progress",
  done: "Done",
  cancelled: "Cancelled",
  no_show: "No Show",
}

function toDateInput(v: AppointmentRow["scheduledAt"]): string {
  const d = new Date(typeof v === "number" && v < 1e12 ? v * 1000 : v)
  if (Number.isNaN(d.getTime())) return ""
  // IST date for the picker
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000)
  return ist.toISOString().slice(0, 10)
}

export function EditAppointmentSheet({
  appointment,
  open,
  onOpenChange,
  onSave,
  saving,
  mode = "edit",
}: {
  appointment: AppointmentRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (id: string | null, patch: AppointmentPatch) => void
  saving: boolean
  mode?: "edit" | "create"
}) {
  const [name, setName] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [patientMobile, setPatientMobile] = React.useState("")
  const [age, setAge] = React.useState("")
  const [gender, setGender] = React.useState("")
  const [clinic, setClinic] = React.useState<"juran_chhapra" | "bhagwanpur">(
    "juran_chhapra"
  )
  const [date, setDate] = React.useState("")
  const [status, setStatus] = React.useState<string>("not_paid")

  React.useEffect(() => {
    if (!open) return
    if (appointment && mode === "edit") {
      setName(appointment.patientName)
      setAddress(appointment.patientAddress ?? "")
      setPatientMobile(appointment.patientMobile)
      setAge(
        appointment.patientAgeYears != null
          ? String(appointment.patientAgeYears)
          : ""
      )
      setGender(appointment.patientGender ?? "")
      setClinic(
        appointment.clinic === "bhagwanpur" ? "bhagwanpur" : "juran_chhapra"
      )
      setDate(toDateInput(appointment.scheduledAt))
      setStatus(appointment.status)
    } else if (mode === "create") {
      setName("")
      setAddress("")
      setPatientMobile("")
      setAge("")
      setGender("male")
      setClinic("juran_chhapra")
      const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000)
      setDate(ist.toISOString().slice(0, 10))
      setStatus("not_paid")
    }
  }, [appointment, open, mode])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (mode === "edit" && !appointment) return
    const patch: AppointmentPatch = {
      patientName: name.trim(),
      patientAddress: address.trim() || null,
      patientMobile: patientMobile.trim(),
      patientAgeYears: age.trim() === "" ? null : Number(age),
      patientGender: (gender || null) as AppointmentPatch["patientGender"],
      clinic,
      date,
      status,
    }
    onSave(mode === "edit" ? appointment!.id : null, patch)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {mode === "create" ? "Add appointment" : "Edit appointment"}
          </SheetTitle>
          <SheetDescription>
            {mode === "edit" && appointment
              ? `Queue #${appointment.queueNumber} · ${appointment.id.slice(0, 8)}`
              : mode === "create"
                ? "Book a slot for a walk-in or phone patient."
                : ""}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="flex flex-col gap-4 px-4 pb-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ea-name">Patient name</Label>
            <Input
              id="ea-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ea-address">Address</Label>
            <Input
              id="ea-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ea-patient-mobile">Mobile</Label>
            <Input
              id="ea-patient-mobile"
              value={patientMobile}
              onChange={(e) => setPatientMobile(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ea-age">Age</Label>
              <Input
                id="ea-age"
                type="number"
                min={0}
                max={130}
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ea-gender">Gender</Label>
              <Select
                value={gender || "unknown"}
                onValueChange={(v) => setGender(v === "unknown" ? "" : v)}
              >
                <SelectTrigger id="ea-gender">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unknown">—</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ea-clinic">Clinic</Label>
              <Select
                value={clinic}
                onValueChange={(v) =>
                  setClinic(v === "bhagwanpur" ? "bhagwanpur" : "juran_chhapra")
                }
              >
                <SelectTrigger id="ea-clinic">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="juran_chhapra">Juran Chhapra</SelectItem>
                  <SelectItem value="bhagwanpur">Bhagwanpur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ea-date">Date</Label>
              <Input
                id="ea-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>
          {mode === "edit" ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="ea-status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="ea-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Label>Status</Label>
              <p className="text-sm font-medium text-muted-foreground">
                Not Paid — set automatically for new bookings.
              </p>
            </div>
          )}
          <SheetFooter>
            <Button type="submit" disabled={saving}>
              {saving
                ? mode === "create"
                  ? "Booking…"
                  : "Saving…"
                : mode === "create"
                  ? "Book appointment"
                  : "Save changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
