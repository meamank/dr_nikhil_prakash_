import { getRouteApi, Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"

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
  const patientQuery = useQuery({
    queryKey: ["patient", patientId] as const,
    queryFn: async () => {
      const data = await apiGet<{
        patient?: Patient
      }>(`/api/patients/${encodeURIComponent(patientId)}`)
      if (!data?.patient) throw new Error("Patient not found")
      return data.patient
    },
    staleTime: 30_000,
  })
  const patient = patientQuery.data
  const errorMessage = patientQuery.error
    ? patientQuery.error instanceof Error
      ? patientQuery.error.message
      : "Failed to load patient"
    : null

  if (patientQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <FormLoader />
      </div>
    )
  }

  if (errorMessage && !patient) {
    return (
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <p
          role="alert"
          className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {errorMessage}
        </p>
        <Link
          to="/patients"
          className="self-start text-sm underline underline-offset-4"
        >
          ← Back to patients
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      {errorMessage && (
        <p
          role="alert"
          className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {errorMessage}
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

      <Link
        to="/patients"
        className="self-start text-sm underline underline-offset-4"
      >
        ← Back to patients
      </Link>
    </div>
  )
}
