import { formatClinicalText } from "@repo/shared"
import { Activity, CalendarDays, FlaskConical, Pill } from "lucide-react"
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import type { PatientTabInfo } from "@/components/VisitTabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ibsSummary, t2dmSummary, type VisitData } from "./VisitForm"

const logoForestUrl = new URL(
  "../../../../../web/public/images/logo_forest.svg",
  import.meta.url
).href

type TrendPoint = {
  date: string
  label: string
  value: number
  secondaryValue?: number
  displayValue: string
}

type Trend = {
  key: string
  title: string
  latest: string
  points: TrendPoint[]
}

const trendConfig = {
  value: { label: "Result", color: "var(--primary)" },
  secondaryValue: { label: "Diastolic", color: "var(--chart-2)" },
} satisfies ChartConfig

function displayDate(date: string): string {
  const [year, month, day] = date.split("-")
  return year && month && day ? `${day}-${month}-${year}` : date
}

function prescriptionValidUpto(date: string): string {
  const [year, month, day] = date.split("-").map(Number)
  if (![year, month, day].every(Number.isFinite)) return "—"

  const validUpto = new Date(Date.UTC(year, month - 1, day))
  validUpto.setUTCDate(validUpto.getUTCDate() + 21)
  return displayDate(validUpto.toISOString().slice(0, 10))
}

function shortDate(date: string): string {
  const [, month, day] = date.split("-")
  return month && day ? `${day}/${month}` : date
}

function numericValue(value: string): number | null {
  const match = value.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/)
  if (!match) return null
  const parsed = Number(match[0])
  return Number.isFinite(parsed) ? parsed : null
}

const printChart = {
  width: 200,
  height: 88,
  left: 18,
  right: 18,
  top: 16,
  bottom: 10,
} as const

function PrintTrendChart({ trend }: { trend: Trend }) {
  const domainValues = trend.points.flatMap((point) =>
    point.secondaryValue === undefined
      ? [point.value]
      : [point.value, point.secondaryValue]
  )
  const rawMin = Math.min(...domainValues)
  const rawMax = Math.max(...domainValues)
  const spread = rawMax - rawMin
  const padding = spread > 0 ? spread * 0.18 : Math.max(Math.abs(rawMax) * 0.1, 1)
  const domainMin = rawMin - padding
  const domainMax = rawMax + padding
  const plotWidth = printChart.width - printChart.left - printChart.right
  const plotHeight = printChart.height - printChart.top - printChart.bottom

  const xFor = (index: number) =>
    trend.points.length === 1
      ? printChart.width / 2
      : printChart.left + (index * plotWidth) / (trend.points.length - 1)
  const yFor = (value: number) =>
    printChart.top + ((domainMax - value) / (domainMax - domainMin)) * plotHeight
  const primary = trend.points.map((point, index) => ({
    x: xFor(index),
    y: yFor(point.value),
  }))
  const secondary = trend.points.flatMap((point, index) =>
    point.secondaryValue === undefined
      ? []
      : [
          {
            x: xFor(index),
            y: yFor(point.secondaryValue),
            value: point.secondaryValue,
            pointIndex: index,
          },
        ]
  )
  const polyline = (points: Array<{ x: number; y: number }>) =>
    points.map(({ x, y }) => `${x},${y}`).join(" ")
  const textAnchorFor = (index: number) =>
    index === 0
      ? "start"
      : index === trend.points.length - 1
        ? "end"
        : "middle"

  return (
    <svg
      className="patient-overview-print-chart"
      viewBox={`0 0 ${printChart.width} ${printChart.height}`}
      role="img"
      aria-label={`${trend.title} trend`}
    >
      {[0.25, 0.5, 0.75].map((ratio) => {
        const y = printChart.top + plotHeight * ratio
        return (
          <line
            key={ratio}
            x1={printChart.left}
            x2={printChart.width - printChart.right}
            y1={y}
            y2={y}
            stroke="#d1d5db"
            strokeDasharray="3 3"
            strokeWidth="0.8"
          />
        )
      })}

      {secondary.length > 1 && (
        <polyline
          points={polyline(secondary)}
          fill="none"
          stroke="#6b7280"
          strokeWidth="1.5"
        />
      )}
      <polyline
        points={polyline(primary)}
        fill="none"
        stroke="#0a3e36"
        strokeWidth="1.8"
      />

      {secondary.map(({ x, y, value, pointIndex }) => (
        <g key={`secondary-${trend.points[pointIndex]?.date ?? pointIndex}`}>
          <circle
            cx={x}
            cy={y}
            r="2.4"
            fill="#fff"
            stroke="#6b7280"
            strokeWidth="1.4"
          />
          {trend.key === "blood-pressure" && (
            <text
              x={x}
              y={Math.min(printChart.height - 2, y + 10)}
              textAnchor={textAnchorFor(pointIndex)}
              className="overview-print-chart-value"
            >
              {value}
            </text>
          )}
        </g>
      ))}
      {primary.map(({ x, y }, index) => {
        const point = trend.points[index]
        if (!point) return null

        return (
          <g key={point.date}>
            <circle
              cx={x}
              cy={y}
              r="2.5"
              fill="#fff"
              stroke="#0a3e36"
              strokeWidth="1.5"
            />
            <text
              x={x}
              y={Math.max(9, y - 10)}
              textAnchor={textAnchorFor(index)}
              className="overview-print-chart-value"
            >
              {trend.key === "blood-pressure"
                ? point.value
                : point.displayValue}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function buildTrends(visits: VisitData[]): Trend[] {
  const labTrends = new Map<string, Trend>()
  const chronological = [...visits].sort((a, b) =>
    a.visitDate.localeCompare(b.visitDate)
  )
  const bloodPressure: TrendPoint[] = []
  const weight: TrendPoint[] = []

  chronological.forEach((visit) => {
    const [systolicText, diastolicText] = visit.bloodPressure.split("/")
    const systolicValue = numericValue(systolicText ?? "")
    const diastolicValue = numericValue(diastolicText ?? "")
    if (systolicValue !== null && diastolicValue !== null) {
      bloodPressure.push({
        date: visit.visitDate,
        label: shortDate(visit.visitDate),
        value: systolicValue,
        secondaryValue: diastolicValue,
        displayValue: visit.bloodPressure,
      })
    }

    const weightValue = numericValue(visit.weight)
    if (weightValue !== null) {
      weight.push({
        date: visit.visitDate,
        label: shortDate(visit.visitDate),
        value: weightValue,
        displayValue: visit.weight,
      })
    }

    visit.labReports.forEach((report) => {
      const value = numericValue(report.result)
      if (value === null) return
      const key = report.test.trim().toLocaleUpperCase()
      if (!key) return
      const trend = labTrends.get(key) ?? {
        key: `lab-${key}`,
        title: formatClinicalText(report.test),
        latest: report.result,
        points: [],
      }
      trend.latest = report.result
      trend.points.push({
        date: report.reportDate,
        label: shortDate(report.reportDate),
        value,
        displayValue: report.result,
      })
      labTrends.set(key, trend)
    })
  })

  const result: Trend[] = []
  if (bloodPressure.length) {
    result.push({
      key: "blood-pressure",
      title: "BLOOD PRESSURE",
      latest: bloodPressure.at(-1)?.displayValue ?? "—",
      points: bloodPressure,
    })
  }
  if (weight.length) {
    result.push({
      key: "weight",
      title: "WEIGHT",
      latest: weight.at(-1)?.displayValue ?? "—",
      points: weight,
    })
  }
  labTrends.forEach((trend) => {
    trend.points.sort((a, b) => a.date.localeCompare(b.date))
    trend.latest = trend.points.at(-1)?.displayValue ?? trend.latest
  })
  result.push(...labTrends.values())
  return result.slice(0, 4)
}

function ChiefComplaintsTable({ visits }: { visits: VisitData[] }) {
  const visitsWithComplaints = visits.filter(
    (visit) => visit.chiefComplaint.length > 0
  )

  return (
    <section className="grid gap-2">
      <h3 className="font-heading text-xs font-semibold tracking-wide text-primary uppercase">
        Chief complaints
      </h3>
      {visitsWithComplaints.length > 0 ? (
        <Table containerClassName="subtle-scrollbar">
          <TableBody>
            {visitsWithComplaints.map((visit) => (
              <TableRow key={visit.id}>
                <TableCell className="w-24 min-w-24 font-mono text-xs font-semibold tabular-nums">
                  {displayDate(visit.visitDate)}
                </TableCell>
                <TableCell className="whitespace-normal">
                  <ul className="grid gap-0.5">
                    {visit.chiefComplaint.map((complaint) => (
                      <li key={complaint} className="text-xs wrap-break-word">
                        · {formatClinicalText(complaint)}
                      </li>
                    ))}
                  </ul>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-sm text-muted-foreground">NO DATA RECORDED</p>
      )}
    </section>
  )
}

function PreviousMedicalHistoryTable({ visits }: { visits: VisitData[] }) {
  const visitsWithHistory = visits.filter(
    (visit) => visit.previousMedicalHistory.length > 0
  )

  return (
    <section className="grid gap-2">
      <h3 className="font-heading text-xs font-semibold tracking-wide text-primary uppercase">
        Previous medical history
      </h3>
      {visitsWithHistory.length > 0 ? (
        <Table containerClassName="subtle-scrollbar">
          <TableBody>
            {visitsWithHistory.map((visit) => (
              <TableRow key={visit.id}>
                <TableCell className="w-24 min-w-24 font-mono text-xs font-semibold tabular-nums">
                  {displayDate(visit.visitDate)}
                </TableCell>
                <TableCell className="whitespace-normal">
                  <ul className="grid gap-0.5">
                    {visit.previousMedicalHistory.map((history) => (
                      <li key={history} className="text-xs wrap-break-word">
                        <span className="previous-history-marker">· </span>
                        {formatClinicalText(history)}
                      </li>
                    ))}
                  </ul>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-sm text-muted-foreground">NO DATA RECORDED</p>
      )}
    </section>
  )
}

function DiagnosisTable({ visits }: { visits: VisitData[] }) {
  const visitsWithDiagnosis = visits.filter(
    (visit) => visit.diagnosis.length > 0
  )

  return (
    <section className="grid gap-2">
      <h3 className="font-heading text-xs font-semibold tracking-wide text-primary uppercase">
        Diagnosis
      </h3>
      {visitsWithDiagnosis.length > 0 ? (
        <Table containerClassName="subtle-scrollbar">
          <TableBody>
            {visitsWithDiagnosis.map((visit) => (
              <TableRow key={visit.id}>
                <TableCell className="w-24 min-w-24 font-mono text-xs font-semibold tabular-nums">
                  {displayDate(visit.visitDate)}
                </TableCell>
                <TableCell className="whitespace-normal">
                  <ul className="grid gap-0.5">
                    {visit.diagnosis.map((diagnosis, index) => (
                      <li
                        key={`${diagnosis}-${index}`}
                        className="text-xs wrap-break-word"
                      >
                        <span className="diagnosis-marker">· </span>
                        {formatClinicalText(diagnosis)}
                      </li>
                    ))}
                  </ul>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-sm text-muted-foreground">NO DATA RECORDED</p>
      )}
    </section>
  )
}

function ClinicalRemarksTable({ visits }: { visits: VisitData[] }) {
  const visitsWithRemarks = visits.filter((visit) => visit.remarks.trim())

  return (
    <section className="grid gap-2">
      <h3 className="font-heading text-xs font-semibold tracking-wide text-primary uppercase">
        Clinical remarks
      </h3>
      {visitsWithRemarks.length > 0 ? (
        <Table containerClassName="subtle-scrollbar">
          <TableBody>
            {visitsWithRemarks.map((visit) => (
              <TableRow key={visit.id}>
                <TableCell className="w-24 min-w-24 font-mono text-xs font-semibold tabular-nums">
                  {displayDate(visit.visitDate)}
                </TableCell>
                <TableCell className="text-xs wrap-break-word whitespace-normal">
                  · {formatClinicalText(visit.remarks)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-sm text-muted-foreground">NO DATA RECORDED</p>
      )}
    </section>
  )
}

function TestReportsTable({ visits }: { visits: VisitData[] }) {
  const reports = visits.flatMap((visit) => visit.labReports)
  const dates = [...new Set(reports.map((report) => report.reportDate))].sort(
    (a, b) => b.localeCompare(a)
  )
  const tests = Array.from(
    new Map(
      reports.map((report) => [
        report.test.trim().toLocaleLowerCase(),
        report.test,
      ])
    ).entries()
  )

  return (
    <section className="grid gap-2">
      <h3 className="font-heading text-xs font-semibold tracking-wide text-primary uppercase">
        Test reports
      </h3>
      {reports.length > 0 ? (
        <Table containerClassName="subtle-scrollbar">
          <TableHeader>
            <TableRow>
              <TableHead className="w-24 min-w-24" />
              {dates.map((date) => (
                <TableHead
                  key={date}
                  className="w-24 min-w-24 text-xs font-semibold tabular-nums"
                >
                  {displayDate(date)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tests.map(([testKey, testName]) => (
              <TableRow key={testKey}>
                <TableCell className="w-24 min-w-24 text-xs font-semibold wrap-break-word whitespace-normal">
                  {formatClinicalText(testName)}
                </TableCell>
                {dates.map((date) => {
                  const results = reports
                    .filter(
                      (report) =>
                        report.reportDate === date &&
                        report.test.trim().toLocaleLowerCase() === testKey
                    )
                    .map((report) => formatClinicalText(report.result))

                  return (
                    <TableCell
                      key={date}
                      className="w-24 min-w-24 text-xs wrap-break-word whitespace-pre-line"
                    >
                      {results.join("\n")}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-sm text-muted-foreground">NO DATA RECORDED</p>
      )}
    </section>
  )
}

function VitalsTable({ visits }: { visits: VisitData[] }) {
  const vitals = [
    {
      label: "BP",
      value: (visit: VisitData) => visit.bloodPressure || "—",
    },
    {
      label: "Weight",
      value: (visit: VisitData) => visit.weight || "—",
    },
    {
      label: "Chest/Heart Sound",
      value: (visit: VisitData) =>
        visit.chestHeartSound === "Other"
          ? visit.otherChestHeartSound || "OTHER"
          : formatClinicalText(visit.chestHeartSound),
    },
  ]

  return (
    <section className="grid gap-2">
      <h3 className="font-heading text-xs font-semibold tracking-wide text-primary uppercase">
        Vitals
      </h3>
      <Table containerClassName="subtle-scrollbar">
        <TableHeader>
          <TableRow>
            <TableHead className="w-24 min-w-24" />
            {visits.map((visit) => (
              <TableHead
                key={visit.id}
                className="w-24 min-w-24 text-xs font-semibold tabular-nums"
              >
                {displayDate(visit.visitDate)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {vitals.map((vital) => (
            <TableRow key={vital.label}>
              <TableCell className="w-24 min-w-24 text-xs font-semibold wrap-break-word whitespace-normal">
                {vital.label}
              </TableCell>
              {visits.map((visit) => (
                <TableCell
                  key={visit.id}
                  className="w-24 min-w-24 text-xs wrap-break-word whitespace-normal"
                >
                  {vital.value(visit)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  )
}

function MedicinesTables({ visits }: { visits: VisitData[] }) {
  const visitsWithMedicines = visits.filter(
    (visit) => visit.medicinesPrescribed.length > 0
  )
  const latestVisitWithMedicines = visitsWithMedicines[0]

  if (!latestVisitWithMedicines) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <FlaskConical className="size-4" /> NO MEDICINES RECORDED
      </div>
    )
  }

  return (
    <section className="grid gap-2">
      <p className="font-mono text-xs font-semibold tabular-nums">
        {displayDate(latestVisitWithMedicines.visitDate)}
      </p>
      <Table containerClassName="subtle-scrollbar">
        <TableBody>
          {latestVisitWithMedicines.medicinesPrescribed.map(
            (medicine, index) => (
              <TableRow key={`${medicine.name}-${index}`}>
                <TableCell className="min-w-40 text-xs font-semibold wrap-break-word whitespace-normal">
                  {formatClinicalText(medicine.name)}
                  {medicine.notes && (
                    <p className="mt-0.5 font-mono text-xs font-normal wrap-break-word text-muted-foreground">
                      Notes: {formatClinicalText(medicine.notes)}
                    </p>
                  )}
                </TableCell>
                <TableCell className="w-20 min-w-20 text-xs font-semibold">
                  {medicine.frequency}
                </TableCell>
                <TableCell className="w-20 min-w-20 text-xs font-semibold">
                  {medicine.duration}
                </TableCell>
              </TableRow>
            )
          )}
        </TableBody>
      </Table>
    </section>
  )
}

function TrendCard({ trend }: { trend: Trend }) {
  return (
    <Card className="gap-2 py-4 shadow-none">
      <CardHeader className="flex flex-row items-start justify-between gap-3 px-4">
        <CardTitle className="text-xs font-semibold tracking-wide text-primary uppercase">
          {trend.title}
        </CardTitle>
        <span className="font-mono text-sm font-semibold tabular-nums">
          {formatClinicalText(trend.latest)}
        </span>
      </CardHeader>
      <CardContent className="px-2 pb-0">
        <ChartContainer
          config={trendConfig}
          initialDimension={{ width: 240, height: 112 }}
          className="patient-overview-screen-chart aspect-auto h-28 w-full"
        >
          <LineChart
            data={trend.points}
            margin={{ top: 8, right: 32, bottom: 0, left: -12 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              minTickGap={18}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              domain={
                trend.points.length > 1
                  ? ["auto", "auto"]
                  : ["dataMin - 1", "dataMax + 1"]
              }
              width={36}
            />
            <Tooltip
              cursor={{ stroke: "var(--border)" }}
              content={({ active, payload }) => {
                const point = payload?.[0]?.payload as TrendPoint | undefined
                if (!active || !point) return null
                return (
                  <div className="rounded-lg border bg-background px-2.5 py-2 text-xs shadow-md">
                    <p className="font-medium">{displayDate(point.date)}</p>
                    <p className="font-mono text-muted-foreground">
                      {point.displayValue}
                    </p>
                  </div>
                )
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--color-value)"
              strokeWidth={2}
              dot={{ r: 3, fill: "var(--background)", strokeWidth: 2 }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
            {trend.points.some(
              (point) => point.secondaryValue !== undefined
            ) && (
              <Line
                type="monotone"
                dataKey="secondaryValue"
                stroke="var(--color-secondaryValue)"
                strokeWidth={2}
                dot={{ r: 3, fill: "var(--background)", strokeWidth: 2 }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
            )}
          </LineChart>
        </ChartContainer>
        <PrintTrendChart trend={trend} />
      </CardContent>
    </Card>
  )
}

function DiseaseAssessmentsTable({ visits }: { visits: VisitData[] }) {
  const rows = visits.flatMap((visit) => {
    const assessments: Array<{ type: string; items: string[] }> = []
    if (visit.t2dmAssessment) {
      const items = t2dmSummary(visit.t2dmAssessment)
      if (items.length > 0) assessments.push({ type: "T2DM", items })
    }
    if (visit.ibsAssessment) {
      const items = ibsSummary(visit.ibsAssessment)
      if (items.length > 0) assessments.push({ type: "IBS", items })
    }
    return assessments.map((assessment) => ({
      ...assessment,
      visitId: visit.id,
      visitDate: visit.visitDate,
    }))
  })

  if (rows.length === 0) return null

  return (
    <section className="patient-overview-disease-assessments grid gap-2">
      <h3 className="font-heading text-xs font-semibold tracking-wide text-primary uppercase">
        Disease assessments
      </h3>
      <Table containerClassName="subtle-scrollbar">
        <TableBody>
          {rows.map((row) => (
            <TableRow key={`${row.visitId}-${row.type}`}>
              <TableCell className="w-24 min-w-24 font-mono text-xs font-semibold tabular-nums">
                {displayDate(row.visitDate)}
              </TableCell>
              <TableCell className="text-xs wrap-break-word whitespace-normal">
                <strong>{row.type}:</strong>{" "}
                {row.items.map(formatClinicalText).join(" · ")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  )
}

function ClinicalOverviewCard({
  visits,
  className,
  showAssessments = false,
}: {
  visits: VisitData[]
  className: string
  showAssessments?: boolean
}) {
  return (
    <Card className={`patient-overview-clinical-card ${className}`}>
      <CardContent className="patient-overview-clinical-grid grid gap-8 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="patient-overview-clinical-column grid content-start gap-6">
          <PreviousMedicalHistoryTable visits={visits} />
          <Separator />
          <ChiefComplaintsTable visits={visits} />
          <Separator />
          <VitalsTable visits={visits} />
          <Separator />
          <TestReportsTable visits={visits} />
          <Separator />
          <DiagnosisTable visits={visits} />
          <Separator />
          <ClinicalRemarksTable visits={visits} />
          {showAssessments && <DiseaseAssessmentsTable visits={visits} />}
        </div>

        <section className="patient-overview-medicines grid content-start gap-3 lg:border-l lg:pl-8">
          <div className="flex items-center gap-2 border-b pb-3">
            <Pill className="size-4 text-primary" />
            <h3 className="font-heading text-sm font-semibold tracking-wide text-primary uppercase">
              Prescribed medicines
            </h3>
          </div>
          <MedicinesTables visits={visits} />
        </section>
      </CardContent>
    </Card>
  )
}

export function PatientOverview({
  patient,
  visits,
}: {
  patient: PatientTabInfo
  visits: VisitData[]
}) {
  const savedVisits = visits
    .filter((visit) => visit.status === "saved")
    .sort((a, b) => b.visitDate.localeCompare(a.visitDate))
  const printVisits = savedVisits.slice(0, 3)
  const latestVisit = savedVisits[0]
  const printPrescriptionVisit = printVisits.find(
    (visit) => visit.medicinesPrescribed.length > 0
  )
  const trends = buildTrends(savedVisits)
  const printTrends = buildTrends(printVisits)

  return (
    <div className="patient-overview-content grid gap-4">
      <OverviewPrintHeader />
      <Card className="patient-overview-patient-card gap-0 overflow-hidden py-0">
        <CardContent className="p-4">
          <div className="patient-overview-facts grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            <PatientFact
              className="overview-print-patient-name"
              label="Patient name"
              value={patient.fullName}
            />
            <PatientFact label="Patient ID" value={patient.pid} mono accent />
            <PatientFact
              label="Age / Sex"
              value={`${patient.ageYears != null ? `${patient.ageYears} YRS` : "—"} / ${patient.gender ? formatClinicalText(patient.gender) : "—"}`}
            />
            <PatientFact
              label="Latest visit"
              value={
                latestVisit ? displayDate(latestVisit.visitDate) : "NO VISITS"
              }
            />
            <PatientFact label="Mobile" value={patient.mobile || "—"} />

            <PatientFact
              className="overview-print-patient-address"
              label="Address"
              value={
                patient.address ? formatClinicalText(patient.address) : "—"
              }
            />
            <PatientFact
              className="overview-print-only"
              label="Weight"
              value={printPrescriptionVisit?.weight || "—"}
            />
            <PatientFact
              className="overview-print-only"
              label="Valid Upto"
              value={
                printPrescriptionVisit
                  ? prescriptionValidUpto(printPrescriptionVisit.visitDate)
                  : "—"
              }
            />
          </div>
        </CardContent>
      </Card>

      {!latestVisit ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <CalendarDays className="size-8 text-muted-foreground" />
            <p className="font-medium">NO VISITS RECORDED</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Click + Add Visit to record clinical details. Saved visits will be
              summarized here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <section
            className={`patient-overview-trends-section grid gap-3${printVisits.length === 1 ? " patient-overview-print-no-trends" : ""}`}
          >
            <div className="overview-print-trends-heading flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              <h2 className="font-heading text-sm font-semibold tracking-wide uppercase">
                Clinical trends
              </h2>
            </div>
            <div className="patient-overview-screen-trends">
              {trends.length ? (
                <div className="patient-overview-trends grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {trends.map((trend) => (
                    <TrendCard key={trend.key} trend={trend} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-6 text-sm text-muted-foreground">
                    ADD NUMERIC LAB RESULTS OR VITALS TO SEE TRENDS.
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="patient-overview-print-trends">
              {printTrends.length ? (
                <div className="patient-overview-trends grid gap-3">
                  {printTrends.map((trend) => (
                    <TrendCard key={trend.key} trend={trend} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-6 text-sm text-muted-foreground">
                    ADD NUMERIC LAB RESULTS OR VITALS TO SEE TRENDS.
                  </CardContent>
                </Card>
              )}
            </div>
          </section>

          <ClinicalOverviewCard
            visits={savedVisits}
            className="patient-overview-screen-clinical-card"
          />
          <ClinicalOverviewCard
            visits={printVisits}
            className="patient-overview-print-clinical-card"
            showAssessments
          />
          <footer className="overview-print-footer">
            Valid for 21 days only
          </footer>
        </>
      )}
    </div>
  )
}

function OverviewPrintHeader() {
  return (
    <header className="overview-print-header">
      <section className="overview-print-doctor overview-print-doctor-english">
        <h1>Dr. (Maj) Nikhil Prakash</h1>
        <div>
          <p>M.B.B.S. (AFMC),</p>
          <p>M.D. Medicine (R &amp; R Delhi)</p>
          <p>MCI Reg. 36462</p>
        </div>
        <strong>CONSULTANT PHYSICIAN</strong>
      </section>

      <section className="overview-print-clinic">
        <img src={logoForestUrl} alt="Dr. Nikhil Prakash logo" />
        <strong>CLINIC :</strong>
        <p>
          Juran Chapra, Road No.-3,
          <br />
          Near SBI Bank, Muzaffarpur
        </p>
      </section>

      <section
        className="overview-print-doctor overview-print-doctor-hindi"
        lang="hi"
      >
        <h1>डॉ. (मेजर) निखिल प्रकाश</h1>
        <div>
          <p>एम.बी.बी.एस. (ए.एफ.एम.सी.)</p>
          <p>एम.डी. मेडिसीन (रिसर्च एण्ड रेफरल, दिल्ली)</p>
        </div>
        <strong>कन्सल्टेन्ट फिजिशियन</strong>
      </section>
    </header>
  )
}

function PatientFact({
  label,
  value,
  mono = false,
  accent = false,
  className,
}: {
  label: string
  value: string
  mono?: boolean
  accent?: boolean
  className?: string
}) {
  return (
    <div className={className}>
      <p className="text-xs font-medium text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={`mt-1 text-sm ${mono ? "font-extrabold" : "font-semibold"} ${mono ? "font-mono" : ""} ${accent ? "text-primary" : ""}`}
      >
        {value}
      </p>
    </div>
  )
}
