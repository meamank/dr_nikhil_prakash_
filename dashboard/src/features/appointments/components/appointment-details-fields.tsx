import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"

export type Clinic = "juran_chhapra" | "bhagwanpur"

export type AppointmentDetails = {
  name: string
  address: string
  mobile: string
  age: string
  sex: string
  clinic: Clinic
  date: string
}

export function AppointmentDetailsFields({
  idPrefix,
  values,
  onChange,
  autoFocus = false,
}: {
  idPrefix: string
  values: AppointmentDetails
  onChange: <Field extends keyof AppointmentDetails>(
    field: Field,
    value: AppointmentDetails[Field]
  ) => void
  autoFocus?: boolean
}) {
  const shouldAutoFocus =
    autoFocus &&
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 768px)").matches

  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:col-span-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-clinic`}>Clinic</Label>
          <NativeSelect
            id={`${idPrefix}-clinic`}
            className="w-full"
            value={values.clinic}
            onChange={(event) =>
              onChange(
                "clinic",
                event.target.value === "bhagwanpur"
                  ? "bhagwanpur"
                  : "juran_chhapra"
              )
            }
          >
            <NativeSelectOption value="juran_chhapra">
              Juran Chhapra
            </NativeSelectOption>
            <NativeSelectOption value="bhagwanpur">
              Bhagwanpur
            </NativeSelectOption>
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-date`}>Date</Label>
          <Input
            id={`${idPrefix}-date`}
            type="date"
            value={values.date}
            onChange={(event) => onChange("date", event.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-name`}>Patient name</Label>
        <Input
          id={`${idPrefix}-name`}
          value={values.name}
          onChange={(event) => onChange("name", event.target.value)}
          required
          autoFocus={shouldAutoFocus}
        />
      </div>
      <div className="flex flex-col gap-2 md:col-span-2">
        <Label htmlFor={`${idPrefix}-address`}>Address</Label>
        <Input
          id={`${idPrefix}-address`}
          value={values.address}
          onChange={(event) => onChange("address", event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-mobile`}>Mobile</Label>
        <Input
          id={`${idPrefix}-mobile`}
          inputMode="numeric"
          value={values.mobile}
          onChange={(event) => onChange("mobile", event.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-age`}>Age</Label>
        <Input
          id={`${idPrefix}-age`}
          type="number"
          min={0}
          max={130}
          value={values.age}
          onChange={(event) => onChange("age", event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-sex`}>Sex</Label>
        <NativeSelect
          id={`${idPrefix}-sex`}
          className="w-full"
          value={values.sex}
          onChange={(event) => onChange("sex", event.target.value)}
        >
          <NativeSelectOption value="">Select</NativeSelectOption>
          <NativeSelectOption value="male">Male</NativeSelectOption>
          <NativeSelectOption value="female">Female</NativeSelectOption>
          <NativeSelectOption value="other">Other</NativeSelectOption>
        </NativeSelect>
      </div>
    </>
  )
}
