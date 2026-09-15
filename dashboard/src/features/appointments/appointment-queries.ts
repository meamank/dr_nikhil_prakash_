import { queryOptions } from "@tanstack/react-query"
import { apiGet } from "@/lib/api"
import type { AppointmentRow } from "./appointment-row"

export type Clinic = "juran_chhapra" | "bhagwanpur"

export function todayIST(): string {
  const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000)
  return ist.toISOString().slice(0, 10)
}

export const appointmentKeys = {
  all: ["appointments"] as const,
  list: (clinic: Clinic, date: string) =>
    ["appointments", { clinic, date }] as const,
}

export function appointmentsQueryOptions(clinic: Clinic, date: string) {
  return queryOptions({
    queryKey: appointmentKeys.list(clinic, date),
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ clinic, date })
      const data = await apiGet<{ appointments?: AppointmentRow[] }>(
        `/api/booking/appointments?${params}`,
        { signal }
      )
      return data.appointments ?? []
    },
    staleTime: 30_000,
  })
}
