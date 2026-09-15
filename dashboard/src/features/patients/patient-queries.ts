import { queryOptions } from "@tanstack/react-query"
import { apiGet } from "@/lib/api"

export type Patient = {
  pid: string
  userId: string | null
  fullName: string
  mobile: string
  address: string | null
  ageYears: number | null
  gender: string | null
  isFirstLogin: boolean | number
  createdAt: string | number
}

export const patientKeys = {
  all: ["patients"] as const,
  detail: (patientId: string) => ["patient", patientId] as const,
}

export function patientQueryOptions(patientId: string) {
  return queryOptions({
    queryKey: patientKeys.detail(patientId),
    queryFn: async ({ signal }) => {
      const data = await apiGet<{ patient?: Patient }>(
        `/api/patients/${encodeURIComponent(patientId)}`,
        { signal }
      )
      if (!data.patient) throw new Error("Patient not found")
      return data.patient
    },
    staleTime: 30_000,
  })
}
