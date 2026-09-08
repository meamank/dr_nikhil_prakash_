import { Card, CardContent } from "@/components/ui/card"
import type { PatientTabInfo } from "@/components/VisitTabs"

export function PatientOverview({ patient }: { patient: PatientTabInfo }) {
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
        <p className="text-sm text-muted-foreground">
          No visit open. Click{" "}
          <span className="font-medium text-foreground">+ Add Visit</span> to
          start recording vitals.
        </p>
      </CardContent>
    </Card>
  )
}
