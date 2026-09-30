import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Banknote,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  IndianRupee,
  ReceiptText,
  RefreshCw,
  RotateCcw,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { apiGet } from "@/lib/api"
import {
  Route as ReportsRoute,
  type ReportPeriod,
} from "@/routes/_authenticated/reports"

type ReportSummary = {
  totalAppointments: number
  paidAppointments: number
  focAppointments: number
  refundedAppointments: number
  notPaidAppointments: number
  cashPaidAppointments: number
  upiPaidAppointments: number
  unallocatedPaidAppointments: number
  cashRefundedAppointments: number
  upiRefundedAppointments: number
  unallocatedRefundedAppointments: number
  grossRecordedCollections: number
  refunds: number
  netRevenue: number
  cashCollected: number
  cashRefunded: number
  expectedCash: number
  upiCollected: number
  upiRefunded: number
  expectedUpi: number
  unallocatedCollected: number
  unallocatedRefunded: number
  unallocatedNet: number
}

type DailyReport = {
  date: string
  total: number
  paid: number
  foc: number
  refunded: number
  notPaid: number
  cashRevenue: number
  upiRevenue: number
  unallocatedRevenue: number
  revenue: number
}

type ReportAppointment = {
  id: string
  patientPid: string | null
  patientName: string
  patientMobile: string
  clinic: "juran_chhapra" | "bhagwanpur"
  queueNumber: number
  scheduledAt: string | number
  reportDate: string
  status: string
  paymentStatus: "unpaid" | "paid" | "foc" | "refunded"
  paymentMode: "cash" | "upi" | null
  netAmount: number
}

type ReportResponse = {
  period: ReportPeriod
  from: string
  to: string
  clinic: "all" | "juran_chhapra" | "bhagwanpur"
  appointmentFee: number
  summary: ReportSummary
  daily: DailyReport[]
  appointments: ReportAppointment[]
}

const periods: Array<{ value: ReportPeriod; label: string }> = [
  { value: "1d", label: "1 day" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "180d", label: "6 months" },
  { value: "custom", label: "Custom range" },
]

const LEDGER_PAGE_SIZE = 50

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

function todayIst(): string {
  return new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function startForPeriod(period: Exclude<ReportPeriod, "custom">): string {
  const days = Number(period.slice(0, -1))
  const now = new Date(`${todayIst()}T00:00:00Z`)
  now.setUTCDate(now.getUTCDate() - days + 1)
  return now.toISOString().slice(0, 10)
}

function displayDate(value: string): string {
  const [year, month, day] = value.split("-")
  return year && month && day ? `${day}-${month}-${year}` : value
}

function clinicLabel(value: string): string {
  return value === "bhagwanpur" ? "Bhagwanpur" : "Juran Chhapra"
}

function statusLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function PaymentBadge({
  status,
}: {
  status: ReportAppointment["paymentStatus"]
}) {
  const variant =
    status === "paid"
      ? "default"
      : status === "refunded"
        ? "destructive"
        : status === "foc"
          ? "secondary"
          : "outline"
  return (
    <Badge variant={variant}>
      {status === "foc" ? "FOC" : statusLabel(status)}
    </Badge>
  )
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "default",
}: {
  title: string
  value: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  tone?: "default" | "positive" | "negative"
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardDescription>{title}</CardDescription>
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <CardTitle
          className={`mt-1 text-2xl tabular-nums ${
            tone === "positive"
              ? "text-emerald-600 dark:text-emerald-400"
              : tone === "negative"
                ? "text-destructive"
                : ""
          }`}
        >
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">
        {description}
      </CardContent>
    </Card>
  )
}

export default function ReportsPage() {
  const [ledgerPage, setLedgerPage] = useState(0)
  const search = ReportsRoute.useSearch()
  const navigate = ReportsRoute.useNavigate()
  const period = search.period ?? "1d"
  const clinic = search.clinic ?? "all"
  const effectivePreset = period === "custom" ? "1d" : period
  const displayedFrom =
    search.from ??
    startForPeriod(effectivePreset as Exclude<ReportPeriod, "custom">)
  const displayedTo = search.to ?? todayIst()
  const params = new URLSearchParams()
  if (period === "custom") {
    params.set("from", displayedFrom)
    params.set("to", displayedTo)
  } else {
    params.set("period", period)
    if (search.from && search.to) {
      params.set("from", search.from)
      params.set("to", search.to)
    }
  }
  if (clinic !== "all") params.set("clinic", clinic)

  const reportQuery = useQuery({
    queryKey: ["reports", params.toString()],
    queryFn: ({ signal }) =>
      apiGet<ReportResponse>(`/api/booking/reports?${params}`, { signal }),
    staleTime: 30_000,
  })
  const report = reportQuery.data
  const summary = report?.summary
  const effectivePeriodValue = period
  const ledgerPageCount = Math.max(
    1,
    Math.ceil((report?.appointments.length ?? 0) / LEDGER_PAGE_SIZE)
  )
  const safeLedgerPage = Math.min(ledgerPage, ledgerPageCount - 1)
  const ledgerStart = safeLedgerPage * LEDGER_PAGE_SIZE
  const visibleAppointments =
    report?.appointments.slice(ledgerStart, ledgerStart + LEDGER_PAGE_SIZE) ??
    []

  function choosePeriod(next: ReportPeriod) {
    setLedgerPage(0)
    if (next === "custom") {
      navigate({
        search: (current) => ({
          ...current,
          period: "custom",
          from: displayedFrom,
          to: displayedTo,
        }),
      })
      return
    }
    navigate({
      search: (current) => ({
        ...current,
        period: next,
        from: undefined,
        to: undefined,
      }),
    })
  }

  function chooseFrom(from: string) {
    setLedgerPage(0)
    if (period === "1d") {
      navigate({
        search: (current) => ({
          ...current,
          period: "1d",
          from,
          to: from,
        }),
      })
      return
    }
    navigate({
      search: (current) => ({
        ...current,
        period: "custom",
        from,
        to: displayedTo < from ? from : displayedTo,
      }),
    })
  }

  function chooseTo(to: string) {
    setLedgerPage(0)
    navigate({
      search: (current) => ({
        ...current,
        period: "custom",
        from: displayedFrom > to ? to : displayedFrom,
        to,
      }),
    })
  }

  return (
    <main className="flex flex-col gap-6 p-4 md:p-6">
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="report-period">Period</Label>
            <NativeSelect
              id="report-period"
              value={effectivePeriodValue}
              onChange={(event) =>
                choosePeriod(event.target.value as ReportPeriod)
              }
            >
              {periods.map((option) => (
                <NativeSelectOption key={option.value} value={option.value}>
                  {option.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="report-from">
              {period === "1d" ? "Report date" : "From"}
            </Label>
            <Input
              id="report-from"
              type="date"
              value={displayedFrom}
              max={displayedTo}
              onChange={(event) => chooseFrom(event.target.value)}
            />
          </div>
          {period !== "1d" && (
            <div className="grid gap-1.5">
              <Label htmlFor="report-to">To</Label>
              <Input
                id="report-to"
                type="date"
                value={displayedTo}
                min={displayedFrom}
                max={todayIst()}
                onChange={(event) => chooseTo(event.target.value)}
              />
            </div>
          )}
          <div className="grid gap-1.5">
            <Label htmlFor="report-clinic">Clinic</Label>
            <NativeSelect
              id="report-clinic"
              value={clinic}
              onChange={(event) => {
                setLedgerPage(0)
                navigate({
                  search: (current) => ({
                    ...current,
                    clinic: event.target.value as
                      "all" | "juran_chhapra" | "bhagwanpur",
                  }),
                })
              }}
            >
              <NativeSelectOption value="all">All clinics</NativeSelectOption>
              <NativeSelectOption value="juran_chhapra">
                Juran Chhapra
              </NativeSelectOption>
              <NativeSelectOption value="bhagwanpur">
                Bhagwanpur
              </NativeSelectOption>
            </NativeSelect>
          </div>
          <Button
            type="button"
            variant="outline"
            className="ml-auto"
            onClick={() => void reportQuery.refetch()}
            disabled={reportQuery.isFetching}
          >
            <RefreshCw
              className={reportQuery.isFetching ? "animate-spin" : ""}
            />
            Refresh
          </Button>
        </CardContent>
      </Card>

      {reportQuery.error && (
        <p
          role="alert"
          className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {reportQuery.error instanceof Error
            ? reportQuery.error.message
            : "Couldn’t load the report."}
        </p>
      )}

      {reportQuery.isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Loading clinic report…
          </CardContent>
        </Card>
      ) : report && summary ? (
        <>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="size-4" />
            <span>
              {displayDate(report.from)} to {displayDate(report.to)}
            </span>
            <span>•</span>
            <span>
              {report.clinic === "all"
                ? "All clinics"
                : clinicLabel(report.clinic)}
            </span>
            <span>•</span>
            <span>
              {inr.format(report.appointmentFee)} per paid appointment
            </span>
          </div>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Net revenue"
              value={inr.format(summary.netRevenue)}
              description={`${summary.paidAppointments} currently paid appointments`}
              icon={IndianRupee}
              tone="positive"
            />
            <MetricCard
              title="Expected cash"
              value={inr.format(summary.expectedCash)}
              description={`${summary.cashPaidAppointments} cash-paid appointments`}
              icon={Banknote}
            />
            <MetricCard
              title="Expected UPI"
              value={inr.format(summary.expectedUpi)}
              description={`${summary.upiPaidAppointments} UPI-paid appointments`}
              icon={CreditCard}
            />
            <MetricCard
              title="Refunded"
              value={inr.format(summary.refunds)}
              description={`${summary.refundedAppointments} refunded appointments`}
              icon={RotateCcw}
              tone={summary.refunds > 0 ? "negative" : "default"}
            />
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Total appointments", summary.totalAppointments, "outline"],
              ["Paid", summary.paidAppointments, "default"],
              ["FOC", summary.focAppointments, "secondary"],
              ["Refunded", summary.refundedAppointments, "destructive"],
              ["Not paid", summary.notPaidAppointments, "outline"],
            ].map(([label, count, variant]) => (
              <Card key={String(label)} size="sm">
                <CardHeader className="grid grid-cols-[1fr_auto] items-center gap-3">
                  <CardDescription>{label}</CardDescription>
                  <Badge
                    variant={
                      variant as
                        "default" | "secondary" | "destructive" | "outline"
                    }
                  >
                    {count}
                  </Badge>
                </CardHeader>
              </Card>
            ))}
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Collection reconciliation</CardTitle>
              <CardDescription>
                Match recorded collections and refunds against cash and UPI
                settlements.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment channel</TableHead>
                    <TableHead className="text-right">
                      Recorded collection
                    </TableHead>
                    <TableHead className="text-right">Refunded</TableHead>
                    <TableHead className="text-right">
                      Expected balance
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <ReconciliationRow
                    label="Cash"
                    collected={summary.cashCollected}
                    refunded={summary.cashRefunded}
                    expected={summary.expectedCash}
                  />
                  <ReconciliationRow
                    label="UPI"
                    collected={summary.upiCollected}
                    refunded={summary.upiRefunded}
                    expected={summary.expectedUpi}
                  />
                  {summary.unallocatedCollected > 0 && (
                    <ReconciliationRow
                      label="Payment mode missing"
                      collected={summary.unallocatedCollected}
                      refunded={summary.unallocatedRefunded}
                      expected={summary.unallocatedNet}
                      warning
                    />
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell>All channels</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {inr.format(summary.grossRecordedCollections)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-destructive tabular-nums">
                      {inr.format(summary.refunds)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold tabular-nums">
                      {inr.format(summary.netRevenue)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daily breakdown</CardTitle>
              <CardDescription>
                Appointment and revenue totals for each clinic day.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">FOC</TableHead>
                    <TableHead className="text-right">Refunded</TableHead>
                    <TableHead className="text-right">Not paid</TableHead>
                    <TableHead className="text-right">Cash</TableHead>
                    <TableHead className="text-right">UPI</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.daily.length ? (
                    report.daily.map((day) => (
                      <TableRow key={day.date}>
                        <TableCell className="font-medium">
                          {displayDate(day.date)}
                        </TableCell>
                        <NumberCell value={day.total} />
                        <NumberCell value={day.paid} />
                        <NumberCell value={day.foc} />
                        <NumberCell value={day.refunded} />
                        <NumberCell value={day.notPaid} />
                        <MoneyCell value={day.cashRevenue} />
                        <MoneyCell value={day.upiRevenue} />
                        <MoneyCell value={day.revenue} strong />
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No appointments in this period.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ReceiptText className="size-4" /> Appointment ledger
              </CardTitle>
              <CardDescription>
                {report.appointments.length
                  ? `Showing ${ledgerStart + 1}–${Math.min(ledgerStart + LEDGER_PAGE_SIZE, report.appointments.length)} of ${report.appointments.length} appointments, newest first.`
                  : "Every appointment included in this report, newest first."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table containerClassName="max-h-[34rem]">
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Clinic / Queue</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>PID</TableHead>
                    <TableHead>Visit status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead className="text-right">Net amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.appointments.length ? (
                    visibleAppointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>
                          {displayDate(appointment.reportDate)}
                        </TableCell>
                        <TableCell>
                          {clinicLabel(appointment.clinic)} · #
                          {appointment.queueNumber}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {appointment.patientName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {appointment.patientMobile}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {appointment.patientPid ?? "—"}
                        </TableCell>
                        <TableCell>{statusLabel(appointment.status)}</TableCell>
                        <TableCell>
                          <PaymentBadge status={appointment.paymentStatus} />
                        </TableCell>
                        <TableCell>
                          {appointment.paymentMode?.toUpperCase() ?? "—"}
                        </TableCell>
                        <TableCell
                          className={`text-right font-mono tabular-nums ${appointment.netAmount < 0 ? "text-destructive" : ""}`}
                        >
                          {appointment.netAmount === 0
                            ? "—"
                            : inr.format(appointment.netAmount)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No appointments in this period.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {report.appointments.length > LEDGER_PAGE_SIZE && (
                <div className="flex items-center justify-between gap-3 border-t px-2 pt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {safeLedgerPage + 1} of {ledgerPageCount}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={safeLedgerPage === 0}
                      onClick={() =>
                        setLedgerPage(Math.max(0, safeLedgerPage - 1))
                      }
                    >
                      <ChevronLeft /> Previous
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={safeLedgerPage >= ledgerPageCount - 1}
                      onClick={() =>
                        setLedgerPage(
                          Math.min(ledgerPageCount - 1, safeLedgerPage + 1)
                        )
                      }
                    >
                      Next <ChevronRight />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </main>
  )
}

function ReconciliationRow({
  label,
  collected,
  refunded,
  expected,
  warning = false,
}: {
  label: string
  collected: number
  refunded: number
  expected: number
  warning?: boolean
}) {
  return (
    <TableRow>
      <TableCell
        className={
          warning
            ? "font-medium text-amber-600 dark:text-amber-400"
            : "font-medium"
        }
      >
        {label}
      </TableCell>
      <MoneyCell value={collected} />
      <MoneyCell value={refunded} negative />
      <MoneyCell value={expected} strong />
    </TableRow>
  )
}

function MoneyCell({
  value,
  strong = false,
  negative = false,
}: {
  value: number
  strong?: boolean
  negative?: boolean
}) {
  return (
    <TableCell
      className={`text-right font-mono tabular-nums ${strong ? "font-semibold" : ""} ${negative && value ? "text-destructive" : ""}`}
    >
      {inr.format(value)}
    </TableCell>
  )
}

function NumberCell({ value }: { value: number }) {
  return <TableCell className="text-right tabular-nums">{value}</TableCell>
}
