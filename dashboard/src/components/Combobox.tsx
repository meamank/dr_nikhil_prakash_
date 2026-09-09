import { formatClinicalText } from "@repo/shared"
import { formatClinicalInput } from "@/lib/clinical-input"
import { useRef, useState } from "react"
import {
  Combobox as UiCombobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useClinicalOptions } from "@/features/patients/hooks/useClinicalOptions"

const normalize = (value: string) => value.trim().replace(/\s+/g, " ")
const keyFor = (value: string) => normalize(value).toLowerCase()

export function Combobox({
  id,
  value,
  onChange,
  onPendingChange,
  endpoint,
  label,
  placeholder,
  optionsKey = "options",
  optionKey = "option",
}: {
  id: string
  value: string[]
  onChange: (value: string[]) => void
  onPendingChange: (pending: boolean) => void
  endpoint: string
  label: string
  placeholder: string
  optionsKey?: string
  optionKey?: string
}) {
  const anchor = useComboboxAnchor()
  const inputRef = useRef<HTMLInputElement>(null)
  const [input, setInput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const {
    options,
    loadError,
    isLoading: loading,
    isSaving: saving,
    createOption,
    retry,
  } = useClinicalOptions({ endpoint, optionsKey, optionKey })
  const statusError = error ?? (loadError ? "Couldn’t load." : null)
  const loadFailed = !!loadError

  const available = Array.from(new Set([...options, ...value]))
  const candidate = normalize(input)
  const canCreate =
    candidate.length > 0 &&
    candidate.length <= 200 &&
    !available.some((option) => keyFor(option) === keyFor(candidate))
  const matches = available.filter((option) =>
    keyFor(option).includes(keyFor(input))
  )
  const items = canCreate ? [...matches, candidate] : matches

  async function select(next: string[]) {
    if (saving) return
    const added = next.find((item) => !value.includes(item))
    if (!added || available.includes(added)) {
      onChange(next)
      setInput("")
      return
    }
    onPendingChange(true)
    setError(null)
    try {
      const option = await createOption(added)
      onChange(
        Array.from(
          new Set(next.map((item) => (item === added ? option : item)))
        )
      )
      setInput("")
    } catch {
      setInput(added)
      setError("Couldn’t save. Try again.")
    } finally {
      onPendingChange(false)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }

  return (
    <div className="grid gap-2">
      <div className="flex min-h-5 items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {(loading || saving || statusError) && (
          <div
            id={`${id}-status`}
            role={statusError ? "alert" : "status"}
            className={
              statusError
                ? "flex items-center gap-1 text-xs text-destructive"
                : "text-xs text-muted-foreground"
            }
          >
            <span>{statusError ?? (saving ? "Saving…" : "Loading…")}</span>
            {loadFailed && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto px-1 py-0 text-xs"
                onClick={() => {
                  setError(null)
                  void retry()
                }}
              >
                Retry
              </Button>
            )}
          </div>
        )}
      </div>
      <UiCombobox
        multiple
        autoHighlight
        items={items}
        filter={null}
        value={value}
        onValueChange={select}
        inputValue={input}
        onInputValueChange={(text) => setInput(formatClinicalText(text))}
        disabled={loading || loadFailed || saving}
      >
        <ComboboxChips ref={anchor}>
          <ComboboxValue>
            {(values: string[]) =>
              values.map((item) => (
                <ComboboxChip key={item}>{item}</ComboboxChip>
              ))
            }
          </ComboboxValue>
          <ComboboxChipsInput
            ref={inputRef}
            id={id}
            onChange={(e) => formatClinicalInput(e.currentTarget)}
            placeholder={placeholder}
            maxLength={200}
            aria-describedby={loading || saving || statusError ? `${id}-status` : undefined}
            aria-invalid={!!statusError}
          />
        </ComboboxChips>
        <ComboboxContent anchor={anchor}>
          <ComboboxEmpty>Type an option to add it.</ComboboxEmpty>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {canCreate && item === candidate ? `Add “${item}”` : item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </UiCombobox>
    </div>
  )
}
