import { createContext, useContext, useState, type ReactNode } from "react"

type AppointmentSummary = {
  count: number
  lastQueueNumber: number
} | null

const AppointmentsHeaderContext = createContext<{
  summary: AppointmentSummary
  setSummary: (summary: AppointmentSummary) => void
} | null>(null)

export function AppointmentsHeaderProvider({ children }: { children: ReactNode }) {
  const [summary, setSummary] = useState<AppointmentSummary>(null)

  return (
    <AppointmentsHeaderContext.Provider value={{ summary, setSummary }}>
      {children}
    </AppointmentsHeaderContext.Provider>
  )
}

export function useAppointmentsHeader() {
  const context = useContext(AppointmentsHeaderContext)
  if (!context) {
    throw new Error("useAppointmentsHeader must be used within its provider")
  }
  return context
}
