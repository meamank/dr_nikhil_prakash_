import { useRef, useState } from "react"
import { X } from "lucide-react"
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
import { formatClinicalText } from "@repo/shared"
import { useClinicalOptions } from "@/features/patients/hooks/useClinicalOptions"

export type LabReport = {
  test: string
  result: string
  reportDate: string
}

const normalize = (value: string) => value.trim().replace(/\s+/g, " ")
const keyFor = (value: string) => normalize(value).toLowerCase()

function todayISTDate(): string {
  const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000)
  return ist.toISOString().slice(0, 10)
}

export function LabReportsInput({
  id,
  value,
  onChange,
  onPendingChange,
}: {
  id: string
  value: LabReport[]
  onChange: (value: LabReport[]) => void
  onPendingChange: (pending: boolean) => void
}) {
  const testRef = useRef<HTMLInputElement>(null)
  const resultRef = useRef<HTMLInputElement>(null)
  const dateRef = useRef<HTMLInputElement>(null)
  const [test, setTest] = useState("")
  const [result, setResult] = useState("")
  const [reportDate, setReportDate] = useState(todayISTDate())
  const [error, setError] = useState<string | null>(null)
  const {
    options,
    loadError,
    isLoading: loading,
    isSaving: saving,
    createOption,
  } = useClinicalOptions({ endpoint: "/api/clinical-options/lab-reports" })
  const statusError = error ?? (loadError ? "Couldn’t load lab reports." : null)

  const candidate = normalize(test)
  const matches = options.filter((option) =>
    keyFor(option).includes(keyFor(test))
  )
  const canCreate =
    candidate.length > 0 &&
    candidate.length <= 200 &&
    !options.some((option) => keyFor(option) === keyFor(candidate))
  const items = canCreate ? [...matches, candidate] : matches

  async function saveTest(testName = test): Promise<string | null> {
    const cleanTest = normalize(testName)
    if (!cleanTest) {
      setError("Enter a test name.")
      return null
    }
    if (cleanTest.length > 200) {
      setError("Test name is too long.")
      return null
    }

    const existing = options.find(
      (option) => keyFor(option) === keyFor(cleanTest)
    )
    if (existing) return existing

    onPendingChange(true)
    setError(null)
    try {
      return await createOption(cleanTest)
    } catch {
      setError("Couldn’t save the test. Try again.")
      return null
    } finally {
      onPendingChange(false)
    }
  }

  async function selectTest(nextTest: string) {
    const savedTest = await saveTest(nextTest)
    if (!savedTest) return
    setTest(savedTest)
    resultRef.current?.focus()
  }

  async function addReport() {
    const savedTest = await saveTest()
    const cleanResult = normalize(result)
    if (!savedTest) return
    if (!cleanResult) {
      setError("Enter the result or value.")
      resultRef.current?.focus()
      return
    }
    if (!reportDate) {
      setError("Select the report date.")
      dateRef.current?.focus()
      return
    }

    onChange([...value, { test: savedTest, result: cleanResult, reportDate }])
    setTest("")
    setResult("")
    setError(null)
    requestAnimationFrame(() => testRef.current?.focus())
  }

  return (
    <div className="grid gap-2 sm:col-span-3">
      <div className="flex min-h-5 items-center justify-between gap-2">
        <Label htmlFor={`${id}-test`}>Lab reports</Label>
        {(loading || saving || statusError) && (
          <span
            role={statusError ? "alert" : "status"}
            className={
              statusError
                ? "text-xs text-destructive"
                : "text-xs text-muted-foreground"
            }
          >
            {statusError ?? (saving ? "Saving…" : "Loading…")}
          </span>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <UiCombobox
          autoHighlight
          items={items}
          filter={null}
          value={test}
          onValueChange={(nextTest) => {
            if (nextTest) void selectTest(nextTest)
          }}
          inputValue={test}
          onInputValueChange={(text) => setTest(formatClinicalText(text))}
          disabled={loading || saving}
        >
          <ComboboxInput
            ref={testRef}
            id={`${id}-test`}
            className="w-full"
            placeholder="Test, e.g. CBC"
            showClear={false}
          />
          <ComboboxContent>
            <ComboboxEmpty>Type a test to add it.</ComboboxEmpty>
            <ComboboxList>
              {(item: string) => (
                <ComboboxItem key={item} value={item}>
                  {canCreate && item === candidate ? `Add “${item}”` : item}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </UiCombobox>
        <Input
          ref={resultRef}
          id={`${id}-result`}
          value={result}
          onChange={(event) =>
            setResult(formatClinicalText(event.target.value))
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              dateRef.current?.focus()
            }
          }}
          placeholder="Result / value"
          disabled={loading || saving}
        />
        <div className="flex gap-2">
          <Input
            ref={dateRef}
            id={`${id}-date`}
            type="date"
            value={reportDate}
            onChange={(event) => setReportDate(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                void addReport()
              }
            }}
            aria-label="Report date"
            className="min-w-0 flex-1"
            disabled={loading || saving}
          />
          <Button
            type="button"
            onClick={() => void addReport()}
            disabled={loading || saving}
          >
            Add
          </Button>
        </div>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((report, index) => (
            <span
              key={`${report.test}-${report.result}-${report.reportDate}-${index}`}
              className="inline-flex items-center gap-1 rounded-md border bg-muted px-2 py-1 text-sm"
            >
              {report.test} · {report.result} · {report.reportDate}
              <button
                type="button"
                aria-label={`Remove ${report.test}`}
                className="rounded-sm text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                onClick={() =>
                  onChange(value.filter((_, itemIndex) => itemIndex !== index))
                }
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
