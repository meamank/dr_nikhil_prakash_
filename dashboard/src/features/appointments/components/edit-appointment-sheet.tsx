import * as React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { AppointmentRow } from "../appointment-row"
import {
  AppointmentDetailsFields,
  type AppointmentDetails,
} from "./appointment-details-fields"

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
  "foc",
  "refunded",
  "in_progress",
  "done",
  "no_show",
] as const

const STATUS_LABELS: Record<string, string> = {
  not_paid: "Not Paid",
  paid: "Paid",
  foc: "FOC (Free of cost)",
  refunded: "Refunded",
  in_progress: "In Progress",
  done: "Done",
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
  onDelete,
  saving,
  deleting = false,
  mode = "edit",
}: {
  appointment: AppointmentRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (id: string | null, patch: AppointmentPatch) => void
  onDelete?: (id: string) => void
  saving: boolean
  deleting?: boolean
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

  const details: AppointmentDetails = {
    name,
    address,
    mobile: patientMobile,
    age,
    sex: gender,
    clinic,
    date,
  }

  function updateDetails<Field extends keyof AppointmentDetails>(
    field: Field,
    value: AppointmentDetails[Field]
  ) {
    switch (field) {
      case "name":
        setName(value as string)
        break
      case "address":
        setAddress(value as string)
        break
      case "mobile":
        setPatientMobile(value as string)
        break
      case "age":
        setAge(value as string)
        break
      case "sex":
        setGender(value as string)
        break
      case "clinic":
        setClinic(value as "juran_chhapra" | "bhagwanpur")
        break
      case "date":
        setDate(value as string)
        break
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="!w-screen !max-w-none overflow-y-auto sm:!w-3/4 sm:!max-w-sm">
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
        <form onSubmit={submit} className="grid gap-4 px-4 pb-4 md:grid-cols-2">
          <AppointmentDetailsFields
            idPrefix="edit-appointment"
            values={details}
            onChange={updateDetails}
            autoFocus
          />
          {mode === "edit" ? (
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="edit-appointment-status">Status</Label>
              <NativeSelect
                id="edit-appointment-status"
                className="w-full"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                {STATUSES.map((s) => (
                  <NativeSelectOption key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          ) : (
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label>Status</Label>
              <p className="text-sm font-medium text-muted-foreground">
                Not Paid — set automatically for new bookings.
              </p>
            </div>
          )}
          <SheetFooter className="md:col-span-2">
            {mode === "edit" && appointment && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => onDelete(appointment.id)}
                disabled={saving || deleting}
              >
                Delete appointment
              </Button>
            )}
            <Button type="submit" disabled={saving || deleting}>
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
