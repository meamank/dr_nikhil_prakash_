import { Field, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export type FormRadioOption<T extends string> = {
  value: T
  label: string
}

export function FormRadioGroup<T extends string>({
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
        value={value}
        onValueChange={(value) => onValueChange(value as T)}
      >
        {options.map((option) => {
          const optionId = `${id}-${option.value}`
          return (
            <Field key={option.value} orientation="horizontal">
              <RadioGroupItem value={option.value} id={optionId} />
              <FieldLabel htmlFor={optionId} className="font-normal">
                {option.label}
              </FieldLabel>
            </Field>
          )
        })}
      </RadioGroup>
    </FieldSet>
  )
}
