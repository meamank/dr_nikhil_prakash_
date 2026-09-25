import { beforeAll, expect, mock, test } from "bun:test"

const reportRows = [
  {
    id: "cash-paid",
    patientPid: "PID1",
    patientName: "Cash Patient",
    patientMobile: "9000000001",
    clinic: "juran_chhapra",
    queueNumber: 1,
    scheduledAt: new Date("2026-09-01T06:30:00Z"),
    status: "done",
    paymentStatus: "paid",
    paymentMode: "cash",
  },
  {
    id: "upi-paid",
    patientPid: "PID2",
    patientName: "UPI Patient",
    patientMobile: "9000000002",
    clinic: "bhagwanpur",
    queueNumber: 2,
    scheduledAt: new Date("2026-09-01T07:30:00Z"),
    status: "in_progress",
    paymentStatus: "paid",
    paymentMode: "upi",
  },
  {
    id: "mode-missing",
    patientPid: "PID3",
    patientName: "Unknown Mode",
    patientMobile: "9000000003",
    clinic: "juran_chhapra",
    queueNumber: 3,
    scheduledAt: new Date("2026-09-02T06:30:00Z"),
    status: "paid",
    paymentStatus: "paid",
    paymentMode: null,
  },
  {
    id: "refunded",
    patientPid: "PID4",
    patientName: "Refunded Patient",
    patientMobile: "9000000004",
    clinic: "juran_chhapra",
    queueNumber: 4,
    scheduledAt: new Date("2026-09-02T07:30:00Z"),
    status: "refunded",
    paymentStatus: "refunded",
    paymentMode: "cash",
  },
  {
    id: "foc",
    patientPid: "PID5",
    patientName: "FOC Patient",
    patientMobile: "9000000005",
    clinic: "juran_chhapra",
    queueNumber: 5,
    scheduledAt: new Date("2026-09-02T08:30:00Z"),
    status: "foc",
    paymentStatus: "foc",
    paymentMode: null,
  },
  {
    id: "unpaid",
    patientPid: null,
    patientName: "Unpaid Patient",
    patientMobile: "9000000006",
    clinic: "juran_chhapra",
    queueNumber: 6,
    scheduledAt: new Date("2026-09-02T09:30:00Z"),
    status: "no_show",
    paymentStatus: "unpaid",
    paymentMode: null,
  },
]

let role = "staff"
mock.module("../src/auth", () => ({
  createAuth: () => ({
    api: { getSession: async () => ({ user: { role } }) },
  }),
}))
mock.module("../src/db", () => ({
  createDb: () => ({
    select: () => ({
      from: () => ({
        where: () => ({ orderBy: async () => reportRows }),
      }),
    }),
  }),
}))

let booking: Awaited<typeof import("../src/routes/booking")>["default"]
beforeAll(async () => {
  booking = (await import("../src/routes/booking")).default
})

test("report reconciles paid, refunded, FOC, and unpaid appointments", async () => {
  role = "staff"
  const response = await booking.request(
    "/reports?from=2026-09-01&to=2026-09-02",
    {},
    { DB: {} } as never,
  )
  expect(response.status).toBe(200)
  const report = (await response.json()) as {
    summary: Record<string, number>
    daily: Array<{ date: string; revenue: number }>
    appointments: Array<{ id: string; netAmount: number }>
  }

  expect(report.summary).toMatchObject({
    totalAppointments: 6,
    paidAppointments: 3,
    focAppointments: 1,
    refundedAppointments: 1,
    notPaidAppointments: 1,
    grossRecordedCollections: 2000,
    refunds: 500,
    netRevenue: 1500,
    expectedCash: 500,
    expectedUpi: 500,
    unallocatedNet: 500,
  })
  expect(report.daily).toHaveLength(2)
  expect(report.daily.reduce((sum, day) => sum + day.revenue, 0)).toBe(1500)
  expect(report.appointments.find((row) => row.id === "refunded")?.netAmount).toBe(-500)
})

test("report is restricted to staff and admin roles", async () => {
  role = "user"
  const response = await booking.request("/reports", {}, { DB: {} } as never)
  expect(response.status).toBe(403)
})
