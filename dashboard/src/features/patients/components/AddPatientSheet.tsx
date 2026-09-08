import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

export type NewPatient = {
  fullName: string
  mobile: string
  address: string
  ageYears: number
  gender: "male" | "female" | "other"
}

export function AddPatientSheet({
  open,
  onOpenChange,
  onSave,
  saving,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (patient: NewPatient) => void
  saving: boolean
}) {
  const [fullName, setFullName] = React.useState("")
  const [mobile, setMobile] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [age, setAge] = React.useState("")
  const [gender, setGender] = React.useState("")

  function reset() {
    setFullName("")
    setMobile("")
    setAddress("")
    setAge("")
    setGender("")
  }

  React.useEffect(() => {
    if (open) reset()
  }, [open])

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) reset()
    onOpenChange(nextOpen)
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (gender !== "male" && gender !== "female" && gender !== "other") return

    onSave({
      fullName: fullName.trim(),
      mobile: mobile.trim(),
      address: address.trim(),
      ageYears: Number(age),
      gender,
    })
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add patient</SheetTitle>
          <SheetDescription>
            Create a record for an existing patient. A PID is assigned automatically.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="flex flex-col gap-4 px-4 pb-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="patient-name">Full name</Label>
            <Input
              id="patient-name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="patient-mobile">Mobile</Label>
            <Input
              id="patient-mobile"
              inputMode="numeric"
              value={mobile}
              onChange={(event) => setMobile(event.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="patient-address">Address</Label>
            <Input
              id="patient-address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="patient-age">Age</Label>
              <Input
                id="patient-age"
                type="number"
                min={0}
                max={130}
                value={age}
                onChange={(event) => setAge(event.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="patient-gender">Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger id="patient-gender">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !gender}>
              {saving ? "Adding…" : "Add patient"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
