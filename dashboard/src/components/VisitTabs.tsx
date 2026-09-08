import { useEffect, useState } from "react"
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
  const [visitsState, setVisitsState] = useState<VisitData[]>([])
  const [active, setActive] = useState("overview")
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let activeRequest = true
    apiGet<{ visits?: StoredVisit[] }>(
      `/api/patients/${encodeURIComponent(patient.pid)}/visits`
    )
      .then((data) => {
        if (activeRequest) setVisitsState((data.visits ?? []).map(toVisitData))
      })
      .catch((error) => {
        if (activeRequest) {
          setLoadError(
            error instanceof Error ? error.message : "Couldn’t load visits."
          )
        }
      })
    return () => {
      activeRequest = false
    }
  }, [patient.pid])

  function handleAddVisit() {
    onAddVisit?.()
    const today = todayISTDate()
    const id = `new-visit-${Date.now()}`
    setVisitsState((prev) => [
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
    const savedVisit = toVisitData(response.visit)
    setVisitsState((prev) =>
      prev.map((visit) => (visit.id === id ? savedVisit : visit))
    )
    if (active === id) setActive(savedVisit.id)
  }

  // Draft only: discard the tab (accidental-click escape).
  // Saved visits never reach here — their Cancel reverts to the
  // locked view inside VisitForm (Option A), data is kept.
  function handleCancelVisit(id: string) {
    const remaining = visitsState.filter((d) => d.id !== id)
    setVisitsState(remaining)
    if (active === id) {
      setActive(
        remaining.length ? remaining[remaining.length - 1].id : "overview"
      )
    }
  }

  return (
    <Tabs value={active} onValueChange={setActive} className="w-full">
      <div className="flex items-center gap-2">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {visitsState.map((d) => (
            <TabsTrigger key={d.id} value={d.id}>
              {d.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <Button
          size="sm"
          onClick={handleAddVisit}
          className="ml-auto"
        >
          + Add Visit
        </Button>
      </div>
      {loadError && (
        <p role="alert" className="text-sm text-destructive">
          {loadError}
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
