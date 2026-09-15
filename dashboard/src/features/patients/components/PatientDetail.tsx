import { useState } from "react"
import { getRouteApi, Link } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { apiPatch } from "@/lib/api"
import {
  patientKeys,
  patientQueryOptions,
  type Patient,
} from "../patient-queries"
import { FormLoader } from "@/components/FormLoader"
import { VisitTabs } from "@/components/VisitTabs"
import {
  EditPatientSheet,
  type PatientDemographicsPatch,
} from "./EditPatientSheet"

const routeApi = getRouteApi("/_authenticated/patients/$patientId")

export default function PatientDetail() {
  const { patientId } = routeApi.useParams()
  const queryClient = useQueryClient()
  const [editingDemographics, setEditingDemographics] = useState(false)
  const patientQuery = useQuery(patientQueryOptions(patientId))
  const patient = patientQuery.data
  const updatePatientMutation = useMutation({
    mutationFn: (patch: PatientDemographicsPatch) =>
      apiPatch<{ patient: Patient }>(
        `/api/patients/${encodeURIComponent(patientId)}`,
        patch
      ),
    onSuccess: ({ patient: updatedPatient }) => {
      queryClient.setQueryData(patientKeys.detail(patientId), updatedPatient)
      setEditingDemographics(false)
      return queryClient.invalidateQueries({ queryKey: patientKeys.all })
    },
  })
  const requestError = patientQuery.error ?? updatePatientMutation.error
  const errorMessage = requestError
    ? requestError instanceof Error
      ? requestError.message
      : patientQuery.error
        ? "Failed to load patient"
        : "Failed to update patient details"
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
        <>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setEditingDemographics(true)}>
              Edit details
            </Button>
          </div>
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
          <EditPatientSheet
            patient={patient}
            open={editingDemographics}
            onOpenChange={setEditingDemographics}
            onSave={(patch) => updatePatientMutation.mutate(patch)}
            saving={updatePatientMutation.isPending}
          />
        </>
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
