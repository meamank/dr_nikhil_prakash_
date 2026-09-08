import { useState } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { apiPost } from "@/lib/api"

type Clinic = "juran_chhapra" | "bhagwanpur"

function todayIST(): string {
  const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000)
  return ist.toISOString().slice(0, 10)
}

export default function AddAppointmentPage() {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [mobile, setMobile] = useState("")
  const [age, setAge] = useState("")
  const [gender, setGender] = useState("")
  const [clinic, setClinic] = useState<Clinic>("juran_chhapra")
  const [date, setDate] = useState(todayIST())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await apiPost("/api/booking/appointments", {
        patientName: name.trim(),
        address: address.trim() || null,
        mobile: mobile.trim(),
        patientAgeYears: age.trim() === "" ? null : Number(age),
        patientGender: gender || null,
        clinic,
        date,
      })
      toast.success("Appointment added")
      navigate({ to: "/appointments" })
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Add appointment</h1>
          <p className="text-sm text-muted-foreground">
            Book a slot for a walk-in or phone patient.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/appointments">Back to appointments</Link>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appointment details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            <div className="grid grid-cols-2 gap-4 md:col-span-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="add-appointment-clinic">Clinic</Label>
                <NativeSelect
                  id="add-appointment-clinic"
                  className="w-full"
                  value={clinic}
                  onChange={(event) =>
                    setClinic(
                      event.target.value === "bhagwanpur"
                        ? "bhagwanpur"
                        : "juran_chhapra"
                    )
                  }
                >
                  <NativeSelectOption value="juran_chhapra">
                    Juran Chhapra
                  </NativeSelectOption>
                  <NativeSelectOption value="bhagwanpur">
                    Bhagwanpur
                  </NativeSelectOption>
                </NativeSelect>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="add-appointment-date">Date</Label>
                <Input
                  id="add-appointment-date"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="add-appointment-name">Patient name</Label>
              <Input
                id="add-appointment-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="add-appointment-mobile">Mobile</Label>
              <Input
                id="add-appointment-mobile"
                inputMode="numeric"
                value={mobile}
                onChange={(event) => setMobile(event.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="add-appointment-address">Address</Label>
              <Input
                id="add-appointment-address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="add-appointment-age">Age</Label>
              <Input
                id="add-appointment-age"
                type="number"
                min={0}
                max={130}
                value={age}
                onChange={(event) => setAge(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="add-appointment-sex">Sex</Label>
              <NativeSelect
                id="add-appointment-sex"
                className="w-full"
                value={gender}
                onChange={(event) => setGender(event.target.value)}
              >
                <NativeSelectOption value="">Select</NativeSelectOption>
                <NativeSelectOption value="male">Male</NativeSelectOption>
                <NativeSelectOption value="female">Female</NativeSelectOption>
                <NativeSelectOption value="other">Other</NativeSelectOption>
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label>Status</Label>
              <p className="text-sm text-muted-foreground">
                New appointments are recorded as Not Paid.
              </p>
            </div>
            <div className="flex justify-end gap-2 md:col-span-2">
              <Button type="button" variant="outline" asChild disabled={saving}>
                <Link to="/appointments">Cancel</Link>
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
