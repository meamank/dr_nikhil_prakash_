import { formatClinicalText } from "@repo/shared"
import { useState } from "react"
import { Combobox } from "@/components/Combobox"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatClinicalInput } from "@/lib/clinical-input"
import { IbsAssessmentForm } from "./assessments/IbsAssessmentForm"
import { LabReportsInput, type LabReport } from "./LabReportsInput"
import { MedicinesInput, type Medicine } from "./MedicinesInput"
import { T2dmAssessmentForm } from "./assessments/T2dmAssessmentForm"
import {
  emptyIbsAssessment,
  emptyT2dmAssessment,
  type IbsAssessment,
  type T2dmAssessment,
} from "./visit-form.types"

const soundOptions = ["Normal", "Wheeze", "Rhonci", "Creps", "Other"] as const

const clinicalOptionFields = [
  {
    key: "chiefComplaint",
    label: "Chief complaint",
    endpoint: "/api/chief-complaints",
    placeholder: "Type or select complaints",
    optionsKey: "complaints",
    optionKey: "complaint",
  },
  {
    key: "previousMedicalHistory",
    label: "Previous Medical History",
    endpoint: "/api/clinical-options/previous-medical-history",
    placeholder: "Type or select medical history",
    optionsKey: "options",
    optionKey: "option",
  },
] as const

const diagnosisField = {
  endpoint: "/api/clinical-options/diagnosis",
  optionsKey: "options",
  optionKey: "option",
} as const

const ibsCheckboxLabels: { key: keyof IbsAssessment; label: string }[] = [
  { key: "romePainWeekly", label: "Abdominal pain ≥1 day/week" },
  { key: "romeDefecationRelated", label: "Pain related to defecation" },
  { key: "romeStoolChange", label: "Change in stool frequency or form" },
  { key: "romeDurationSixMonths", label: "Symptoms for ≥6 months" },
  { key: "redFlagWeightLoss", label: "Unintentional weight loss" },
  { key: "redFlagBleeding", label: "GI bleeding" },
  { key: "redFlagIronDeficiencyAnemia", label: "Iron deficiency anemia" },
  { key: "redFlagFever", label: "Fever" },
  { key: "redFlagNocturnalSymptoms", label: "Nocturnal symptoms" },
  { key: "redFlagOnsetAfter50", label: "Onset after age 50" },
  { key: "redFlagFamilyHistory", label: "Family history of CRC / IBD" },
  { key: "missedWork", label: "Missed work" },
  { key: "avoidsTravelOrSocial", label: "Avoids travel or social activities" },
  { key: "toiletAnxiety", label: "Toilet anxiety" },
  { key: "dominatesDailyThinking", label: "Dominates daily thinking" },
  { key: "anxietySymptoms", label: "Current anxiety symptoms" },
  { key: "lowMoodOrDepression", label: "Low mood or depression" },
]

const bristolLabels: Record<
  Exclude<IbsAssessment["bristolStoolType"], "">,
  string
> = {
  "1": "Bristol 1: Separate hard lumps",
  "2": "Bristol 2: Sausage-shaped but lumpy",
  "3": "Bristol 3: Sausage with cracks",
  "4": "Bristol 4: Smooth, soft sausage or snake",
  "5": "Bristol 5: Soft blobs with clear-cut edges",
  "6": "Bristol 6: Mushy pieces with rugged edges",
  "7": "Bristol 7: Watery, no solid pieces",
}

function t2dmSummary(value: T2dmAssessment): string[] {
  const entries: string[] = []
  if (value.symptomsDuration)
    entries.push(`Duration of symptoms: ${value.symptomsDuration}`)
  const checkedLabels: Array<
    [Exclude<keyof T2dmAssessment, "symptomsDuration">, string]
  > = [
    ["polyuria", "Polyuria"],
    ["polydipsia", "Polydipsia"],
    ["polyphagia", "Polyphagia"],
    ["unexplainedWeightLoss", "Weight loss"],
    ["blurredVision", "Blurred vision"],
    ["fatigueOrLethargy", "Fatigue / lethargy"],
    ["age35OrOlder", "Age ≥35 years"],
    ["overweightOrObese", "Overweight or obese"],
    ["highRiskEthnicity", "High-risk race/ethnicity"],
    ["firstDegreeRelative", "First-degree relative with diabetes"],
    ["historyOfCvd", "History of CVD"],
    ["hypertension", "Hypertension"],
    ["historyOfGdm", "History of GDM"],
    ["pcos", "PCOS"],
    ["physicalInactivity", "Physical inactivity"],
    ["fruityBreathOdor", "Fruity breath odor"],
    ["kussmaulRespirations", "Kussmaul respirations"],
    ["intractableNauseaVomiting", "Intractable nausea/vomiting"],
    ["alteredMentalStatus", "Altered mental status"],
    ["neuropathicSymptoms", "Neuropathic symptoms"],
    ["footComplications", "Foot complications"],
    ["visionChangesOrFloaters", "Vision changes / floaters"],
    ["exertionalChestPainOrSob", "Exertional chest pain / SOB"],
  ]
  entries.push(
    ...checkedLabels.filter(([key]) => value[key]).map(([, label]) => label)
  )
  return entries
}

function ibsSummary(value: IbsAssessment): string[] {
  const entries = ibsCheckboxLabels
    .filter(({ key }) => value[key] === true)
    .map(({ label }) => label)
  if (value.bristolStoolType)
    entries.push(bristolLabels[value.bristolStoolType])
  if (value.subtype) entries.push(`Subtype: ${value.subtype}`)
  const scores: Array<[string, number]> = [
    ["Pain severity", value.painSeverity],
    ["Pain frequency", value.painFrequency],
    ["Bloating", value.bloating],
    ["Bowel dissatisfaction", value.bowelDissatisfaction],
    ["Life interference", value.lifeInterference],
  ]
  scores.forEach(([label, score]) => {
    if (score) entries.push(`${label}: ${score}/100`)
  })
  return entries
}

function inferredDiagnoses(value: {
  t2dmAssessment: T2dmAssessment | null
  ibsAssessment: IbsAssessment | null
}): string[] {
  return [
    value.t2dmAssessment && hasT2dmAnswers(value.t2dmAssessment)
      ? "T2DM"
      : null,
    value.ibsAssessment && hasIbsAnswers(value.ibsAssessment) ? "IBS" : null,
  ].filter((diagnosis): diagnosis is string => diagnosis !== null)
}

function displayDiagnoses(value: {
  diagnosis: string[]
  t2dmAssessment: T2dmAssessment | null
  ibsAssessment: IbsAssessment | null
}): string[] {
  return value.diagnosis.length > 0 ? value.diagnosis : inferredDiagnoses(value)
}

export type VisitData = {
  id: string
  label: string
  visitDate: string
  bloodPressure: string
  weight: string
  chestHeartSound: (typeof soundOptions)[number]
  otherChestHeartSound: string
  chiefComplaint: string[]
  previousMedicalHistory: string[]
  diagnosis: string[]
  labReports: LabReport[]
  medicinesPrescribed: Medicine[]
  remarks: string
  t2dmAssessment: T2dmAssessment | null
  ibsAssessment: IbsAssessment | null
  status: "draft" | "saved"
}

export type VisitValues = Omit<VisitData, "id" | "label" | "status">

function displayDate(date: string): string {
  const [year, month, day] = date.split("-")
  return year && month && day ? `${day}-${month}-${year}` : date
}

function VisitItemsTable({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="grid gap-2">
      <h3 className="font-heading text-xs font-semibold tracking-wide text-primary uppercase">
        {title}
      </h3>
      {items.length ? (
        <Table containerClassName="subtle-scrollbar">
          <TableBody>
            <TableRow>
              <TableCell className="whitespace-normal">
                <ul className="grid gap-0.5">
                  {items.map((item, index) => (
                    <li
                      key={`${item}-${index}`}
                      className="text-xs wrap-break-word"
                    >
                      · {formatClinicalText(item)}
                    </li>
                  ))}
                </ul>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      ) : (
        <p className="text-sm text-muted-foreground">NO DATA RECORDED</p>
      )}
    </section>
  )
}

function VisitVitalsTable({ visit }: { visit: VisitData }) {
  const vitals = [
    ["BP", visit.bloodPressure || "—"],
    ["Weight", visit.weight || "—"],
    [
      "Chest/Heart Sound",
      visit.chestHeartSound === "Other"
        ? visit.otherChestHeartSound || "OTHER"
        : formatClinicalText(visit.chestHeartSound),
    ],
  ]

  return (
    <section className="grid gap-2">
      <h3 className="font-heading text-xs font-semibold tracking-wide text-primary uppercase">
        Vitals
      </h3>
      <Table containerClassName="subtle-scrollbar">
        <TableBody>
          {vitals.map(([label, value]) => (
            <TableRow key={label}>
              <TableCell className="w-24 min-w-24 text-xs font-semibold wrap-break-word whitespace-normal">
                {label}
              </TableCell>
              <TableCell className="w-24 min-w-24 text-xs wrap-break-word whitespace-normal">
                {value}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  )
}

function VisitTestReportsTable({ visit }: { visit: VisitData }) {
  const dates = [
    ...new Set(visit.labReports.map((report) => report.reportDate)),
  ].sort((a, b) => b.localeCompare(a))
  const tests = Array.from(
    new Map(
      visit.labReports.map((report) => [
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
      {visit.labReports.length ? (
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
                  const results = visit.labReports
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

function VisitMedicinesTable({ visit }: { visit: VisitData }) {
  return (
    <section className="grid gap-2">
      {visit.medicinesPrescribed.length ? (
        <Table containerClassName="subtle-scrollbar">
          <TableBody>
            {visit.medicinesPrescribed.map((medicine, index) => (
              <TableRow key={`${medicine.name}-${index}`}>
                <TableCell className="min-w-40 text-xs font-semibold wrap-break-word whitespace-normal">
                  {formatClinicalText(medicine.name)}
                  {medicine.notes && (
                    <p className="mt-0.5 font-mono text-xs font-normal wrap-break-word text-muted-foreground">
                      Notes: {formatClinicalText(medicine.notes)}
                    </p>
                  )}
                </TableCell>
                <TableCell className="w-20 min-w-20 text-xs">
                  {medicine.frequency}
                </TableCell>
                <TableCell className="w-20 min-w-20 text-xs">
                  {medicine.duration}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-sm text-muted-foreground">NO MEDICINES RECORDED</p>
      )}
    </section>
  )
}

function getVisitValues(visit: VisitData): VisitValues {
  return {
    visitDate: visit.visitDate,
    bloodPressure: formatClinicalText(visit.bloodPressure),
    weight: formatClinicalText(visit.weight),
    chestHeartSound: visit.chestHeartSound,
    otherChestHeartSound: formatClinicalText(visit.otherChestHeartSound),
    chiefComplaint: visit.chiefComplaint.map(formatClinicalText),
    previousMedicalHistory:
      visit.previousMedicalHistory.map(formatClinicalText),
    diagnosis: visit.diagnosis.map(formatClinicalText),
    labReports: visit.labReports.map((report) => ({
      test: formatClinicalText(report.test),
      result: formatClinicalText(report.result),
      reportDate: report.reportDate,
    })),
    medicinesPrescribed: visit.medicinesPrescribed.map((medicine) => ({
      name: formatClinicalText(medicine.name),
      frequency: medicine.frequency,
      duration: formatClinicalText(medicine.duration),
      notes: formatClinicalText(medicine.notes),
    })),
    remarks: formatClinicalText(visit.remarks),
    t2dmAssessment: visit.t2dmAssessment ? { ...visit.t2dmAssessment } : null,
    ibsAssessment: visit.ibsAssessment ? { ...visit.ibsAssessment } : null,
  }
}

function hasT2dmAnswers(value: T2dmAssessment): boolean {
  return (
    value.symptomsDuration !== "" ||
    Object.values(value).some((field) => field === true)
  )
}

function hasIbsAnswers(value: IbsAssessment): boolean {
  return (
    Object.values(value).some((field) => field === true) ||
    value.bristolStoolType !== "" ||
    value.subtype !== "" ||
    value.painSeverity !== 0 ||
    value.painFrequency !== 0 ||
    value.bloating !== 0 ||
    value.bowelDissatisfaction !== 0 ||
    value.lifeInterference !== 0
  )
}

export function VisitForm({
  visit,
  onSave,
  onCancel,
}: {
  visit: VisitData
  onSave: (values: VisitValues) => void | Promise<void>
  onCancel: () => void
}) {
  const [pendingOptionCount, setPendingOptionCount] = useState(0)
  const [confirmRemoveT2dm, setConfirmRemoveT2dm] = useState(false)
  const [confirmRemoveIbs, setConfirmRemoveIbs] = useState(false)
  const [pendingAssessment, setPendingAssessment] = useState<
    "t2dm" | "ibs" | null
  >(null)
  const [isEditing, setIsEditing] = useState(visit.status === "draft")
  const [draft, setDraft] = useState<VisitValues>(() => getVisitValues(visit))
  const [savingVisit, setSavingVisit] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const handlePendingChange = (pending: boolean) =>
    setPendingOptionCount((count) => Math.max(0, count + (pending ? 1 : -1)))

  function updateT2dmAssessment(patch: Partial<T2dmAssessment>) {
    setDraft((prev) => ({
      ...prev,
      t2dmAssessment: prev.t2dmAssessment
        ? { ...prev.t2dmAssessment, ...patch }
        : null,
    }))
  }

  function updateIbsAssessment(patch: Partial<IbsAssessment>) {
    setDraft((prev) => ({
      ...prev,
      ibsAssessment: prev.ibsAssessment
        ? { ...prev.ibsAssessment, ...patch }
        : null,
    }))
  }

  function addAssessment(next: "t2dm" | "ibs") {
    const existingHasAnswers =
      (draft.t2dmAssessment && hasT2dmAnswers(draft.t2dmAssessment)) ||
      (draft.ibsAssessment && hasIbsAnswers(draft.ibsAssessment))
    if (
      (next === "t2dm" && draft.ibsAssessment) ||
      (next === "ibs" && draft.t2dmAssessment)
    ) {
      if (existingHasAnswers) {
        setPendingAssessment(next)
      } else {
        replaceAssessment(next)
      }
      return
    }
    if (next === "t2dm") {
      setDraft((prev) => ({ ...prev, t2dmAssessment: emptyT2dmAssessment() }))
    } else {
      setDraft((prev) => ({ ...prev, ibsAssessment: emptyIbsAssessment() }))
    }
  }

  function replaceAssessment(next: "t2dm" | "ibs") {
    setDraft((prev) => ({
      ...prev,
      t2dmAssessment: next === "t2dm" ? emptyT2dmAssessment() : null,
      ibsAssessment: next === "ibs" ? emptyIbsAssessment() : null,
    }))
    setPendingAssessment(null)
  }

  async function handleSave() {
    if (!draft.weight.trim()) {
      setSaveError("Enter the patient's weight before saving.")
      document.getElementById(`${visit.id}-weight`)?.focus()
      return
    }
    const assessmentDiagnoses = inferredDiagnoses(draft)
    const valuesToSave =
      draft.diagnosis.length === 0 && assessmentDiagnoses.length > 0
        ? { ...draft, diagnosis: assessmentDiagnoses }
        : draft
    setSavingVisit(true)
    setSaveError(null)
    try {
      await onSave(valuesToSave)
      setIsEditing(false)
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Couldn’t save visit."
      )
    } finally {
      setSavingVisit(false)
    }
  }

  function handleCancel() {
    if (visit.status === "draft") {
      onCancel()
      return
    }
    setDraft(getVisitValues(visit))
    setIsEditing(false)
  }

  if (!isEditing) {
    return (
      <div className="grid gap-4">
        <Card className="gap-0 overflow-hidden py-0">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Visit date
              </p>
              <p className="mt-1 font-mono text-sm font-semibold tabular-nums">
                {displayDate(visit.visitDate)}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid gap-8 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <div className="grid content-start gap-6">
              <VisitItemsTable
                title="Previous medical history"
                items={visit.previousMedicalHistory}
              />
              <VisitItemsTable
                title="Chief complaints"
                items={visit.chiefComplaint}
              />
              <VisitVitalsTable visit={visit} />
              <VisitTestReportsTable visit={visit} />
              <VisitItemsTable
                title="Diagnosis"
                items={displayDiagnoses(visit)}
              />
              <VisitItemsTable
                title="Clinical remarks"
                items={visit.remarks.trim() ? [visit.remarks] : []}
              />
              {visit.t2dmAssessment &&
                t2dmSummary(visit.t2dmAssessment).length > 0 && (
                  <VisitItemsTable
                    title="T2DM assessment"
                    items={t2dmSummary(visit.t2dmAssessment)}
                  />
                )}
              {visit.ibsAssessment &&
                ibsSummary(visit.ibsAssessment).length > 0 && (
                  <VisitItemsTable
                    title="IBS assessment"
                    items={ibsSummary(visit.ibsAssessment)}
                  />
                )}
            </div>

            <section className="grid content-start gap-3 lg:border-l lg:pl-8">
              <h3 className="font-heading text-sm font-semibold tracking-wide text-primary uppercase">
                Prescribed medicines
              </h3>
              <VisitMedicinesTable visit={visit} />
            </section>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Card>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor={`${visit.id}-date`}>Visit date</Label>
            <Input
              id={`${visit.id}-date`}
              type="date"
              value={draft.visitDate}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, visitDate: event.target.value }))
              }
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${visit.id}-weight`}>Weight</Label>
            <Input
              id={`${visit.id}-weight`}
              placeholder="70 kg"
              value={draft.weight}
              autoFocus
              required
              aria-required="true"
              onChange={(event) => {
                const weight = formatClinicalInput(event.currentTarget)
                setDraft((prev) => ({ ...prev, weight }))
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${visit.id}-bp`}>Blood pressure</Label>
            <Input
              id={`${visit.id}-bp`}
              placeholder="120/80"
              value={draft.bloodPressure}
              onChange={(event) => {
                const value = formatClinicalInput(event.currentTarget)
                setDraft((prev) => ({
                  ...prev,
                  bloodPressure:
                    /^\d{3}$/.test(value) &&
                    value.length > prev.bloodPressure.length
                      ? `${value}/`
                      : value,
                }))
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${visit.id}-chest-heart-sound`}>
              Chest/Heart Sound
            </Label>
            <NativeSelect
              id={`${visit.id}-chest-heart-sound`}
              className="w-full"
              value={draft.chestHeartSound}
              onChange={(event) => {
                const sound = soundOptions.find(
                  (option) => option === event.target.value
                )
                if (sound)
                  setDraft((prev) => ({ ...prev, chestHeartSound: sound }))
              }}
            >
              {soundOptions.map((sound) => (
                <NativeSelectOption key={sound} value={sound}>
                  {formatClinicalText(sound)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          {draft.chestHeartSound === "Other" && (
            <div className="grid gap-2">
              <Label htmlFor={`${visit.id}-other-sound`}>
                Other chest/heart sound
              </Label>
              <Input
                id={`${visit.id}-other-sound`}
                placeholder="Describe the chest/heart sound"
                value={draft.otherChestHeartSound}
                onChange={(event) => {
                  const otherChestHeartSound = formatClinicalInput(
                    event.currentTarget
                  )
                  setDraft((prev) => ({ ...prev, otherChestHeartSound }))
                }}
              />
            </div>
          )}
          {clinicalOptionFields.map(
            ({ key, label, endpoint, placeholder, optionsKey, optionKey }) => (
              <div key={key} className="grid gap-2">
                <Combobox
                  id={`${visit.id}-${key}`}
                  label={label}
                  value={draft[key]}
                  onChange={(options) =>
                    setDraft((prev) => ({ ...prev, [key]: options }))
                  }
                  onPendingChange={handlePendingChange}
                  endpoint={endpoint}
                  placeholder={placeholder}
                  optionsKey={optionsKey}
                  optionKey={optionKey}
                />
              </div>
            )
          )}
          <LabReportsInput
            id={`${visit.id}-lab-reports`}
            value={draft.labReports}
            onChange={(labReports) =>
              setDraft((prev) => ({ ...prev, labReports }))
            }
            onPendingChange={handlePendingChange}
          />
          <MedicinesInput
            id={`${visit.id}-medicines`}
            value={draft.medicinesPrescribed}
            onChange={(medicinesPrescribed) =>
              setDraft((prev) => ({ ...prev, medicinesPrescribed }))
            }
            onPendingChange={handlePendingChange}
          />
          <div className="grid gap-2">
            <Combobox
              id={`${visit.id}-diagnosis`}
              label="Diagnosis"
              value={draft.diagnosis}
              onChange={(diagnosis) =>
                setDraft((prev) => ({ ...prev, diagnosis }))
              }
              onPendingChange={handlePendingChange}
              endpoint={diagnosisField.endpoint}
              placeholder="No diagnosis"
              optionsKey={diagnosisField.optionsKey}
              optionKey={diagnosisField.optionKey}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${visit.id}-assessment-form`}>
              Add disease assessment
            </Label>
            <NativeSelect
              id={`${visit.id}-assessment-form`}
              value=""
              onChange={(event) => {
                const value = event.currentTarget.value
                if (value === "t2dm" || value === "ibs") addAssessment(value)
              }}
            >
              <NativeSelectOption value="">Select a form</NativeSelectOption>
              <NativeSelectOption
                value="t2dm"
                disabled={!!draft.t2dmAssessment}
              >
                T2DM assessment
              </NativeSelectOption>
              <NativeSelectOption value="ibs" disabled={!!draft.ibsAssessment}>
                IBS assessment
              </NativeSelectOption>
            </NativeSelect>
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${visit.id}-remarks`}>Remarks</Label>
            <Input
              id={`${visit.id}-remarks`}
              placeholder="Add a brief remark"
              value={draft.remarks}
              onChange={(event) => {
                const remarks = formatClinicalInput(event.currentTarget)
                setDraft((prev) => ({ ...prev, remarks }))
              }}
            />
          </div>
          {draft.t2dmAssessment && (
            <T2dmAssessmentForm
              id={`${visit.id}-t2dm`}
              value={draft.t2dmAssessment}
              onChange={updateT2dmAssessment}
              onRemove={() => {
                if (
                  draft.t2dmAssessment &&
                  hasT2dmAnswers(draft.t2dmAssessment)
                ) {
                  setConfirmRemoveT2dm(true)
                } else {
                  setDraft((prev) => ({ ...prev, t2dmAssessment: null }))
                }
              }}
            />
          )}
          {draft.ibsAssessment && (
            <IbsAssessmentForm
              id={`${visit.id}-ibs`}
              value={draft.ibsAssessment}
              onChange={updateIbsAssessment}
              onRemove={() => {
                if (draft.ibsAssessment && hasIbsAnswers(draft.ibsAssessment)) {
                  setConfirmRemoveIbs(true)
                } else {
                  setDraft((prev) => ({ ...prev, ibsAssessment: null }))
                }
              }}
            />
          )}
        </div>
        {saveError && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {saveError}
          </p>
        )}
        <div className="mt-4 flex gap-2">
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={pendingOptionCount > 0 || savingVisit}
          >
            {savingVisit
              ? "Saving…"
              : visit.status === "draft"
                ? "Save visit"
                : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={pendingOptionCount > 0 || savingVisit}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
      <ConfirmDialog
        open={confirmRemoveT2dm}
        onOpenChange={setConfirmRemoveT2dm}
        title="Remove T2DM assessment?"
        description="The answers entered in this assessment will be discarded."
        confirmLabel="Remove assessment"
        onConfirm={() => {
          setDraft((prev) => ({ ...prev, t2dmAssessment: null }))
          setConfirmRemoveT2dm(false)
        }}
      />
      <ConfirmDialog
        open={confirmRemoveIbs}
        onOpenChange={setConfirmRemoveIbs}
        title="Remove IBS assessment?"
        description="The answers entered in this assessment will be discarded."
        confirmLabel="Remove assessment"
        onConfirm={() => {
          setDraft((prev) => ({ ...prev, ibsAssessment: null }))
          setConfirmRemoveIbs(false)
        }}
      />
      <ConfirmDialog
        open={pendingAssessment !== null}
        onOpenChange={(open) => !open && setPendingAssessment(null)}
        title="Replace disease assessment?"
        description="The answers entered in the current assessment will be discarded."
        confirmLabel="Replace assessment"
        onConfirm={() => {
          if (pendingAssessment) replaceAssessment(pendingAssessment)
        }}
      />
    </Card>
  )
}
