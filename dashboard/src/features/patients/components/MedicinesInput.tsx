import { useEffect, useRef, useState } from "react"
import { X } from "lucide-react"
import { formatClinicalText } from "@repo/shared"
import { Button } from "@/components/ui/button"
import {
  Combobox as UiCombobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { apiGet, apiPost } from "@/lib/api"

export type Medicine = {
  name: string
  frequency: "OD" | "BD" | "TDS" | "BBF" | "SOS"
  duration: string
  notes: string
}

const frequencies = ["OD", "BD", "TDS", "BBF", "SOS"] as const
const durationOptions = ["5 days", "10 days", "15 days", "20 days", "30 days", "3 months"]
const normalize = (value: string) => value.trim().replace(/\s+/g, " ")
const keyFor = (value: string) => normalize(value).toLowerCase()

export function MedicinesInput({
  id,
  value,
  onChange,
  onPendingChange,
}: {
  id: string
  value: Medicine[]
  onChange: (value: Medicine[]) => void
  onPendingChange: (pending: boolean) => void
}) {
  const medicineRef = useRef<HTMLInputElement>(null)
  const durationRef = useRef<HTMLInputElement>(null)
  const notesRef = useRef<HTMLInputElement>(null)
  const [options, setOptions] = useState<string[]>([])
  const [medicine, setMedicine] = useState("")
  const [frequency, setFrequency] = useState<Medicine["frequency"]>("OD")
  const [duration, setDuration] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const medicineCandidate = normalize(medicine)
  const medicineMatches = options.filter((option) =>
    keyFor(option).includes(keyFor(medicine))
  )
  const canCreateMedicine =
    medicineCandidate.length > 0 &&
    medicineCandidate.length <= 200 &&
    !options.some((option) => keyFor(option) === keyFor(medicineCandidate))
  const medicineItems = canCreateMedicine
    ? [...medicineMatches, medicineCandidate]
    : medicineMatches
  const durationCandidate = normalize(duration)
  const durationMatches = durationOptions.filter((option) =>
    keyFor(option).includes(keyFor(duration))
  )
  const durationItems =
    durationCandidate && !durationOptions.some((option) => keyFor(option) === keyFor(durationCandidate))
      ? [...durationMatches, durationCandidate]
      : durationMatches

  useEffect(() => {
    let active = true
    apiGet<{ options: string[] }>("/api/clinical-options/medicines-prescribed")
      .then((data) => {
        if (active) setOptions(data.options.map(formatClinicalText))
      })
      .catch(() => {
        if (active) setError("Couldn’t load medicines.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  async function saveMedicine(medicineName = medicine): Promise<string | null> {
    const cleanMedicine = normalize(medicineName)
    if (!cleanMedicine) {
      setError("Enter a medicine name.")
      return null
    }
    if (cleanMedicine.length > 200) {
      setError("Medicine name is too long.")
      return null
    }
    const existing = options.find((option) => keyFor(option) === keyFor(cleanMedicine))
    if (existing) return existing

    setSaving(true)
    onPendingChange(true)
    setError(null)
    try {
      const response = await apiPost<{ option: string }>(
        "/api/clinical-options/medicines-prescribed",
        { label: cleanMedicine }
      )
      const saved = formatClinicalText(response.option)
      setOptions((prev) => Array.from(new Set([...prev, saved])))
      return saved
    } catch {
      setError("Couldn’t save the medicine. Try again.")
      return null
    } finally {
      setSaving(false)
      onPendingChange(false)
    }
  }

  async function selectMedicine(nextMedicine: string) {
    const savedMedicine = await saveMedicine(nextMedicine)
    if (!savedMedicine) return
    setMedicine(savedMedicine)
    requestAnimationFrame(() =>
      document.getElementById(`${id}-frequency`)?.focus()
    )
  }

  function selectDuration(nextDuration: string) {
    setDuration(nextDuration)
    requestAnimationFrame(() => notesRef.current?.focus())
  }

  async function addMedicine() {
    const savedMedicine = await saveMedicine()
    const cleanDuration = normalize(duration)
    if (!savedMedicine) return
    if (!cleanDuration) {
      setError("Enter a duration.")
      durationRef.current?.focus()
      return
    }

    onChange([
      ...value,
      {
        name: savedMedicine,
        frequency,
        duration: cleanDuration,
        notes: normalize(notes),
      },
    ])
    setMedicine("")
    setFrequency("OD")
    setDuration("")
    setNotes("")
    setError(null)
    requestAnimationFrame(() => medicineRef.current?.focus())
  }

  return (
    <div className="grid gap-2 sm:col-span-3">
      <div className="flex min-h-5 items-center justify-between gap-2">
        <Label htmlFor={`${id}-medicine`}>Medicines prescribed</Label>
        {(loading || saving || error) && (
          <span
            role={error ? "alert" : "status"}
            className={error ? "text-xs text-destructive" : "text-xs text-muted-foreground"}
          >
            {error ?? (saving ? "Saving…" : "Loading…")}
          </span>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <UiCombobox
          autoHighlight
          items={medicineItems}
          filter={null}
          value={medicine}
          onValueChange={(nextMedicine) => {
            if (nextMedicine) void selectMedicine(nextMedicine)
          }}
          inputValue={medicine}
          onInputValueChange={(text) => setMedicine(formatClinicalText(text))}
          disabled={loading || saving}
        >
          <ComboboxInput
            ref={medicineRef}
            id={`${id}-medicine`}
            className="w-full"
            placeholder="Medicine, e.g. Metformin 500 mg"
            showClear={false}
          />
          <ComboboxContent>
            <ComboboxEmpty>Type a medicine to add it.</ComboboxEmpty>
            <ComboboxList>
              {(item: string) => (
                <ComboboxItem key={item} value={item}>
                  {canCreateMedicine && item === medicineCandidate
                    ? `Add “${item}”`
                    : item}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </UiCombobox>
        <div className="flex gap-2">
          <NativeSelect
            id={`${id}-frequency`}
            className="w-20 shrink-0"
            value={frequency}
            onChange={(event) => setFrequency(event.target.value as Medicine["frequency"])}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                durationRef.current?.focus()
              }
            }}
            disabled={loading || saving}
          >
            {frequencies.map((option) => (
              <NativeSelectOption key={option} value={option}>
                {option}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <UiCombobox
            autoHighlight
            items={durationItems}
            filter={null}
            value={duration}
            onValueChange={(nextDuration) => {
              if (nextDuration) selectDuration(nextDuration)
            }}
            inputValue={duration}
            onInputValueChange={(text) => setDuration(formatClinicalText(text))}
            disabled={loading || saving}
          >
            <ComboboxInput
              ref={durationRef}
              id={`${id}-duration`}
              className="w-full min-w-0 flex-1"
              placeholder="Duration"
              showClear={false}
            />
            <ComboboxContent>
              <ComboboxEmpty>Type a duration.</ComboboxEmpty>
              <ComboboxList>
                {(item: string) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </UiCombobox>
        </div>
        <div className="flex gap-2">
          <Input
            ref={notesRef}
            id={`${id}-notes`}
            value={notes}
            onChange={(event) => setNotes(formatClinicalText(event.target.value))}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                void addMedicine()
              }
            }}
            placeholder="Notes, e.g. after food"
            className="min-w-0 flex-1"
            disabled={loading || saving}
          />
          <Button type="button" onClick={() => void addMedicine()} disabled={loading || saving}>
            Add
          </Button>
        </div>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((medicineEntry, index) => (
            <span
              key={`${medicineEntry.name}-${medicineEntry.frequency}-${medicineEntry.duration}-${index}`}
              className="inline-flex items-center gap-1 rounded-md border bg-muted px-2 py-1 text-sm"
            >
              {medicineEntry.name} · {medicineEntry.frequency} · {medicineEntry.duration}
              {medicineEntry.notes ? ` · ${medicineEntry.notes}` : ""}
              <button
                type="button"
                aria-label={`Remove ${medicineEntry.name}`}
                className="rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
