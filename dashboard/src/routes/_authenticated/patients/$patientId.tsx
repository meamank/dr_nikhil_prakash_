import PatientDetail from "@/features/patients/components/PatientDetail"
import { createFileRoute } from "@tanstack/react-router"
import { apiGet } from "@/lib/api"

export const Route = createFileRoute("/_authenticated/patients/$patientId")({
  loader: async ({ params }) =>
    apiGet<{ patient: { pid: string; fullName: string } }>(
      `/api/patients/${encodeURIComponent(params.patientId)}`
    ).catch(() => null),
  component: PatientDetail,
})
