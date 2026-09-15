import PatientDetail from "@/features/patients/components/PatientDetail"
import { createFileRoute } from "@tanstack/react-router"
import { patientQueryOptions } from "@/features/patients/patient-queries"

export const Route = createFileRoute("/_authenticated/patients/$patientId")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(patientQueryOptions(params.patientId)),
  component: PatientDetail,
})
