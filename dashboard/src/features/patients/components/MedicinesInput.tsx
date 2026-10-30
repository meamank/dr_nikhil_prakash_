import { useRef, useState } from "react"
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
import { useMedicineCatalogue, type CatalogueMedicine } from "@/features/patients/hooks/useMedicineCatalogue"
import { medicineSearchKey } from "@/features/patients/lib/medicine-catalogue.mjs"
import { useClinicalOptions } from "@/features/patients/hooks/useClinicalOptions"

export type Medicine = {
  name: string
  catalogueId?: string
  frequency: "OD" | "BD" | "TDS" | "BBF" | "SOS"
  duration: string
  notes: string
}

const frequencies = ["OD", "BD", "TDS", "BBF", "SOS"] as const
const durationOptions = ["5 days", "10 days", "15 days", "20 days", "30 days", "3 months"]
const normalize = (value: string) => value.trim().replace(/\s+/g, " ")
const keyFor = medicineSearchKey

type MedicineSuggestion = {
  id: string
  label: string
  catalogue?: CatalogueMedicine
  create?: boolean
}

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
  const [medicine, setMedicine] = useState("")
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineSuggestion | null>(null)
  const catalogue = useMedicineCatalogue(medicine)
  const [frequency, setFrequency] = useState<Medicine["frequency"]>("OD")
  const [duration, setDuration] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const {
    options,
    loadError,
    isLoading: loading,
    isSaving: saving,
    createOption,
  } = useClinicalOptions({
    endpoint: "/api/clinical-options/medicines-prescribed",
  })
  const statusError = error ?? (loadError ? "Couldn’t load saved medicines. Custom entry is still available." : null) ?? (catalogue.error ? "Couldn’t load catalogue suggestions. Custom entry is still available." : null)

  const medicineCandidate = normalize(medicine)
  const catalogueItems: MedicineSuggestion[] = catalogue.suggestions.map((record) => ({
    id: `catalogue:${record.id}`,
    label: formatClinicalText(record.name),
    catalogue: record,
  }))
  const catalogueNames = new Set(catalogueItems.map((item) => keyFor(item.label)))
  const medicineMatches: MedicineSuggestion[] = [
    ...catalogueItems,
    ...options.filter((option) => keyFor(option).includes(keyFor(medicine)) && !catalogueNames.has(keyFor(option)))
      .slice(0, Math.max(0, 10 - catalogueItems.length))
      .map((label) => ({ id: `custom:${keyFor(label)}`, label })),
  ]
  const canCreateMedicine =
    medicineCandidate.length > 0 &&
    medicineCandidate.length <= 200 &&
    !options.some((option) => keyFor(option) === keyFor(medicineCandidate))
  const medicineItems: MedicineSuggestion[] = canCreateMedicine
    ? [...medicineMatches, { id: "create", label: medicineCandidate, create: true }]
    : medicineMatches
  const durationCandidate = normalize(duration)
  const durationMatches = durationOptions.filter((option) =>
    keyFor(option).includes(keyFor(duration))
  )
  const durationItems =
    durationCandidate && !durationOptions.some((option) => keyFor(option) === keyFor(durationCandidate))
      ? [...durationMatches, durationCandidate]
      : durationMatches

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
    if (selectedMedicine?.catalogue && keyFor(selectedMedicine.label) === keyFor(cleanMedicine)) {
      return selectedMedicine.label
    }
    const existing = options.find((option) => keyFor(option) === keyFor(cleanMedicine))
    if (existing) return existing

    onPendingChange(true)
    setError(null)
    try {
      return await createOption(cleanMedicine)
    } catch {
      setError("Couldn’t save the medicine. Try again.")
      return null
    } finally {
      onPendingChange(false)
    }
  }

  async function selectMedicine(nextMedicine: MedicineSuggestion) {
    const savedMedicine = nextMedicine.catalogue ? nextMedicine.label : await saveMedicine(nextMedicine.label)
    if (!savedMedicine) return
    setSelectedMedicine({ ...nextMedicine, label: savedMedicine })
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
        ...(selectedMedicine?.catalogue && keyFor(selectedMedicine.label) === keyFor(savedMedicine)
          ? { catalogueId: selectedMedicine.catalogue.id } : {}),
        frequency,
        duration: cleanDuration,
        notes: normalize(notes),
      },
    ])
    setMedicine("")
    setSelectedMedicine(null)
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
        {(loading || saving || statusError) && (
          <span
            role={statusError ? "alert" : "status"}
            className={statusError ? "text-xs text-destructive" : "text-xs text-muted-foreground"}
          >
            {statusError ?? (saving ? "Saving…" : "Loading saved medicines…")}
            {catalogue.error && <button type="button" className="ml-2 underline" onClick={() => void catalogue.retry()}>Retry</button>}
          </span>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <UiCombobox
          autoHighlight
          items={medicineItems}
          filter={null}
          value={selectedMedicine}
          itemToStringLabel={(item) => item.label}
          isItemEqualToValue={(item, selected) => item.id === selected.id}
          onValueChange={(nextMedicine) => {
            if (nextMedicine) void selectMedicine(nextMedicine)
          }}
          inputValue={medicine}
          onInputValueChange={(text, details) => {
            setMedicine(formatClinicalText(text))
            if (details.reason === "input-change" || details.reason === "input-clear") setSelectedMedicine(null)
          }}
          disabled={saving}
        >
          <ComboboxInput
            ref={medicineRef}
            id={`${id}-medicine`}
            className="w-full"
            placeholder="Type 3 letters to search medicines"
            showClear={false}
          />
          <ComboboxContent>
            <p role="status" className="px-2 py-1.5 text-xs text-muted-foreground">
              {Array.from(keyFor(medicine)).length < 3 ? (catalogue.localReady ? "Type at least 3 letters of a medicine name or composition." : "Type at least 3 letters to search medicine names.") : catalogue.loading ? "Searching medicines…" : "Select a medicine or add a custom name."}
            </p>
            <ComboboxEmpty>No matching medicines. You can enter a custom name.</ComboboxEmpty>
            <ComboboxList>
              {(item: MedicineSuggestion) => (
                <ComboboxItem key={item.id} value={item}>
                  <div className="min-w-0">
                    <p className="font-medium">{item.create ? `Add custom “${item.label}”` : item.label}</p>
                    {item.catalogue && (
                      <>
                        <p className="text-xs text-muted-foreground">{formatClinicalText([item.catalogue.composition1, item.catalogue.composition2].filter(Boolean).join(" + "))}</p>
                        <p className="text-xs text-muted-foreground">{formatClinicalText(item.catalogue.manufacturer)}</p>
                      </>
                    )}
                  </div>
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
            disabled={saving}
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
            disabled={saving}
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
            disabled={saving}
          />
          <Button type="button" onClick={() => void addMedicine()} disabled={saving}>
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
