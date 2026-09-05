import { useEffect, useState } from "react"
import { getRouteApi, Link } from "@tanstack/react-router"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { apiGet, apiPatch } from "@/lib/api"

const routeApi = getRouteApi("/_authenticated/patients/$patientId")

type Patient = {
  pid: string
  userId: string | null
  fullName: string
  mobile: string
  ageYears: number | null
  gender: string | null
  isFirstLogin: boolean | number
  createdAt: string | number
}

type Visit = {
  id: string
  patientPid: string | null
  clinic: string
  queueNumber: number
  scheduledAt: string | number
  status: string
  paymentStatus: string
}

const STATUS_LABELS: Record<string, string> = {
  not_paid: "Not Paid",
  paid: "Paid",
  in_progress: "In Progress",
  done: "Done",
  cancelled: "Cancelled",
  no_show: "No Show",
}

function fmtDate(v: string | number | null | undefined): string {
  if (v == null) return "—"
  const d = new Date(typeof v === "number" && v < 1e12 ? v * 1000 : v)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export default function PatientDetail() {
  const { patientId } = routeApi.useParams()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Edit state
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState("")
  const [mobile, setMobile] = useState("")
  const [age, setAge] = useState("")
  const [gender, setGender] = useState("")
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await apiGet<{
        patient?: Patient
        appointments?: Visit[]
      }>(`/api/patients/${encodeURIComponent(patientId)}`)
      if (!data?.patient) throw new Error("Patient not found")
      setPatient(data.patient)
      setVisits(data.appointments ?? [])
      setName(data.patient.fullName)
      setMobile(data.patient.mobile)
      setAge(data.patient.ageYears != null ? String(data.patient.ageYears) : "")
      setGender(data.patient.gender ?? "")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load patient")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId])

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const data = await apiPatch<{ patient?: Patient }>(
        `/api/patients/${encodeURIComponent(patientId)}`,
        {
          fullName: name.trim(),
          mobile: mobile.trim(),
          ageYears: age.trim() === "" ? null : Number(age),
          gender: gender || null,
        }
      )
      if (data?.patient) {
        setPatient(data.patient)
        setName(data.patient.fullName)
        setMobile(data.patient.mobile)
        setAge(
          data.patient.ageYears != null ? String(data.patient.ageYears) : ""
        )
        setGender(data.patient.gender ?? "")
      }
      setEditing(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  if (error && !patient) {
    return (
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <p
          role="alert"
          className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
        <Link to="/patients" className="text-sm underline underline-offset-4">
          ← Back to patients
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      {/* Demographics */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            {patient?.pid}{" "}
            {patient?.userId ? (
              <Badge variant="secondary" className="ml-2">
                Portal linked
              </Badge>
            ) : (
              <Badge variant="outline" className="ml-2">
                Not claimed
              </Badge>
            )}
          </CardTitle>
          {!editing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
            >
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditing(false)
                  if (patient) {
                    setName(patient.fullName)
                    setMobile(patient.mobile)
                    setAge(
                      patient.ageYears != null ? String(patient.ageYears) : ""
                    )
                    setGender(patient.gender ?? "")
                  }
                }}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {!editing ? (
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase">
                  Name
                </dt>
                <dd className="font-medium">{patient?.fullName}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase">
                  Mobile
                </dt>
                <dd className="tabular-nums">{patient?.mobile}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase">
                  Age
                </dt>
                <dd className="tabular-nums">
                  {patient?.ageYears != null ? `${patient.ageYears}y` : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase">
                  Gender
                </dt>
                <dd className="capitalize">{patient?.gender ?? "—"}</dd>
              </div>
            </dl>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="pd-name">Name</Label>
                <Input
                  id="pd-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="pd-mobile">Mobile</Label>
                <Input
                  id="pd-mobile"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="pd-age">Age</Label>
                <Input
                  id="pd-age"
                  type="number"
                  min={0}
                  max={130}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="pd-gender">Gender</Label>
                <Select
                  value={gender || "unknown"}
                  onValueChange={(v) => setGender(v === "unknown" ? "" : v)}
                >
                  <SelectTrigger id="pd-gender">
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
          )}
        </CardContent>
      </Card>

      {/* Visit history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Visits ({visits.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {visits.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No visits yet.
            </p>
          ) : (
            <ul className="divide-y">
              {visits.map((v) => (
                <li
                  key={v.id}
                  className="flex flex-wrap items-center gap-3 py-3"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-sm font-extrabold tabular-nums">
                    #{v.queueNumber ?? "—"}
                  </span>
                  <div className="min-w-40 flex-1">
                    <p className="text-sm font-medium">
                      {fmtDate(v.scheduledAt)}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {v.clinic.replace("_", " ")}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {STATUS_LABELS[v.status] ?? v.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Link to="/patients" className="text-sm underline underline-offset-4">
        ← Back to patients
      </Link>
    </div>
  )
}
