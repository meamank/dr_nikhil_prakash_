import { formatClinicalText } from "@repo/shared"
import { useState } from "react"
import { Combobox } from "@/components/Combobox"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatClinicalInput } from "@/lib/clinical-input"
import { IbsAssessmentForm } from "./assessments/IbsAssessmentForm"
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
  remarks: string
  t2dmAssessment: T2dmAssessment | null
  ibsAssessment: IbsAssessment | null
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
    previousMedicalHistory: visit.previousMedicalHistory.map(formatClinicalText),
    diagnosis: visit.diagnosis.map(formatClinicalText),
    labReports: visit.labReports.map(formatClinicalText),
    medicinesPrescribed: visit.medicinesPrescribed.map(formatClinicalText),
    remarks: formatClinicalText(visit.remarks),
    t2dmAssessment: visit.t2dmAssessment ? { ...visit.t2dmAssessment } : null,
    ibsAssessment: visit.ibsAssessment ? { ...visit.ibsAssessment } : null,
  }
}

function hasT2dmAnswers(value: T2dmAssessment): boolean {
  return Object.values(value).some((field) => field !== "")
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
  onSave: (values: VisitValues) => void
  onCancel: () => void
}) {
  const [pendingOptionCount, setPendingOptionCount] = useState(0)
  const [confirmRemoveT2dm, setConfirmRemoveT2dm] = useState(false)
  const [confirmRemoveIbs, setConfirmRemoveIbs] = useState(false)
  const [isEditing, setIsEditing] = useState(visit.status === "draft")
  const [draft, setDraft] = useState<VisitValues>(() => getVisitValues(visit))

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

  function handleSave() {
    onSave(draft)
    setIsEditing(false)
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
              <dt className="text-sm text-muted-foreground">Chest/Heart Sound</dt>
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
            <div className="grid min-w-0 gap-1 sm:col-span-2">
              <dt className="text-sm text-muted-foreground">Remarks</dt>
              <dd className="text-sm font-medium break-words">
                {formatClinicalText(visit.remarks) || "—"}
              </dd>
            </div>
            {visit.t2dmAssessment && (
              <div className="grid min-w-0 gap-1 sm:col-span-2">
                <dt className="text-sm text-muted-foreground">T2DM assessment</dt>
                <dd className="text-sm font-medium">Recorded</dd>
              </div>
            )}
            {visit.ibsAssessment && (
              <div className="grid min-w-0 gap-1 sm:col-span-2">
                <dt className="text-sm text-muted-foreground">IBS assessment</dt>
                <dd className="text-sm font-medium">Recorded</dd>
              </div>
            )}
          </dl>
          <div>
            <Button type="button" variant="outline" onClick={() => setIsEditing(true)}>
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
            <Label htmlFor={`${visit.id}-chest-heart-sound`}>Chest/Heart Sound</Label>
            <Select
              value={draft.chestHeartSound}
              onValueChange={(value) => {
                const sound = soundOptions.find((option) => option === value)
                if (sound) setDraft((prev) => ({ ...prev, chestHeartSound: sound }))
              }}
            >
              <SelectTrigger id={`${visit.id}-chest-heart-sound`} className="w-full">
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
            <div className="grid gap-2">
              <Label htmlFor={`${visit.id}-other-sound`}>Other chest/heart sound</Label>
              <Input
                id={`${visit.id}-other-sound`}
                placeholder="Describe the chest/heart sound"
                value={draft.otherChestHeartSound}
                onChange={(event) => {
                  const otherChestHeartSound = formatClinicalInput(event.currentTarget)
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
                  onChange={(options) => setDraft((prev) => ({ ...prev, [key]: options }))}
                  onPendingChange={handlePendingChange}
                  endpoint={endpoint}
                  placeholder={placeholder}
                  optionsKey={optionsKey}
                  optionKey={optionKey}
                />
              </div>
            )
          )}
          <div className="grid gap-2">
            <Combobox
              id={`${visit.id}-diagnosis`}
              label="Diagnosis"
              value={draft.diagnosis}
              onChange={(diagnosis) => setDraft((prev) => ({ ...prev, diagnosis }))}
              onPendingChange={handlePendingChange}
              endpoint={diagnosisField.endpoint}
              placeholder="No diagnosis"
              optionsKey={diagnosisField.optionsKey}
              optionKey={diagnosisField.optionKey}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${visit.id}-assessment-form`}>Add disease assessment</Label>
            <Select
              value=""
              onValueChange={(value) => {
                if (value === "t2dm" && !draft.t2dmAssessment) {
                  setDraft((prev) => ({ ...prev, t2dmAssessment: emptyT2dmAssessment() }))
                }
                if (value === "ibs" && !draft.ibsAssessment) {
                  setDraft((prev) => ({ ...prev, ibsAssessment: emptyIbsAssessment() }))
                }
              }}
            >
              <SelectTrigger id={`${visit.id}-assessment-form`} className="w-full">
                <SelectValue placeholder="Select a form" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="t2dm" disabled={!!draft.t2dmAssessment}>
                  T2DM assessment
                </SelectItem>
                <SelectItem value="ibs" disabled={!!draft.ibsAssessment}>
                  IBS assessment
                </SelectItem>
              </SelectContent>
            </Select>
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
                if (draft.t2dmAssessment && hasT2dmAnswers(draft.t2dmAssessment)) {
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
        <div className="mt-4 flex gap-2">
          <Button type="button" onClick={handleSave} disabled={pendingOptionCount > 0}>
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
    </Card>
  )
}
