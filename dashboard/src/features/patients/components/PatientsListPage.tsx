import { useEffect, useState } from "react"
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { apiDelete, apiGet, apiPost } from "@/lib/api"
import { PatientsTable, type PatientRow } from "./patients-table"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { AddPatientSheet, type NewPatient } from "./AddPatientSheet"
import { Route, type PatientClinic } from "@/routes/_authenticated/patients/index"

function todayIST(): string {
  const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000)
  return ist.toISOString().slice(0, 10)
}

function matchesPatientSearch(patient: PatientRow, query: string) {
  const search = query.trim().toLowerCase()
  if (!search) return true
  return (
    patient.fullName.toLowerCase().startsWith(search) ||
    patient.mobile.includes(search) ||
    patient.pid.toLowerCase().includes(search) ||
    patient.address?.toLowerCase().includes(search) === true
  )
}

export default function PatientsListPage() {
  const queryClient = useQueryClient()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const clinic = search.clinic ?? "bhagwanpur"
  const showAll = search.scope === "all"
  const date = search.date ?? todayIST()
  const appliedQuery = search.query ?? ""
  const allPatientsPagination = {
    pageIndex: search.page ?? 0,
    pageSize: search.pageSize ?? 30,
  }
  const [q, setQ] = useState(appliedQuery)
  const [pendingPid, setPendingPid] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    // Back/forward navigation can restore a different applied URL search.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQ(appliedQuery)
  }, [appliedQuery])
  const key = [
    "patients",
    {
      clinic,
      date: showAll ? null : date,
      q: showAll ? appliedQuery : "",
      pageIndex: showAll ? allPatientsPagination.pageIndex : 0,
      pageSize: showAll ? allPatientsPagination.pageSize : 100,
    },
  ] as const
  const patientsQuery = useQuery({
    queryKey: key,
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({
        clinic,
        limit: `${showAll ? allPatientsPagination.pageSize : 100}`,
      })
      if (showAll && appliedQuery) params.set("q", appliedQuery)
      if (showAll) {
        params.set(
          "offset",
          `${allPatientsPagination.pageIndex * allPatientsPagination.pageSize}`
        )
      }
      if (!showAll) params.set("date", date)
      const data = await apiGet<{
        patients?: PatientRow[]
        total?: number
      }>(`/api/patients?${params}`, { signal })
      return {
        patients: data.patients ?? [],
        total: data.total ?? 0,
      }
    },
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  })
  const rows = patientsQuery.data?.patients ?? []
  const total = patientsQuery.data?.total ?? 0
  const visibleRows = showAll
    ? rows
    : rows.filter((patient) => matchesPatientSearch(patient, q))
  const displayedTotal = showAll ? total : visibleRows.length
  const lastPage = Math.max(
    0,
    Math.ceil(displayedTotal / allPatientsPagination.pageSize) - 1
  )

  useEffect(() => {
    if (
      showAll &&
      patientsQuery.isSuccess &&
      !patientsQuery.isPlaceholderData &&
      allPatientsPagination.pageIndex > lastPage
    ) {
      navigate({
        replace: true,
        search: (current) => ({ ...current, page: lastPage }),
      })
    }
  }, [
    allPatientsPagination.pageIndex,
    lastPage,
    navigate,
    patientsQuery.isPlaceholderData,
    patientsQuery.isSuccess,
    showAll,
  ])

  const deletePatientMutation = useMutation({
    mutationFn: (pid: string) =>
      apiDelete(`/api/patients/${encodeURIComponent(pid)}`),
    onSuccess: (_data, pid) => {
      toast.success(`Patient ${pid} deleted`)
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ["patients"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ])
    },
  })

  const createPatientMutation = useMutation({
    mutationFn: (patient: NewPatient) =>
      apiPost<{ patient?: PatientRow }>("/api/patients", patient),
    onSuccess: (data) => {
      toast.success(`Patient ${data.patient?.pid ?? ""} added`)
      setAdding(false)
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ["patients"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ])
    },
  })
  const requestError =
    patientsQuery.error ?? deletePatientMutation.error ?? createPatientMutation.error

  function confirmDelete() {
    if (!pendingPid) return
    const pid = pendingPid
    setPendingPid(null)
    deletePatientMutation.mutate(pid)
  }

  function searchAllPatients() {
    const nextQuery = q.trim()
    if (nextQuery === appliedQuery && allPatientsPagination.pageIndex === 0) {
      void queryClient.invalidateQueries({ queryKey: key })
      return
    }
    navigate({
      search: (current) => ({
        ...current,
        query: nextQuery || undefined,
        page: 0,
      }),
    })
  }

  function togglePatientScope() {
    if (showAll) {
      navigate({
        search: (current) => ({
          ...current,
          scope: undefined,
          query: undefined,
          page: 0,
        }),
      })
      return
    }
    setQ("")
    navigate({
      search: (current) => ({
        ...current,
        scope: "all",
        query: undefined,
        page: 0,
      }),
    })
  }

  const pendingPatient = visibleRows.find((r) => r.pid === pendingPid)

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="patients-clinic" className="text-sm font-medium">
            Clinic
          </label>
          <NativeSelect
            id="patients-clinic"
            value={clinic}
            onChange={(event) => {
              const nextClinic = event.target.value as PatientClinic
              navigate({
                search: (current) => ({
                  ...current,
                  clinic: nextClinic,
                  page: 0,
                }),
              })
            }}
            className="w-40"
          >
            <NativeSelectOption value="bhagwanpur">Fardo Gola</NativeSelectOption>
            <NativeSelectOption value="juran_chhapra">
              Juran Chhapra
            </NativeSelectOption>
            <NativeSelectOption value="all">All clinics</NativeSelectOption>
          </NativeSelect>
        </div>
        <div className="flex items-end gap-2">
          {!showAll && (
            <div className="flex flex-col gap-2">
              <label htmlFor="patients-date" className="text-sm font-medium">
                Patients added on
              </label>
              <Input
                id="patients-date"
                type="date"
                value={date}
                onChange={(event) =>
                  navigate({
                    search: (current) => ({
                      ...current,
                      date: event.target.value,
                      page: 0,
                    }),
                  })
                }
                className="w-auto"
              />
            </div>
          )}
          <Button
            variant={showAll ? "default" : "outline"}
            onClick={togglePatientScope}
          >
            {showAll ? "Date view" : "All patients"}
          </Button>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Search PID, name, mobile, address…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(event) => {
              if (showAll && event.key === "Enter") searchAllPatients()
            }}
            className="w-64"
          />
          {showAll && (
            <Button variant="outline" onClick={searchAllPatients}>
              Search
            </Button>
          )}
        </div>
        <Button
          variant="ghost"
          onClick={() => queryClient.invalidateQueries({ queryKey: key })}
          disabled={patientsQuery.isFetching}
        >
          {patientsQuery.isFetching ? "Loading…" : "Refresh"}
        </Button>
        <div className="ml-auto flex items-center gap-3">
          {displayedTotal > 0 && (
            <p className="text-sm text-muted-foreground">
              {displayedTotal} patient{displayedTotal === 1 ? "" : "s"}
            </p>
          )}
          <Button onClick={() => setAdding(true)}>+ Add patient</Button>
        </div>
      </div>

      {requestError && (
        <p
          role="alert"
          className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {requestError instanceof Error
            ? requestError.message
            : "Could not update patients."}
        </p>
      )}

      {visibleRows.length === 0 && !patientsQuery.isLoading ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No patients match these filters.
          </CardContent>
        </Card>
      ) : (
        <>
          <PatientsTable
            data={visibleRows}
            onDelete={setPendingPid}
            deletingPid={
              deletePatientMutation.isPending
                ? deletePatientMutation.variables ?? null
                : null
            }
            pagination={showAll ? allPatientsPagination : undefined}
            onPaginationChange={
              showAll
                ? (next) => {
                    const pagination =
                      typeof next === "function"
                        ? next(allPatientsPagination)
                        : next
                    navigate({
                      search: (current) => ({
                        ...current,
                        page: pagination.pageIndex,
                        pageSize: pagination.pageSize,
                      }),
                    })
                  }
                : undefined
            }
            rowCount={showAll ? total : undefined}
            loading={showAll && patientsQuery.isFetching}
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
            loading={deletePatientMutation.isPending}
          />
        </>
      )}
      <AddPatientSheet
        open={adding}
        onOpenChange={setAdding}
        onSave={(patient) => createPatientMutation.mutate(patient)}
        saving={createPatientMutation.isPending}
      />
    </div>
  )
}
