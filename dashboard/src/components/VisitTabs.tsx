import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  ageYears: number | null
  gender: string | null
}

function fmtTabDate(v: string | number): string {
  const d = new Date(typeof v === "number" && v < 1e12 ? v * 1000 : v)
  if (Number.isNaN(d.getTime())) return "—"
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000)
  const dd = String(ist.getUTCDate()).padStart(2, "0")
  const mm = String(ist.getUTCMonth() + 1).padStart(2, "0")
  const yy = String(ist.getUTCFullYear()).slice(2)
  return `${dd}-${mm}-${yy}`
}

function fmtFullDate(v: string | number): string {
  const d = new Date(typeof v === "number" && v < 1e12 ? v * 1000 : v)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export function VisitTabs({
  patient,
  visits,
  onAddVisit,
}: {
  patient: PatientTabInfo
  visits: VisitTabItem[]
  onAddVisit?: () => void
}) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <div className="flex flex-wrap items-center gap-2">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {visits.map((v) => (
            <TabsTrigger key={v.id} value={v.id}>
              {fmtTabDate(v.scheduledAt)}
            </TabsTrigger>
          ))}
        </TabsList>
        {onAddVisit && (
          <Button size="sm" onClick={onAddVisit} className="ml-auto">
            + Add visit
          </Button>
        )}
      </div>
      <TabsContent value="overview">
        <Card>
          <CardHeader>
            <CardTitle>
              {patient.fullName}{" "}
              <span className="font-mono text-sm text-muted-foreground">
                {patient.pid}
              </span>
            </CardTitle>
            <CardDescription>
              {patient.ageYears != null ? `${patient.ageYears}y` : "—"}
              {patient.gender ? ` · ${patient.gender}` : ""} · {patient.mobile}{" "}
              · {visits.length} visit
              {visits.length === 1 ? "" : "s"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {visits.length === 0 ? (
              <p className="text-sm text-muted-foreground">No visits yet.</p>
            ) : (
              <ul className="divide-y">
                {visits.map((v) => (
                  <li
                    key={v.id}
                    className="flex flex-wrap items-center gap-3 py-2.5"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-sm font-extrabold tabular-nums">
                      #{v.queueNumber ?? "—"}
                    </span>
                    <div className="min-w-40 flex-1">
                      <p className="text-sm font-medium">
                        {fmtFullDate(v.scheduledAt)}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {v.clinic.replace("_", " ")}
                      </p>
                    </div>
                    <Badge variant="outline">{v.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      {visits.map((v) => (
        <TabsContent key={v.id} value={v.id}>
          <Card>
            <CardHeader>
              <CardTitle>Visit · {fmtFullDate(v.scheduledAt)}</CardTitle>
              <CardDescription>
                Queue #{v.queueNumber ?? "—"} ·{" "}
                <span className="capitalize">{v.clinic.replace("_", " ")}</span>{" "}
                · {v.status} · {v.paymentStatus}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Vitals, examination and prescription forms for this visit go here.
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  )
}
