import { Card, CardContent } from "@/components/ui/card"
import type { PatientTabInfo } from "@/components/VisitTabs"
import type { VisitData } from "./VisitForm"

function diagnosisFor(visit: VisitData): string {
  if (visit.diagnosis.length > 0) return visit.diagnosis.join(", ")
  if (visit.ibsAssessment) return "IBS"
  if (visit.t2dmAssessment) return "T2DM"
  return "No diagnosis"
}

export function PatientOverview({
  patient,
  visits,
}: {
  patient: PatientTabInfo
  visits: VisitData[]
}) {
  const recentVisits = [...visits]
    .sort((a, b) => b.visitDate.localeCompare(a.visitDate))
    .slice(0, 5)

  return (
    <Card>
      <CardContent className="grid gap-4">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1">
            <dt className="text-sm text-muted-foreground">Patient ID</dt>
            <dd className="font-mono text-sm font-medium">{patient.pid}</dd>
          </div>
          <div className="grid gap-1">
            <dt className="text-sm text-muted-foreground">Name</dt>
            <dd className="text-sm font-medium">{patient.fullName}</dd>
          </div>
          <div className="grid gap-1">
            <dt className="text-sm text-muted-foreground">Mobile</dt>
            <dd className="text-sm font-medium">{patient.mobile}</dd>
          </div>
          <div className="grid gap-1">
            <dt className="text-sm text-muted-foreground">Address</dt>
            <dd className="text-sm font-medium">{patient.address ?? "—"}</dd>
          </div>
          <div className="grid gap-1">
            <dt className="text-sm text-muted-foreground">Age</dt>
            <dd className="text-sm font-medium">
              {patient.ageYears != null ? `${patient.ageYears}y` : "—"}
            </dd>
          </div>
          <div className="grid gap-1">
            <dt className="text-sm text-muted-foreground">Gender</dt>
            <dd className="text-sm font-medium capitalize">
              {patient.gender ?? "—"}
            </dd>
          </div>
        </dl>
        {recentVisits.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No visits recorded. Click{" "}
            <span className="font-medium text-foreground">+ Add Visit</span> to
            start recording vitals.
          </p>
        ) : (
          <div className="grid gap-3 border-t pt-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium">Recent visits</h2>
              <span className="text-xs text-muted-foreground">
                {visits.length} recorded
              </span>
            </div>
            <div className="grid gap-2">
              {recentVisits.map((visit) => (
                <div
                  key={visit.id}
                  className="grid gap-1 rounded-md border px-3 py-2 text-sm sm:grid-cols-[auto_1fr_auto_auto]"
                >
                  <span className="font-medium">{visit.label}</span>
                  <span className="text-muted-foreground">
                    {diagnosisFor(visit)}
                  </span>
                  <span>Wt: {visit.weight || "—"}</span>
                  <span>BP: {visit.bloodPressure || "—"}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
