import { useEffect, useState } from "react"
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PatientOverview } from "@/features/patients/components/PatientOverview"
import { apiGet, apiPatch, apiPost } from "@/lib/api"
import {
  VisitForm,
  type VisitData,
  type VisitValues,
} from "@/features/patients/components/VisitForm"

export type VisitTabItem = {
  id: string
  queueNumber: number | null
  scheduledAt: string | number
  clinic: string
  status: string
  paymentStatus: string
}

export type PatientTabInfo = {
  pid: string
  fullName: string
  mobile: string
  address: string | null
  ageYears: number | null
  gender: string | null
}

function todayISTDate(): string {
  const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000)
  return ist.toISOString().slice(0, 10)
}

function formatVisitLabel(visitDate: string): string {
  const [year, month, day] = visitDate.split("-")
  if (!year || !month || !day) return visitDate
  return `${day}-${month}-${year.slice(-2)}`
}

type StoredVisit = {
  id: string
  visitDate: string
  details: VisitValues
}

function toVisitData(visit: StoredVisit): VisitData {
  return {
    ...visit.details,
    id: visit.id,
    visitDate: visit.visitDate,
    label: formatVisitLabel(visit.visitDate),
    status: "saved",
  }
}

function visitQueryKey(pid: string) {
  return ["patient", pid, "visits"] as const
}

export function VisitTabs({
  patient,
  onAddVisit,
}: {
  patient: PatientTabInfo
  // Kept optional for backwards-compat: backend appointments are NOT
  // auto-rendered as tabs — the profile starts with Overview only.
  visits?: VisitTabItem[]
  onAddVisit?: () => void
}) {
  const queryClient = useQueryClient()
  const [draftVisits, setDraftVisits] = useState<VisitData[]>([])
  const [active, setActive] = useState("overview")
  const key = visitQueryKey(patient.pid)
  const visitsQuery = useQuery({
    queryKey: key,
    queryFn: async () => {
      const data = await apiGet<{ visits?: StoredVisit[] }>(
        `/api/patients/${encodeURIComponent(patient.pid)}/visits`
      )
      return (data.visits ?? []).map(toVisitData)
    },
    staleTime: 30_000,
    // Do not replace data while a clinician is entering an active visit.
    refetchOnWindowFocus: false,
  })
  const savedVisits = visitsQuery.data ?? []
  const visitsState = [...savedVisits, ...draftVisits]

  useEffect(() => {
    setDraftVisits([])
    setActive("overview")
  }, [patient.pid])

  const saveVisitMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: VisitValues }) => {
      const isNewVisit = id.startsWith("new-visit-")
      const response = isNewVisit
        ? await apiPost<{ visit: StoredVisit }>(
            `/api/patients/${encodeURIComponent(patient.pid)}/visits`,
            values
          )
        : await apiPatch<{ visit: StoredVisit }>(
            `/api/patients/${encodeURIComponent(patient.pid)}/visits/${encodeURIComponent(id)}`,
            values
          )
      return { id, savedVisit: toVisitData(response.visit) }
    },
    onSuccess: ({ id, savedVisit }) => {
      queryClient.setQueryData<VisitData[]>(key, (current = []) => {
        const existingIndex = current.findIndex((visit) => visit.id === id)
        if (existingIndex === -1) return [...current, savedVisit]
        return current.map((visit) =>
          visit.id === id ? savedVisit : visit
        )
      })
      setDraftVisits((current) => current.filter((visit) => visit.id !== id))
      setActive((current) => (current === id ? savedVisit.id : current))
      void queryClient.invalidateQueries({ queryKey: key })
    },
  })

  function handleAddVisit() {
    onAddVisit?.()
    const today = todayISTDate()
    const id = `new-visit-${Date.now()}`
    setDraftVisits((prev) => [
      ...prev,
      {
        id,
        label: formatVisitLabel(today),
        visitDate: today,
        bloodPressure: "",
        weight: "",
        chestHeartSound: "Normal",
        otherChestHeartSound: "",
        chiefComplaint: [],
        previousMedicalHistory: [],
        diagnosis: [],
        labReports: [],
        medicinesPrescribed: [],
        remarks: "",
        t2dmAssessment: null,
        ibsAssessment: null,
        status: "draft",
      },
    ])
    setActive(id)
  }

  async function handleSaveVisit(id: string, values: VisitValues) {
    await saveVisitMutation.mutateAsync({ id, values })
  }

  // Draft only: discard the tab (accidental-click escape).
  // Saved visits never reach here — their Cancel reverts to the
  // locked view inside VisitForm (Option A), data is kept.
  function handleCancelVisit(id: string) {
    const remaining = visitsState.filter((d) => d.id !== id)
    setDraftVisits((current) => current.filter((visit) => visit.id !== id))
    if (active === id) {
      setActive(
        remaining.length ? remaining[remaining.length - 1].id : "overview"
      )
    }
  }

  return (
    <Tabs value={active} onValueChange={setActive} className="w-full">
      <div className="flex items-center gap-2">
        <div className="no-scrollbar min-w-0 flex-1 overflow-x-auto overflow-y-hidden">
          <TabsList className="w-max min-w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {visitsState.map((d) => (
              <TabsTrigger key={d.id} value={d.id}>
                {d.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <Button
          size="sm"
          onClick={handleAddVisit}
          className="shrink-0"
        >
          + Add Visit
        </Button>
      </div>
      {visitsQuery.error && (
        <p role="alert" className="text-sm text-destructive">
          {visitsQuery.error instanceof Error
            ? visitsQuery.error.message
            : "Couldn’t load visits."}
        </p>
      )}
      <TabsContent value="overview">
        <PatientOverview patient={patient} visits={visitsState} />
      </TabsContent>
      {visitsState.map((d) => (
        <TabsContent key={d.id} value={d.id}>
          <VisitForm
            visit={d}
            onSave={(values) => handleSaveVisit(d.id, values)}
            onCancel={() => handleCancelVisit(d.id)}
          />
        </TabsContent>
      ))}
    </Tabs>
  )
}
