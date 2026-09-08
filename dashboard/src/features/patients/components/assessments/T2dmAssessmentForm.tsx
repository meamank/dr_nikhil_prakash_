import { useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Separator } from "@/components/ui/separator"
import { type T2dmAssessment } from "../visit-form.types"

const symptoms = [
  ["polyuria", "Polyuria", "Frequent urination, especially at night"],
  ["polydipsia", "Polydipsia", "Excessive thirst"],
  ["polyphagia", "Polyphagia", "Excessive hunger"],
  ["unexplainedWeightLoss", "Weight loss", "Unexplained or sudden weight loss"],
  ["blurredVision", "Blurred vision", "Transient visual blurriness"],
  [
    "fatigueOrLethargy",
    "Fatigue / lethargy",
    "Unexplained fatigue or tiredness",
  ],
] as const
const demographicRisks = [
  ["age35OrOlder", "Age ≥35 years", "Universal screening baseline age"],
  [
    "overweightOrObese",
    "Overweight or obese",
    "BMI ≥25 (or ≥23 in Asian Americans)",
  ],
  [
    "highRiskEthnicity",
    "High-risk race/ethnicity",
    "African American, Latino, Asian, Native American",
  ],
] as const
const medicalRisks = [
  [
    "firstDegreeRelative",
    "First-degree relative",
    "Parent or sibling with diabetes",
  ],
  ["historyOfCvd", "History of CVD", "Cardiovascular disease, CAD, stroke"],
  ["hypertension", "Hypertension", "≥140/90 mmHg or on BP medication"],
  ["historyOfGdm", "History of GDM", "Gestational diabetes history"],
  ["pcos", "PCOS", "Polycystic ovary syndrome"],
  [
    "physicalInactivity",
    "Physical inactivity",
    "Physically inactive lifestyle",
  ],
] as const
const acuteRedFlags = [
  [
    "fruityBreathOdor",
    "Fruity breath odor",
    "Acetone odor / suspected ketoacidosis",
  ],
  [
    "kussmaulRespirations",
    "Kussmaul respirations",
    "Deep, rapid compensatory breathing",
  ],
  [
    "intractableNauseaVomiting",
    "Intractable nausea/vomiting",
    "Unable to tolerate oral intake / dehydration",
  ],
  [
    "alteredMentalStatus",
    "Altered mental status",
    "Confusion, profound lethargy, or delirium",
  ],
] as const
const complications = [
  [
    "neuropathicSymptoms",
    "Neuropathic symptoms",
    "Numbness, tingling, burning pain in hands/feet",
  ],
  [
    "footComplications",
    "Foot complications",
    "Slow-healing wounds or active foot ulcers",
  ],
  [
    "visionChangesOrFloaters",
    "Vision changes / floaters",
    "Sudden vision loss, floaters, or retinopathy signs",
  ],
  [
    "exertionalChestPainOrSob",
    "Exertional chest pain / SOB",
    "Angina equivalents or dyspnea on exertion",
  ],
] as const

type BooleanKey = Exclude<keyof T2dmAssessment, "symptomsDuration">
type Field = readonly [BooleanKey, string, string]

function CheckRow({
  controlId,
  field,
  checked,
  autoFocus = false,
  onChange,
}: {
  controlId: string
  field: Field
  checked: boolean
  autoFocus?: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex gap-2">
      <Checkbox
        id={controlId}
        checked={checked}
        autoFocus={autoFocus}
        onCheckedChange={(next) => onChange(next === true)}
      />
      <Label htmlFor={controlId} className="font-normal">
        {field[1]}
      </Label>
    </div>
  )
}

function FieldGroup({
  id,
  fields,
  value,
  onChange,
  autoFocus = false,
}: {
  id: string
  fields: readonly Field[]
  value: T2dmAssessment
  onChange: (key: BooleanKey, checked: boolean) => void
  autoFocus?: boolean
}) {
  return (
    <>
      {fields.map((field, index) => (
        <CheckRow
          key={field[0]}
          controlId={id + "-" + field[0]}
          field={field}
          checked={value[field[0]]}
          autoFocus={autoFocus && index === 0}
          onChange={(checked) => onChange(field[0], checked)}
        />
      ))}
    </>
  )
}

export function T2dmAssessmentForm({
  id,
  value,
  onChange,
  onRemove,
}: {
  id: string
  value: T2dmAssessment
  onChange: (patch: Partial<T2dmAssessment>) => void
  onRemove: () => void
}) {
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const firstControl = document.getElementById(id + "-polyuria")
      firstControl?.scrollIntoView({ block: "center" })
      firstControl?.focus()
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [id])

  const count = (fields: readonly Field[]) =>
    fields.filter(([key]) => value[key]).length
  const update = (key: BooleanKey, checked: boolean) =>
    onChange({ [key]: checked })
  const acuteCount = count(acuteRedFlags)

  return (
    <Card className="sm:col-span-full">
      <CardHeader className="flex items-start justify-between gap-4">
        <CardTitle>Type 2 Diabetes Mellitus (T2DM) assessment</CardTitle>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={onRemove}
        >
          Close assessment
        </Button>
      </CardHeader>
      <Separator />
      <CardContent className="grid gap-6">
        <section className="grid gap-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-medium">
                Step 1: Chief complaint & classic symptoms
              </h3>
              <p className="text-xs text-muted-foreground">
                Select all symptoms currently experienced by the patient.
              </p>
            </div>
            <Badge variant="secondary">
              Symptoms: {count(symptoms)}/{symptoms.length}
            </Badge>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <FieldGroup
              id={id}
              fields={symptoms}
              value={value}
              onChange={update}
              autoFocus
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 sm:items-center">
            <Label htmlFor={id + "-duration"}>Symptom duration</Label>
            <NativeSelect
              id={id + "-duration"}
              className="w-full"
              value={value.symptomsDuration}
              onChange={(event) =>
                onChange({ symptomsDuration: event.target.value })
              }
            >
              <NativeSelectOption value="">Select duration</NativeSelectOption>
              <NativeSelectOption value="Less than 1 week">
                Less than 1 week
              </NativeSelectOption>
              <NativeSelectOption value="1–4 weeks">
                1–4 weeks
              </NativeSelectOption>
              <NativeSelectOption value="1–3 months">
                1–3 months
              </NativeSelectOption>
              <NativeSelectOption value="More than 3 months">
                More than 3 months
              </NativeSelectOption>
            </NativeSelect>
          </div>
        </section>

        <section className="grid gap-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-medium">
                Step 2: ADA asymptomatic risk factor screening
              </h3>
              <p className="text-xs text-muted-foreground">
                Check all historical risk factors that apply to the patient.
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary">
                Demographic: {count(demographicRisks)}/{demographicRisks.length}
              </Badge>
              <Badge variant="secondary">
                Medical: {count(medicalRisks)}/{medicalRisks.length}
              </Badge>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="grid content-start gap-2">
              <h4 className="text-sm font-medium">
                Demographic / anthropometric
              </h4>
              <FieldGroup
                id={id}
                fields={demographicRisks}
                value={value}
                onChange={update}
              />
            </div>
            <div className="grid content-start gap-2">
              <h4 className="text-sm font-medium">Medical history</h4>
              <FieldGroup
                id={id}
                fields={medicalRisks}
                value={value}
                onChange={update}
              />
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-medium">
                Step 3: Red flag & acute complication screening
              </h3>
              <p className="text-xs text-muted-foreground">
                Checked acute red flags need urgent consultant review.
              </p>
            </div>
            <Badge variant={acuteCount > 0 ? "destructive" : "secondary"}>
              {acuteCount > 0
                ? acuteCount + " acute red flag" + (acuteCount === 1 ? "" : "s")
                : "No acute red flags"}
            </Badge>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="grid content-start gap-2">
              <h4 className="text-sm font-medium">
                Acute metabolic red flags (urgent)
              </h4>
              <FieldGroup
                id={id}
                fields={acuteRedFlags}
                value={value}
                onChange={update}
              />
            </div>
            <div className="grid content-start gap-2">
              <h4 className="text-sm font-medium">
                Early micro/macrovascular signs
              </h4>
              <FieldGroup
                id={id}
                fields={complications}
                value={value}
                onChange={update}
              />
            </div>
          </div>
        </section>
      </CardContent>
    </Card>
  )
}
