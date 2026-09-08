import { sql } from "drizzle-orm"
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core"

// ---------------------------------------------------------------------------
// better-auth managed tables
// (better-auth will auto-create these via its migration, but we declare them
//  here so Drizzle relations and our own queries are type-safe)
// ---------------------------------------------------------------------------

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .notNull()
    .default(false),
  image: text("image"),
  // better-auth phoneNumber plugin adds these:
  phoneNumber: text("phone_number"),
  phoneNumberVerified: integer("phone_number_verified", { mode: "boolean" })
    .notNull()
    .default(false),
  // better-auth username plugin adds this (we store PID here for walk-in patients):
  username: text("username"),
  // Our custom fields:
  role: text("role", { enum: ["admin", "staff", "user"] })
    .notNull()
    .default("user"),
  isFirstLogin: integer("is_first_login", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  issuer: text("issuer"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
})

// ---------------------------------------------------------------------------
// PID counter — single-row table for atomic PID generation
// ---------------------------------------------------------------------------

export const pidCounter = sqliteTable("pid_counter", {
  id: integer("id").primaryKey().default(1),
  value: integer("value").notNull().default(0),
})

// ---------------------------------------------------------------------------
// Clinic domain tables
// ---------------------------------------------------------------------------

export const patients = sqliteTable("patients", {
  // Clinic-generated identifier e.g. "PID000001"
  pid: text("pid").primaryKey(),
  // Linked to a better-auth user if they self-registered or later claimed the record
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  fullName: text("full_name").notNull(),
  mobile: text("mobile").notNull(),
  address: text("address"),
  ageYears: integer("age_years"),
  gender: text("gender", { enum: ["male", "female", "other"] }),
  // Set when a staff member created this record at the front desk
  bookedByStaffId: text("booked_by_staff_id").references(() => user.id, {
    onDelete: "set null",
  }),
  // Walk-in patients have never used the portal — drives OTP flow later
  isFirstLogin: integer("is_first_login", { mode: "boolean" })
    .notNull()
    .default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const appointments = sqliteTable("appointments", {
  id: text("id").primaryKey(), // uuid
  // NULL until staff marks the visit Paid — PID is assigned at check-in.
  // One mobile can book many patients, so the snapshot below is the source
  // of truth for pre-PID requests.
  patientPid: text("patient_pid").references(() => patients.pid, {
    onDelete: "cascade",
  }),
  // Snapshot of who the slot is for (entered at booking time).
  // Single mobile field — the patient's number. Editable via PATCH.
  patientName: text("patient_name").notNull(),
  patientMobile: text("patient_mobile").notNull(),
  patientAddress: text("patient_address"),
  patientGender: text("patient_gender", {
    enum: ["male", "female", "other"],
  }),
  patientAgeYears: integer("patient_age_years"),
  clinic: text("clinic", { enum: ["juran_chhapra", "bhagwanpur"] })
    .notNull()
    .default("juran_chhapra"),
  // Queue number per clinic per day (1, 2, 3…) — shown on the booking success screen.
  queueNumber: integer("queue_number").notNull().default(0),
  // Who booked — either the patient's own userId or a staff userId
  bookedBy: text("booked_by").references(() => user.id, {
    onDelete: "set null",
  }),
  scheduledAt: integer("scheduled_at", { mode: "timestamp" }).notNull(),
  status: text("status", {
    enum: [
      "not_paid",
      "paid",
      "in_progress",
      "done",
      "cancelled",
      "no_show",
    ],
  })
    .notNull()
    .default("not_paid"),
  paymentStatus: text("payment_status", { enum: ["unpaid", "paid"] })
    .notNull()
    .default("unpaid"),
  paymentMode: text("payment_mode", { enum: ["cash", "upi"] }),
  checkedInBy: text("checked_in_by").references(() => user.id, {
    onDelete: "set null",
  }),
  checkedInAt: integer("checked_in_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const vitals = sqliteTable("vitals", {
  id: text("id").primaryKey(),
  appointmentId: text("appointment_id")
    .notNull()
    .references(() => appointments.id, { onDelete: "cascade" }),
  bpSystolic: integer("bp_systolic"),
  bpDiastolic: integer("bp_diastolic"),
  pulse: integer("pulse"),
  spo2: integer("spo2"),
  temperature: integer("temperature"), // stored as tenths of a degree e.g. 372 = 37.2°C
  weightKg: integer("weight_kg"),      // stored as tenths e.g. 705 = 70.5 kg
  heightCm: integer("height_cm"),
  recordedBy: text("recorded_by")
    .notNull()
    .references(() => user.id),
  recordedAt: integer("recorded_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const preConsultation = sqliteTable("pre_consultation", {
  id: text("id").primaryKey(),
  appointmentId: text("appointment_id")
    .notNull()
    .references(() => appointments.id, { onDelete: "cascade" }),
  chiefComplaint: text("chief_complaint"),
  // Free-form history blob — JSON string
  history: text("history"),
  // Assistant doctor's working diagnosis notes
  diagnosisDraft: text("diagnosis_draft"),
  // Which disease-specific form was opened, if any
  formType: text("form_type", {
    enum: ["general", "T2DM", "HTN", "asthma", "other"],
  }).default("general"),
  // JSON object — checkbox answers keyed by question ID
  formData: text("form_data"),
  // false = record came through the offline sync queue
  synced: integer("synced", { mode: "boolean" }).notNull().default(true),
  recordedBy: text("recorded_by")
    .notNull()
    .references(() => user.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const prescriptions = sqliteTable("prescriptions", {
  id: text("id").primaryKey(),
  appointmentId: text("appointment_id")
    .notNull()
    .references(() => appointments.id, { onDelete: "cascade" }),
  // Name of the doctor (from admin user's name field — doctor IS the admin)
  doctorName: text("doctor_name").notNull(),
  // Staff who entered the prescription from the paper
  enteredBy: text("entered_by")
    .notNull()
    .references(() => user.id),
  // JSON arrays
  medicines: text("medicines").notNull().default("[]"),
  tests: text("tests").notNull().default("[]"),
  notes: text("notes"),
  finalizedAt: integer("finalized_at", { mode: "timestamp" }),
  whatsappSent: integer("whatsapp_sent", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
})

// ---------------------------------------------------------------------------
// Booking OTP (STUBBED for now) + WhatsApp logs
// OTP verification is stubbed — anyone can book with just a mobile number.
// When WhatsApp is wired up, booking_otps will hold the hashed codes and
// POST /api/booking/appointments will require a verified bookingToken.
// PID login (username plugin) stays separate.
// ---------------------------------------------------------------------------

export const bookingOtps = sqliteTable(
  "booking_otps",
  {
    id: text("id").primaryKey(), // uuid
    mobile: text("mobile").notNull(), // 10-digit number (unverified while stubbed)
    codeHash: text("code_hash").notNull(), // SHA-256 of the 6-digit code
    attempts: integer("attempts").notNull().default(0),
    verified: integer("verified", { mode: "boolean" })
      .notNull()
      .default(false),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index("booking_otps_mobile_idx").on(t.mobile)],
)

export const whatsappLogs = sqliteTable("whatsapp_logs", {
  id: text("id").primaryKey(), // uuid
  toMobile: text("to_mobile").notNull(),
  template: text("template").notNull(), // otp | booking_confirm | pid_issued | reminder
  appointmentId: text("appointment_id").references(() => appointments.id, {
    onDelete: "set null",
  }),
  providerId: text("provider_id"), // Meta message id (wamid:...)
  status: text("status", {
    enum: ["queued", "sent", "delivered", "failed"],
  })
    .notNull()
    .default("queued"),
  error: text("error"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
})

// Shared vocabulary for the visit form, independent of patient records.
export const chiefComplaints = sqliteTable("chief_complaints", {
  normalizedLabel: text("normalized_label").primaryKey(),
  label: text("label").notNull(),
})

export const clinicalOptions = sqliteTable(
  "clinical_options",
  {
    category: text("category", {
      enum: [
        "diagnosis",
        "previous_medical_history",
        "lab_reports",
        "medicines_prescribed",
      ],
    }).notNull(),
    normalizedLabel: text("normalized_label").notNull(),
    label: text("label").notNull(),
  },
  (table) => [primaryKey({ columns: [table.category, table.normalizedLabel] })],
)
