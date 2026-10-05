import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { apiPost } from "@/lib/api"
import {
  AppointmentDetailsFields,
  type AppointmentDetails,
  type Clinic,
} from "./appointment-details-fields"
import { Route } from "@/routes/_authenticated/appointments/add"

function todayIST(): string {
  const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000)
  return ist.toISOString().slice(0, 10)
}

export default function AddAppointmentPage() {
  const navigate = Route.useNavigate()
  const search = Route.useSearch()
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [mobile, setMobile] = useState("")
  const [age, setAge] = useState("")
  const [gender, setGender] = useState("")
  const [clinic, setClinic] = useState<Clinic>(search.clinic ?? "bhagwanpur")
  const [date, setDate] = useState(search.date ?? todayIST())
  const [status, setStatus] = useState<"not_paid" | "paid" | "foc">("not_paid")
  const [paymentMode, setPaymentMode] = useState<"cash" | "upi">("cash")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const details: AppointmentDetails = {
    name,
    address,
    mobile,
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
        setMobile(value as string)
        break
      case "age":
        setAge(value as string)
        break
      case "sex":
        setGender(value as string)
        break
      case "clinic":
        setClinic(value as Clinic)
        break
      case "date":
        setDate(value as string)
        break
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const appointment = await apiPost<{ appointmentId: string }>(
        "/api/booking/appointments",
        {
          patientName: name.trim(),
          address: address.trim() || null,
          mobile: mobile.trim(),
          patientAgeYears: age.trim() === "" ? null : Number(age),
          patientGender: gender || null,
          clinic,
          date,
        }
      )
      if (status === "paid" || status === "foc") {
        const payment = await apiPost<{ pid: string }>(
          `/api/booking/appointments/${encodeURIComponent(appointment.appointmentId)}/mark-paid`,
          status === "foc" ? { paymentStatus: "foc" } : { paymentMode }
        )
        toast.success(
          status === "foc"
            ? `FOC appointment added and ${payment.pid} issued`
            : `Appointment added and ${payment.pid} issued`
        )
      } else {
        toast.success("Appointment added")
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["appointments"] }),
        queryClient.invalidateQueries({ queryKey: ["patients"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["reports"] }),
      ])
      navigate({
        to: "/appointments",
        search: { clinic, date },
      })
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to add appointment"
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div>
        <div>
          <h1 className="text-lg font-semibold">Add appointment</h1>
          <p className="text-sm text-muted-foreground">
            Book a slot for a walk-in or phone patient.
          </p>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appointment details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            <AppointmentDetailsFields
              idPrefix="add-appointment"
              values={details}
              onChange={updateDetails}
              autoFocus
            />
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="add-appointment-status">Status</Label>
              <NativeSelect
                id="add-appointment-status"
                className="w-full"
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value === "paid"
                      ? "paid"
                      : event.target.value === "foc"
                        ? "foc"
                        : "not_paid"
                  )
                }
              >
                <NativeSelectOption value="not_paid">
                  Not Paid
                </NativeSelectOption>
                <NativeSelectOption value="paid">Paid</NativeSelectOption>
                <NativeSelectOption value="foc">
                  FOC (Free of cost)
                </NativeSelectOption>
              </NativeSelect>
            </div>
            {status === "paid" && (
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label htmlFor="add-appointment-payment-mode">
                  Payment mode
                </Label>
                <NativeSelect
                  id="add-appointment-payment-mode"
                  className="w-full"
                  value={paymentMode}
                  onChange={(event) =>
                    setPaymentMode(
                      event.target.value === "upi" ? "upi" : "cash"
                    )
                  }
                >
                  <NativeSelectOption value="cash">Cash</NativeSelectOption>
                  <NativeSelectOption value="upi">UPI</NativeSelectOption>
                </NativeSelect>
              </div>
            )}
            <div className="flex justify-end gap-2 md:col-span-2">
              <Button type="button" variant="outline" asChild disabled={saving}>
                <Link to="/appointments" search={{ clinic, date }}>
                  Cancel
                </Link>
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Booking…" : "Book appointment"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
