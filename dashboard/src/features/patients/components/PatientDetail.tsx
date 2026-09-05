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
import { FormLoader } from "@/components/FormLoader"
import { VisitTabs } from "@/components/VisitTabs"

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
        <FormLoader />
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

      <VisitTabs />

      <Link to="/patients" className="text-sm underline underline-offset-4">
        ← Back to patients
      </Link>
    </div>
  )
}
