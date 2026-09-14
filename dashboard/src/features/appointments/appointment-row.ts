import { z } from "zod"

export const appointmentRowSchema = z.object({
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

export type AppointmentRow = z.infer<typeof appointmentRowSchema>
