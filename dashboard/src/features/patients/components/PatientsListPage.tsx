import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { apiDelete, apiGet, apiPost } from "@/lib/api"
import { PatientsTable, type PatientRow } from "./patients-table"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { AddPatientSheet, type NewPatient } from "./AddPatientSheet"

export default function PatientsListPage() {
  const [q, setQ] = useState("")
  const [rows, setRows] = useState<PatientRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingPid, setDeletingPid] = useState<string | null>(null)
  const [pendingPid, setPendingPid] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [savingPatient, setSavingPatient] = useState(false)

  async function load(query = q) {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ limit: "100" })
      if (query.trim()) params.set("q", query.trim())
      const data = await apiGet<{
        patients?: PatientRow[]
        total?: number
      }>(`/api/patients?${params}`)
      setRows(data?.patients ?? [])
      setTotal(data?.total ?? 0)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load patients"
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load("")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function confirmDelete() {
    if (!pendingPid) return
    const pid = pendingPid
    setPendingPid(null)
    setDeletingPid(pid)
    setError(null)
    try {
      await apiDelete(`/api/patients/${encodeURIComponent(pid)}`)
      toast.success(`Patient ${pid} deleted`)
      await load()
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Delete failed"
      setError(msg)
      toast.error(msg)
    } finally {
      setDeletingPid(null)
    }
  }

  async function createPatient(patient: NewPatient) {
    setSavingPatient(true)
    setError(null)
    try {
      const data = await apiPost<{ patient?: PatientRow }>(
        "/api/patients",
        patient
      )
      toast.success(`Patient ${data.patient?.pid ?? ""} added`)
      setAdding(false)
      await load("")
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to add patient"
      setError(msg)
      toast.error(msg)
    } finally {
      setSavingPatient(false)
    }
  }

  const pendingPatient = rows.find((r) => r.pid === pendingPid)

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex gap-2">
          <Input
            placeholder="Search PID, name, mobile…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            className="w-64"
          />
          <Button variant="outline" onClick={() => load()}>
            Search
          </Button>
        </div>
        <Button variant="ghost" onClick={() => load()} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </Button>
        <div className="ml-auto flex items-center gap-3">
          {total > 0 && (
            <p className="text-sm text-muted-foreground">
              {total} patient{total === 1 ? "" : "s"}
            </p>
          )}
          <Button onClick={() => setAdding(true)}>+ Add patient</Button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      {rows.length === 0 && !loading ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No patients yet. Add an existing patient or issue a PID when a booking is marked Paid.
          </CardContent>
        </Card>
      ) : (
        <>
          <PatientsTable
            data={rows}
            onDelete={setPendingPid}
            deletingPid={deletingPid}
          />
          <ConfirmDialog
            open={pendingPid !== null}
            onOpenChange={(open) => !open && setPendingPid(null)}
            title="Delete patient?"
            description={
              pendingPatient
                ? `Delete ${pendingPatient.fullName} (${pendingPid}) and all their visits? This cannot be undone.`
                : "Delete this patient and all their visits? This cannot be undone."
            }
            confirmLabel="Delete patient"
            onConfirm={confirmDelete}
            loading={deletingPid !== null}
          />
        </>
      )}
      <AddPatientSheet
        open={adding}
        onOpenChange={setAdding}
        onSave={createPatient}
        saving={savingPatient}
      />
    </div>
  )
}
