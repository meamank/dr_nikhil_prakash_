import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { apiDelete, apiGet } from "@/lib/api"
import { PatientsTable, type PatientRow } from "./patients-table"

export default function PatientsListPage() {
  const [q, setQ] = useState("")
  const [rows, setRows] = useState<PatientRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingPid, setDeletingPid] = useState<string | null>(null)

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
      setError(e instanceof Error ? e.message : "Failed to load patients")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load("")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function remove(pid: string) {
    if (!window.confirm(`Delete patient ${pid} and all their visits?`)) return
    setDeletingPid(pid)
    setError(null)
    try {
      await apiDelete(`/api/patients/${encodeURIComponent(pid)}`)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed")
    } finally {
      setDeletingPid(null)
    }
  }

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
        {total > 0 && (
          <p className="ml-auto text-sm text-muted-foreground">
            {total} patient{total === 1 ? "" : "s"}
          </p>
        )}
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
            No patients yet. PIDs are issued when staff marks a booking Paid.
          </CardContent>
        </Card>
      ) : (
        <PatientsTable
          data={rows}
          onDelete={remove}
          deletingPid={deletingPid}
        />
      )}
    </div>
  )
}
