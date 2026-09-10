import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

export type PatientDemographics = {
  fullName: string
  mobile: string
  address: string | null
  ageYears: number | null
  gender: string | null
}

export type PatientDemographicsPatch = {
  fullName: string
  mobile: string
  address: string | null
  ageYears: number | null
  gender: "male" | "female" | "other" | null
}

export function EditPatientSheet({
  patient,
  open,
  onOpenChange,
  onSave,
  saving,
}: {
  patient: PatientDemographics
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (patch: PatientDemographicsPatch) => void
  saving: boolean
}) {
  const [fullName, setFullName] = React.useState("")
  const [mobile, setMobile] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [age, setAge] = React.useState("")
  const [gender, setGender] = React.useState("")

  React.useEffect(() => {
    if (!open) return
    setFullName(patient.fullName)
    setMobile(patient.mobile)
    setAddress(patient.address ?? "")
    setAge(patient.ageYears != null ? String(patient.ageYears) : "")
    setGender(patient.gender ?? "")
  }, [open, patient])

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const selectedGender = ["male", "female", "other"].includes(gender)
      ? (gender as PatientDemographicsPatch["gender"])
      : null

    onSave({
      fullName: fullName.trim(),
      mobile: mobile.trim(),
      address: address.trim() || null,
      ageYears: age.trim() === "" ? null : Number(age),
      gender: selectedGender,
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit patient details</SheetTitle>
          <SheetDescription>
            Update the patient’s demographics. Their PID and visit records stay unchanged.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="flex flex-col gap-4 px-4 pb-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-patient-name">Full name</Label>
            <Input
              id="edit-patient-name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-patient-mobile">Mobile</Label>
            <Input
              id="edit-patient-mobile"
              inputMode="numeric"
              value={mobile}
              onChange={(event) => setMobile(event.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-patient-address">Address</Label>
            <Input
              id="edit-patient-address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-patient-age">Age</Label>
              <Input
                id="edit-patient-age"
                type="number"
                min={0}
                max={130}
                value={age}
                onChange={(event) => setAge(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-patient-sex">Sex</Label>
              <NativeSelect
                id="edit-patient-sex"
                className="w-full"
                value={gender}
                onChange={(event) => setGender(event.target.value)}
              >
                <NativeSelectOption value="">Not recorded</NativeSelectOption>
                <NativeSelectOption value="male">Male</NativeSelectOption>
                <NativeSelectOption value="female">Female</NativeSelectOption>
                <NativeSelectOption value="other">Other</NativeSelectOption>
              </NativeSelect>
            </div>
          </div>
          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
