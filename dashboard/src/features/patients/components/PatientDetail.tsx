import { useEffect, useState } from "react"
import { getRouteApi, Link } from "@tanstack/react-router"

import { apiGet } from "@/lib/api"
import { FormLoader } from "@/components/FormLoader"
import { VisitTabs } from "@/components/VisitTabs"

const routeApi = getRouteApi("/_authenticated/patients/$patientId")

type Patient = {
  pid: string
  userId: string | null
  fullName: string
  mobile: string
  address: string | null
  ageYears: number | null
  gender: string | null
  isFirstLogin: boolean | number
  createdAt: string | number
}

export default function PatientDetail() {
  const { patientId } = routeApi.useParams()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await apiGet<{
        patient?: Patient
      }>(`/api/patients/${encodeURIComponent(patientId)}`)
      if (!data?.patient) throw new Error("Patient not found")
      setPatient(data.patient)
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

      {patient && (
        <VisitTabs
          patient={{
            pid: patient.pid,
            fullName: patient.fullName,
            mobile: patient.mobile,
            address: patient.address,
            ageYears: patient.ageYears,
            gender: patient.gender,
          }}
        />
      )}

      <Link to="/patients" className="text-sm underline underline-offset-4">
        ← Back to patients
      </Link>
    </div>
  )
}
