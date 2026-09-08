import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PatientOverview } from "@/features/patients/components/PatientOverview"
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
  // Local-only visits (no API yet). Lost on refresh — backend wiring
  // comes later when all form fields are added.
  const [visitsState, setVisitsState] = useState<VisitData[]>([])
  const [active, setActive] = useState("overview")

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

  function handleSaveVisit(id: string, values: VisitValues) {
    setVisitsState((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              ...values,
              label: formatVisitLabel(values.visitDate),
              status: "saved" as const,
            }
          : d
      )
    )
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
      <TabsContent value="overview">
        <PatientOverview patient={patient} />
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
