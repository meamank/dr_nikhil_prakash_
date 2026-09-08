import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FormRadioGroup } from "@/components/FormRadioGroup"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { type IbsAssessment } from "../visit-form.types"
import { RadioGroupChoiceCard } from "@/components/FormRadioChoiceCard"
import { Separator } from "@/components/ui/separator"

const romeFields = [
  {
    key: "romePainWeekly",
    label: "Abdominal pain ≥1 day/week (last 3 months)",
  },
  { key: "romeDefecationRelated", label: "Pain related to defecation" },
  { key: "romeStoolChange", label: "Change in stool frequency or form" },
  { key: "romeDurationSixMonths", label: "Symptom duration ≥6 months" },
] as const

const redFlagFields = [
  { key: "redFlagWeightLoss", label: "Unintentional weight loss" },
  { key: "redFlagBleeding", label: "GI bleeding" },
  { key: "redFlagIronDeficiencyAnemia", label: "Iron deficiency anemia" },
  { key: "redFlagFever", label: "Fever" },
  { key: "redFlagNocturnalSymptoms", label: "Nocturnal symptoms" },
  { key: "redFlagOnsetAfter50", label: "Onset after age 50" },
  { key: "redFlagFamilyHistory", label: "Family history of CRC / IBD" },
] as const

const functionalImpactFields = [
  { key: "missedWork", label: "Missed work" },
  { key: "avoidsTravelOrSocial", label: "Avoids travel or social activities" },
  { key: "toiletAnxiety", label: "Toilet anxiety" },
  { key: "dominatesDailyThinking", label: "Dominates daily thinking" },
] as const

const scoreFields = [
  { key: "painSeverity", label: "Pain severity" },
  { key: "painFrequency", label: "Pain frequency" },
  { key: "bloating", label: "Bloating" },
  { key: "bowelDissatisfaction", label: "Bowel dissatisfaction" },
  { key: "lifeInterference", label: "Life interference" },
] as const

const bristolStoolOptions = [
  { value: "1", label: "Separate, hard lumps" },
  { value: "2", label: "Sausage-shaped but lumpy" },
  { value: "3", label: "Sausage with cracks" },
  { value: "4", label: "Smooth, soft sausage or snake" },
  { value: "5", label: "Soft blobs with clear-cut edges" },
  { value: "6", label: "Mushy pieces with rugged edges" },
  { value: "7", label: "Watery, no solid pieces" },
] as const

const subtypeOptions = [
  { value: "IBS-C", label: "IBS-C: Constipation-predominant" },
  { value: "IBS-D", label: "IBS-D: Diarrhea-predominant" },
  { value: "IBS-M", label: "IBS-M: Mixed stool pattern" },
  { value: "IBS-U", label: "IBS-U: Unclassified" },
] as const

type BooleanKey =
  | (typeof romeFields)[number]["key"]
  | (typeof redFlagFields)[number]["key"]
  | (typeof functionalImpactFields)[number]["key"]
  | "anxietySymptoms"
  | "lowMoodOrDepression"
type ScoreKey = (typeof scoreFields)[number]["key"]

function severity(total: number): "Mild" | "Moderate" | "Severe" {
  if (total > 300) return "Severe"
  if (total >= 175) return "Moderate"
  return "Mild"
}

function CheckRow({
  id,
  label,
  checked,
  autoFocus = false,
  onCheckedChange,
}: {
  id: string
  label: string
  checked: boolean
  autoFocus?: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex gap-2">
      <Checkbox
        id={id}
        checked={checked}
        autoFocus={autoFocus}
        className={
          autoFocus
            ? "focus:border-ring focus:ring-3 focus:ring-ring/50"
            : undefined
        }
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <Label htmlFor={id} className="font-normal">
        {label}
      </Label>
    </div>
  )
}

export function IbsAssessmentForm({
  id,
  value,
  onChange,
  onRemove,
}: {
  id: string
  value: IbsAssessment
  onChange: (patch: Partial<IbsAssessment>) => void
  onRemove: () => void
}) {
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const firstControl = document.getElementById(`${id}-romePainWeekly`)
      firstControl?.scrollIntoView({ block: "center" })
      firstControl?.focus()
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [id])

  const scoreTotal = scoreFields.reduce(
    (total, { key }) => total + value[key],
    0
  )
  const redFlagCount = redFlagFields.filter(({ key }) => value[key]).length

  const updateBoolean = (key: BooleanKey, checked: boolean) =>
    onChange({ [key]: checked })
  const updateScore = (key: ScoreKey, input: string) =>
    onChange({ [key]: Math.min(100, Math.max(0, Number(input) || 0)) })

  return (
    <Card className="sm:col-span-full">
      <CardHeader className="flex items-start justify-between gap-4">
        <div className="grid gap-1">
          <CardTitle>Irritable Bowel Syndrome (IBS) assessment</CardTitle>
        </div>
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
        <div className="grid gap-6 sm:grid-cols-2">
          <section className="grid content-start gap-3">
            <div>
              <h3 className="text-sm font-medium">
                Step 1: Confirm Rome IV criteria
              </h3>
              <p className="text-xs text-muted-foreground">
                {romeFields.filter(({ key }) => value[key]).length}/4 documented
              </p>
            </div>
            <div className="grid gap-2">
              {romeFields.map(({ key, label }, index) => (
                <CheckRow
                  key={key}
                  id={`${id}-${key}`}
                  label={label}
                  checked={value[key]}
                  autoFocus={index === 0}
                  onCheckedChange={(checked) => updateBoolean(key, checked)}
                />
              ))}
            </div>
          </section>

          <section className="grid content-start gap-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium">
                Step 2: Red flag screening
              </h3>
              {redFlagCount > 0 && (
                <p role="alert" className="text-xs text-destructive">
                  {redFlagCount} red flag{redFlagCount === 1 ? "" : "s"}{" "}
                  documented
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Mandatory review. Unchecked items mean No.
              </p>
            </div>
            <div className="grid gap-2">
              {redFlagFields.map(({ key, label }) => (
                <CheckRow
                  key={key}
                  id={`${id}-${key}`}
                  label={label}
                  checked={value[key]}
                  onCheckedChange={(checked) => updateBoolean(key, checked)}
                />
              ))}
            </div>
          </section>
        </div>

        <section className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <FormRadioGroup
              id={`${id}-bristol`}
              label="Step 3: Bristol stool form scale"
              options={bristolStoolOptions}
              value={value.bristolStoolType}
              onValueChange={(bristolStoolType) => {
                onChange({ bristolStoolType })
              }}
            />
          </div>
          <div className="grid gap-2">
            <RadioGroupChoiceCard
              id={`${id}-subtype`}
              label="Step 4: Subtype classification"
              options={subtypeOptions}
              value={value.subtype}
              onValueChange={(subtype) => {
                onChange({ subtype })
              }}
            />
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h3 className="text-sm font-medium">
                  Step 5: IBS-SSS severity
                </h3>
                <p className="text-xs text-muted-foreground">
                  Enter 0–100 for each domain.
                </p>
              </div>
              {scoreTotal > 0 && (
                <Badge
                  variant={
                    scoreTotal > 300
                      ? "destructive"
                      : scoreTotal >= 175
                        ? "outline"
                        : "secondary"
                  }
                  className={
                    scoreTotal >= 175 && scoreTotal <= 300
                      ? "border-yellow-500/40 bg-yellow-500/15 text-yellow-700 dark:text-yellow-300"
                      : undefined
                  }
                >
                  {scoreTotal}/500 — {severity(scoreTotal)}
                </Badge>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {scoreFields.map(({ key, label }) => (
                <div key={key} className="grid gap-1">
                  <Label htmlFor={`${id}-${key}`}>{label}</Label>
                  <Input
                    id={`${id}-${key}`}
                    type="number"
                    min="0"
                    max="100"
                    step="10"
                    inputMode="numeric"
                    value={value[key]}
                    onChange={(event) =>
                      updateScore(key, event.currentTarget.value)
                    }
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              &lt;175 Mild · 175–300 Moderate · &gt;300 Severe
            </p>
          </div>
          <div className="grid gap-3">
            <div className="grid gap-2">
              <h3 className="text-sm font-medium">Step 6: Functional impact</h3>
              {functionalImpactFields.map(({ key, label }) => (
                <CheckRow
                  key={key}
                  id={`${id}-${key}`}
                  label={label}
                  checked={value[key]}
                  onCheckedChange={(checked) => updateBoolean(key, checked)}
                />
              ))}
            </div>
            <div className="grid gap-2">
              <h3 className="text-sm font-medium">
                Step 7: Psychological screening
              </h3>
              <CheckRow
                id={`${id}-anxietySymptoms`}
                label="Current anxiety symptoms"
                checked={value.anxietySymptoms}
                onCheckedChange={(checked) =>
                  updateBoolean("anxietySymptoms", checked)
                }
              />
              <CheckRow
                id={`${id}-lowMoodOrDepression`}
                label="Low mood or depression"
                checked={value.lowMoodOrDepression}
                onCheckedChange={(checked) =>
                  updateBoolean("lowMoodOrDepression", checked)
                }
              />
            </div>
          </div>
        </section>
      </CardContent>
    </Card>
  )
}
