import {
  Field,
  FieldContent,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { FormRadioOption } from "./FormRadioGroup"

export function RadioGroupChoiceCard<T extends string>({
  id,
  label,
  options,
  value,
  onValueChange,
}: {
  id: string
  label: string
  options: readonly FormRadioOption<T>[]
  value: T | ""
  onValueChange: (value: T) => void
}) {
  return (
    <FieldSet className="w-full gap-2">
      <FieldLegend variant="label">{label}</FieldLegend>
      <RadioGroup
        className="max-w-sm"
        value={value}
        onValueChange={(value) => onValueChange(value as T)}
      >
        {options.map((option) => {
          const optionId = `${id}-${option.value}`
          return (
            <FieldLabel htmlFor={optionId} key={option.value}>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle className="font-normal">
                    {option.label}
                  </FieldTitle>
                </FieldContent>
                <RadioGroupItem value={option.value} id={optionId} />
              </Field>
            </FieldLabel>
          )
        })}
      </RadioGroup>
    </FieldSet>
  )
}
