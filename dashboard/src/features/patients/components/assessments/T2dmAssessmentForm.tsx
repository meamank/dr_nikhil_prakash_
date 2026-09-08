import { formatClinicalInput } from "@/lib/clinical-input"
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
import { type T2dmAssessment } from "../visit-form.types"

const choiceFields = [
  { key: "familyHistory", label: "Family history of diabetes" },
  { key: "polyuria", label: "Frequent urination (polyuria)" },
  { key: "polydipsia", label: "Excessive thirst (polydipsia)" },
] as const

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
  return (
    <Card className="sm:col-span-full">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="grid gap-1">
          <CardTitle>T2DM assessment</CardTitle>
          <CardDescription>
            Placeholder screening questions for the disease-form flow.
          </CardDescription>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onRemove}>
          Remove
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor={`${id}-duration`}>Duration of symptoms</Label>
          <Input
            id={`${id}-duration`}
            placeholder="For example, 3 months"
            value={value.symptomsDuration}
            onChange={(event) => {
              const symptomsDuration = formatClinicalInput(event.currentTarget)
              onChange({ symptomsDuration })
            }}
          />
        </div>
        {choiceFields.map(({ key, label }) => (
          <div key={key} className="grid gap-2">
            <Label htmlFor={`${id}-${key}`}>{label}</Label>
            <Select
              value={value[key]}
              onValueChange={(option) => {
                if (
                  option === "Yes" ||
                  option === "No" ||
                  option === "Unknown"
                ) {
                  onChange({ [key]: option })
                }
              }}
            >
              <SelectTrigger id={`${id}-${key}`} className="w-full">
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
          <Label htmlFor={`${id}-random-glucose`}>Random blood glucose</Label>
          <Input
            id={`${id}-random-glucose`}
            placeholder="For example, 210 mg/dL"
            value={value.randomBloodGlucose}
            onChange={(event) => {
              const randomBloodGlucose = formatClinicalInput(event.currentTarget)
              onChange({ randomBloodGlucose })
            }}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${id}-hba1c`}>HbA1c</Label>
          <Input
            id={`${id}-hba1c`}
            placeholder="For example, 7.2%"
            value={value.hba1c}
            onChange={(event) => {
              const hba1c = formatClinicalInput(event.currentTarget)
              onChange({ hba1c })
            }}
          />
        </div>
      </CardContent>
    </Card>
  )
}
