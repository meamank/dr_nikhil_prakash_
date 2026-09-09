import * as React from "react"
import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  FlexRender,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type ColumnFiltersState,
  type ColumnVisibilityState,
  type SortingState,
} from "@tanstack/react-table"
import { z } from "zod"
import { Link } from "@tanstack/react-router"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  CircleCheckIcon,
  LoaderIcon,
  ChevronsLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsRightIcon,
} from "lucide-react"

const features = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
})

const columnHelper = createColumnHelper<
  typeof features,
  z.infer<typeof schema>
>()

export const schema = z.object({
  id: z.string(),
  patientPid: z.string().nullable(),
  patientName: z.string(),
  patientMobile: z.string(),
  patientAddress: z.string().nullable(),
  patientGender: z.string().nullable(),
  patientAgeYears: z.number().nullable(),
  clinic: z.string(),
  queueNumber: z.number(),
  scheduledAt: z.union([z.string(), z.number()]),
  status: z.string(),
  paymentStatus: z.string(),
  createdAt: z.union([z.string(), z.number()]),
})

export type AppointmentRow = z.infer<typeof schema>

const STATUS_LABELS: Record<string, string> = {
  not_paid: "Not Paid",
  paid: "Paid",
  in_progress: "In Progress",
  done: "Done",
  cancelled: "Cancelled",
  no_show: "No Show",
}

function statusBadge(status: string) {
  const label = STATUS_LABELS[status] ?? status
  // Paid: green · Done: sky · In Progress: yellow · Not Paid/Cancelled: destructive · No Show: default
  switch (status) {
    case "paid":
      return (
        <Badge className="bg-green-600 px-1.5 text-white hover:bg-green-600/90">
          <CircleCheckIcon className="fill-white text-green-600" />
          {label}
        </Badge>
      )
    case "done":
      return (
        <Badge className="bg-sky-500 px-1.5 text-white hover:bg-sky-500/90">
          <CircleCheckIcon className="fill-white text-sky-500" />
          {label}
        </Badge>
      )
    case "in_progress":
      return (
        <Badge className="bg-yellow-500 px-1.5 text-white hover:bg-yellow-500/90">
          <LoaderIcon />
          {label}
        </Badge>
      )
    case "not_paid":
    case "cancelled":
      return (
        <Badge variant="destructive" className="px-1.5">
          <LoaderIcon />
          {label}
        </Badge>
      )
    default:
      return (
        <Badge variant="default" className="px-1.5">
          {label}
        </Badge>
      )
  }
}

export function DataTable({
  data: initialData,
  onMarkPaid,
  payingId,
  onEdit,
  pagination: controlledPagination,
  onPaginationChange: onControlledPaginationChange,
}: {
  data: z.infer<typeof schema>[]
  onMarkPaid?: (id: string) => void
  payingId?: string | null
  onEdit?: (row: z.infer<typeof schema>) => void
  pagination?: { pageIndex: number; pageSize: number }
  onPaginationChange?: React.Dispatch<
    React.SetStateAction<{ pageIndex: number; pageSize: number }>
  >
}) {
  const columns = React.useMemo(
    () =>
      columnHelper.columns([
        columnHelper.display({
          id: "select",
          header: ({ table }) => (
            <div className="flex items-center justify-center">
              <Checkbox
                checked={
                  table.getIsAllPageRowsSelected() ||
                  (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) =>
                  table.toggleAllPageRowsSelected(!!value)
                }
                aria-label="Select all"
              />
            </div>
          ),
          cell: ({ row }) => (
            <div className="flex items-center justify-center">
              <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
              />
            </div>
          ),
          enableSorting: false,
          enableHiding: false,
        }),
        columnHelper.accessor("queueNumber", {
          header: "SNo.",
          cell: ({ row }) => (
            <span className="grid h-9 w-9 place-items-center text-base font-extrabold tabular-nums">
              {row.original.queueNumber}
            </span>
          ),
        }),
        columnHelper.accessor("patientName", {
          header: "Patient Name",
          cell: ({ row }) =>
            row.original.patientPid ? (
              <Link
                to="/patients/$patientId"
                params={{ patientId: row.original.patientPid }}
                className="font-medium hover:underline hover:underline-offset-4"
              >
                {row.original.patientName.toUpperCase()}
              </Link>
            ) : (
              <p className="font-medium">
                {row.original.patientName.toUpperCase()}
              </p>
            ),
          enableHiding: false,
        }),
        columnHelper.accessor("patientAddress", {
          header: "Address",
          cell: ({ row }) => (
            <div>
              <p>{row.original.patientAddress?.toUpperCase()}</p>
            </div>
          ),
          enableHiding: false,
        }),
        columnHelper.accessor("patientGender", {
          header: "Gender",
          cell: ({ row }) => (
            <div>
              <p>{row.original.patientGender?.toUpperCase()}</p>
            </div>
          ),
          enableHiding: false,
        }),
        columnHelper.accessor("patientAgeYears", {
          header: "Age",
          cell: ({ row }) => (
            <div>
              <p className="tabular-nums">{row.original.patientAgeYears}</p>
            </div>
          ),
          enableHiding: false,
        }),
        columnHelper.accessor("patientMobile", {
          header: "Mobile",
          cell: ({ row }) => (
            <span className="tabular-nums">{row.original.patientMobile}</span>
          ),
        }),
        columnHelper.accessor("status", {
          header: "Status",
          cell: ({ row }) => statusBadge(row.original.status),
        }),
        columnHelper.accessor("patientPid", {
          header: "PID",
          cell: ({ row }) =>
            row.original.patientPid ? (
              <Badge variant="secondary">{row.original.patientPid}</Badge>
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            ),
        }),
        columnHelper.display({
          id: "actions",
          header: () => <div className="text-right">Action</div>,
          cell: ({ row }) => (
            <div className="flex justify-end gap-2">
              {onEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(row.original)}
                >
                  Edit
                </Button>
              )}
              {onMarkPaid &&
                !row.original.patientPid &&
                row.original.status !== "cancelled" && (
                  <Button
                    size="sm"
                    disabled={payingId === row.original.id}
                    onClick={() => onMarkPaid(row.original.id)}
                  >
                    {payingId === row.original.id ? "Issuing…" : "Mark Paid"}
                  </Button>
                )}
            </div>
          ),
        }),
      ]),
    [onMarkPaid, payingId, onEdit]
  )

  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<ColumnVisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "queueNumber", desc: false },
  ])
  const [localPagination, setLocalPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const pagination = controlledPagination ?? localPagination
  const onPaginationChange = onControlledPaginationChange ?? setLocalPagination

  const table = useTable({
    features,
    data: initialData,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id,
    // Refreshing after Edit/Mark Paid replaces the data array. Keep reception on
    // the page they were working on instead of resetting to page 1.
    autoResetPageIndex: false,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange,
  })

  return (
    <div className="flex w-full flex-col justify-start gap-4">
      <div className="grid gap-3 md:hidden">
        {table.getRowModel().rows.length ? (
          table.getRowModel().rows.map((row) => {
            const appointment = row.original

            return (
              <div key={row.id} className="rounded-lg border p-3">
                <div className="flex items-start gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-md bg-muted text-base font-semibold tabular-nums">
                    {appointment.queueNumber}
                  </span>
                  <div className="min-w-0 flex-1">
                    {appointment.patientPid ? (
                      <Link
                        to="/patients/$patientId"
                        params={{ patientId: appointment.patientPid }}
                        className="block truncate text-sm font-medium hover:underline hover:underline-offset-4"
                      >
                        {appointment.patientName.toUpperCase()}
                      </Link>
                    ) : (
                      <p className="truncate text-sm font-medium">
                        {appointment.patientName.toUpperCase()}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-muted-foreground">
                      {appointment.patientAddress?.toUpperCase() ||
                        "Address not recorded"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-start gap-1">
                    {onEdit && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="px-2 text-xs"
                        onClick={() => onEdit(appointment)}
                      >
                        Edit
                      </Button>
                    )}
                    {onMarkPaid &&
                      !appointment.patientPid &&
                      appointment.status !== "cancelled" && (
                        <Button
                          size="sm"
                          className="px-2 text-xs"
                          disabled={payingId === appointment.id}
                          onClick={() => onMarkPaid(appointment.id)}
                        >
                          {payingId === appointment.id
                            ? "Issuing…"
                            : "Mark Paid"}
                        </Button>
                      )}
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="rounded-lg border py-10 text-center text-sm text-muted-foreground">
            No results.
          </div>
        )}
      </div>

      <div className="hidden overflow-hidden rounded-lg border md:block">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : (
                      <FlexRender header={header} />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-4">
        <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">
              Rows per page
            </Label>
            <Select
              value={`${table.state.pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                <SelectValue placeholder={table.state.pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                <SelectGroup>
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            Page {table.state.pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeftIcon />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRightIcon />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRightIcon />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
