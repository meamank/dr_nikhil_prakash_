import { formatClinicalText } from "@repo/shared"
import { formatClinicalInput } from "@/lib/clinical-input"
import { useState } from "react"
import { Combobox } from "@/components/Combobox"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const soundOptions = ["Normal", "Wheeze", "Rhonci", "Creps", "Other"] as const
const assessmentOutcomes = [
  "Not assessed",
  "Suspected",
  "Confirmed",
  "Ruled out",
] as const
const t2dmDiagnosis = "TYPE 2 DIABETES MELLITUS"

type T2dmAssessment = {
  symptomsDuration: string
  familyHistory: "" | "Yes" | "No" | "Unknown"
  polyuria: "" | "Yes" | "No" | "Unknown"
  polydipsia: "" | "Yes" | "No" | "Unknown"
  randomBloodGlucose: string
  hba1c: string
  outcome: (typeof assessmentOutcomes)[number]
}

const emptyT2dmAssessment = (): T2dmAssessment => ({
  symptomsDuration: "",
  familyHistory: "",
  polyuria: "",
  polydipsia: "",
  randomBloodGlucose: "",
  hba1c: "",
  outcome: "Not assessed",
})

function hasT2dmAnswers(assessment: T2dmAssessment): boolean {
  return (
    assessment.symptomsDuration !== "" ||
    assessment.familyHistory !== "" ||
    assessment.polyuria !== "" ||
    assessment.polydipsia !== "" ||
    assessment.randomBloodGlucose !== "" ||
    assessment.hba1c !== "" ||
    assessment.outcome !== "Not assessed"
  )
}

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
  {
    key: "labReports",
    label: "Lab reports",
    endpoint: "/api/clinical-options/lab-reports",
    placeholder: "Type or select lab reports",
    optionsKey: "options",
    optionKey: "option",
  },
  {
    key: "medicinesPrescribed",
    label: "Medicines prescribed",
    endpoint: "/api/clinical-options/medicines-prescribed",
    placeholder: "Type or select prescribed medicines",
    optionsKey: "options",
    optionKey: "option",
  },
] as const

const diagnosisField = {
  endpoint: "/api/clinical-options/diagnosis",
  optionsKey: "options",
  optionKey: "option",
} as const

const t2dmChoiceFields = [
  { key: "familyHistory", label: "Family history of diabetes" },
  { key: "polyuria", label: "Frequent urination (polyuria)" },
  { key: "polydipsia", label: "Excessive thirst (polydipsia)" },
] as const

export type VisitData = {
  id: string
  label: string
  bloodPressure: string
  weight: string
  chestHeartSound: (typeof soundOptions)[number]
  otherChestHeartSound: string
  chiefComplaint: string[]
  previousMedicalHistory: string[]
  diagnosis: string[]
  labReports: string[]
  medicinesPrescribed: string[]
  t2dmAssessment: T2dmAssessment | null
  status: "draft" | "saved"
}

export type VisitValues = Omit<VisitData, "id" | "label" | "status">

function getVisitValues(visit: VisitData): VisitValues {
  return {
    bloodPressure: formatClinicalText(visit.bloodPressure),
    weight: formatClinicalText(visit.weight),
    chestHeartSound: visit.chestHeartSound,
    otherChestHeartSound: formatClinicalText(visit.otherChestHeartSound),
    chiefComplaint: visit.chiefComplaint.map(formatClinicalText),
    previousMedicalHistory:
      visit.previousMedicalHistory.map(formatClinicalText),
    diagnosis: visit.diagnosis.map(formatClinicalText),
    labReports: visit.labReports.map(formatClinicalText),
    medicinesPrescribed: visit.medicinesPrescribed.map(formatClinicalText),
    t2dmAssessment: visit.t2dmAssessment
      ? { ...visit.t2dmAssessment }
      : null,
  }
}

export function VisitForm({
  visit,
  onSave,
  onCancel,
}: {
  visit: VisitData
  onSave: (values: VisitValues) => void
  // Draft only: discard the tab. Saved-edit cancel is handled
  // internally (revert to locked view, data kept) — Option A.
  onCancel: () => void
}) {
  const [pendingOptionCount, setPendingOptionCount] = useState(0)
  const [confirmRemoveT2dm, setConfirmRemoveT2dm] = useState(false)
  const [isEditing, setIsEditing] = useState(visit.status === "draft")
  const [draft, setDraft] = useState<VisitValues>(() => getVisitValues(visit))

  function handlePendingChange(pending: boolean) {
    setPendingOptionCount((count) => Math.max(0, count + (pending ? 1 : -1)))
  }

  function updateT2dmAssessment(patch: Partial<T2dmAssessment>) {
    setDraft((prev) => ({
      ...prev,
      t2dmAssessment: prev.t2dmAssessment
        ? { ...prev.t2dmAssessment, ...patch }
        : null,
    }))
  }

  function updateT2dmOutcome(outcome: T2dmAssessment["outcome"]) {
    setDraft((prev) => ({
      ...prev,
      diagnosis:
        (outcome === "Suspected" || outcome === "Confirmed") &&
        !prev.diagnosis.includes(t2dmDiagnosis)
          ? [...prev.diagnosis, t2dmDiagnosis]
          : prev.diagnosis,
      t2dmAssessment: prev.t2dmAssessment
        ? { ...prev.t2dmAssessment, outcome }
        : null,
    }))
  }

  function requestRemoveT2dm() {
    if (draft.t2dmAssessment && hasT2dmAnswers(draft.t2dmAssessment)) {
      setConfirmRemoveT2dm(true)
      return
    }
    setDraft((prev) => ({ ...prev, t2dmAssessment: null }))
  }

  function handleSave() {
    onSave(draft)
    setIsEditing(false)
  }

  function handleCancel() {
    if (visit.status === "draft") {
      onCancel()
      return
    }
    // Saved visit: revert unsaved typing, back to locked view. Data kept.
    setDraft(getVisitValues(visit))
    setIsEditing(false)
  }

  function handleEdit() {
    setDraft(getVisitValues(visit))
    setIsEditing(true)
  }

  if (!isEditing) {
    return (
      <Card>
        <CardContent className="grid gap-4">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1">
              <dt className="text-sm text-muted-foreground">Blood pressure</dt>
              <dd className="text-sm font-medium">
                {formatClinicalText(visit.bloodPressure) || "—"}
              </dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-sm text-muted-foreground">Weight</dt>
              <dd className="text-sm font-medium">
                {formatClinicalText(visit.weight) || "—"}
              </dd>
            </div>
            <div className="grid gap-1 sm:col-span-2">
              <dt className="text-sm text-muted-foreground">
                Chest/Heart Sound
              </dt>
              <dd className="text-sm font-medium break-words whitespace-pre-wrap">
                {visit.chestHeartSound === "Other"
                  ? formatClinicalText(visit.otherChestHeartSound) || "OTHER"
                  : formatClinicalText(visit.chestHeartSound)}
              </dd>
            </div>
            {clinicalOptionFields.map(({ key, label }) => (
              <div key={key} className="grid min-w-0 gap-1 sm:col-span-2">
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="text-sm font-medium break-words">
                  {visit[key].map(formatClinicalText).join(", ") || "—"}
                </dd>
              </div>
            ))}
            <div className="grid min-w-0 gap-1 sm:col-span-2">
              <dt className="text-sm text-muted-foreground">Diagnosis</dt>
              <dd className="text-sm font-medium break-words">
                {visit.diagnosis.map(formatClinicalText).join(", ") ||
                  "NO DIAGNOSIS"}
              </dd>
            </div>
            {visit.t2dmAssessment && (
              <div className="grid min-w-0 gap-1 sm:col-span-2">
                <dt className="text-sm text-muted-foreground">
                  T2DM assessment
                </dt>
                <dd className="text-sm font-medium">
                  {visit.t2dmAssessment.outcome}
                </dd>
              </div>
            )}
          </dl>
          <div>
            <Button type="button" variant="outline" onClick={handleEdit}>
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor={`${visit.id}-date`}>Visit date</Label>
            <Input id={`${visit.id}-date`} value={visit.label} disabled />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${visit.id}-weight`}>Weight</Label>
            <Input
              id={`${visit.id}-weight`}
              placeholder="70 kg"
              value={draft.weight}
              onChange={(e) => {
                const weight = formatClinicalInput(e.currentTarget)
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
              onChange={(e) => {
                const value = formatClinicalInput(e.currentTarget)
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
          <div className="grid gap-2 sm:col-span-1">
            <Label htmlFor={`${visit.id}-chest-heart-sound`}>
              Chest/Heart Sound
            </Label>
            <Select
              value={draft.chestHeartSound}
              onValueChange={(value) => {
                const sound = soundOptions.find((option) => option === value)
                if (sound)
                  setDraft((prev) => ({ ...prev, chestHeartSound: sound }))
              }}
            >
              <SelectTrigger
                id={`${visit.id}-chest-heart-sound`}
                className="w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {soundOptions.map((sound) => (
                  <SelectItem key={sound} value={sound}>
                    {formatClinicalText(sound)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {draft.chestHeartSound === "Other" && (
            <div className="grid gap-2 sm:col-span-1">
              <Label htmlFor={`${visit.id}-other-sound`}>
                Other chest/heart sound
              </Label>
              <Input
                id={`${visit.id}-other-sound`}
                placeholder="Describe the chest/heart sound"
                value={draft.otherChestHeartSound}
                onChange={(e) => {
                  const otherChestHeartSound = formatClinicalInput(
                    e.currentTarget
                  )
                  setDraft((prev) => ({ ...prev, otherChestHeartSound }))
                }}
              />
            </div>
          )}
          {clinicalOptionFields.map(
            ({ key, label, endpoint, placeholder, optionsKey, optionKey }) => (
              <div key={key} className="grid gap-2 sm:col-span-1">
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
          <div className="grid gap-2 sm:col-span-1">
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
          <div className="grid gap-2 sm:col-span-1">
            <Label htmlFor={`${visit.id}-assessment-form`}>
              Add disease assessment
            </Label>
            <Select
              value=""
              onValueChange={(value) => {
                if (value === "t2dm" && !draft.t2dmAssessment) {
                  setDraft((prev) => ({
                    ...prev,
                    t2dmAssessment: emptyT2dmAssessment(),
                  }))
                }
              }}
            >
              <SelectTrigger
                id={`${visit.id}-assessment-form`}
                className="w-full"
              >
                <SelectValue placeholder="Select a form" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="t2dm" disabled={!!draft.t2dmAssessment}>
                  T2DM assessment
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {draft.t2dmAssessment && (
            <Card className="sm:col-span-full">
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div className="grid gap-1">
                  <CardTitle>T2DM assessment</CardTitle>
                  <CardDescription>
                    Placeholder screening questions for the disease-form flow.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={requestRemoveT2dm}
                >
                  Remove
                </Button>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor={`${visit.id}-t2dm-duration`}>
                    Duration of symptoms
                  </Label>
                  <Input
                    id={`${visit.id}-t2dm-duration`}
                    placeholder="For example, 3 months"
                    value={draft.t2dmAssessment.symptomsDuration}
                    onChange={(event) => {
                      const symptomsDuration = formatClinicalInput(
                        event.currentTarget
                      )
                      updateT2dmAssessment({ symptomsDuration })
                    }}
                  />
                </div>
                {t2dmChoiceFields.map(({ key, label }) => (
                  <div key={key} className="grid gap-2">
                    <Label htmlFor={`${visit.id}-t2dm-${key}`}>{label}</Label>
                    <Select
                      value={draft.t2dmAssessment?.[key] ?? ""}
                      onValueChange={(value) => {
                        if (
                          value === "Yes" ||
                          value === "No" ||
                          value === "Unknown"
                        ) {
                          updateT2dmAssessment({ [key]: value })
                        }
                      }}
                    >
                      <SelectTrigger
                        id={`${visit.id}-t2dm-${key}`}
                        className="w-full"
                      >
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {(["Yes", "No", "Unknown"] as const).map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
                <div className="grid gap-2">
                  <Label htmlFor={`${visit.id}-t2dm-random-glucose`}>
                    Random blood glucose
                  </Label>
                  <Input
                    id={`${visit.id}-t2dm-random-glucose`}
                    placeholder="For example, 210 mg/dL"
                    value={draft.t2dmAssessment.randomBloodGlucose}
                    onChange={(event) => {
                      const randomBloodGlucose = formatClinicalInput(
                        event.currentTarget
                      )
                      updateT2dmAssessment({ randomBloodGlucose })
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`${visit.id}-t2dm-hba1c`}>HbA1c</Label>
                  <Input
                    id={`${visit.id}-t2dm-hba1c`}
                    placeholder="For example, 7.2%"
                    value={draft.t2dmAssessment.hba1c}
                    onChange={(event) => {
                      const hba1c = formatClinicalInput(event.currentTarget)
                      updateT2dmAssessment({ hba1c })
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`${visit.id}-t2dm-outcome`}>
                    Assessment outcome
                  </Label>
                  <Select
                    value={draft.t2dmAssessment.outcome}
                    onValueChange={(value) => {
                      const outcome = assessmentOutcomes.find(
                        (option) => option === value
                      )
                      if (outcome) updateT2dmOutcome(outcome)
                    }}
                  >
                    <SelectTrigger
                      id={`${visit.id}-t2dm-outcome`}
                      className="w-full"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {assessmentOutcomes.map((outcome) => (
                        <SelectItem key={outcome} value={outcome}>
                          {outcome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        <div className="mt-4 flex gap-2">
          <Button
            type="button"
            onClick={handleSave}
            disabled={pendingOptionCount > 0}
          >
            {visit.status === "draft" ? "Save visit" : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={pendingOptionCount > 0}
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
    </Card>
  )
}
