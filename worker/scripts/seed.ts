import { readdir } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { createClient } from "@libsql/client"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { username } from "better-auth/plugins"
import { eq, or } from "drizzle-orm"
import { drizzle } from "drizzle-orm/libsql"

import * as schema from "../src/db/schema"

const ADMIN = {
  name: "Local Admin",
  username: "meamank",
  email: "meamank@staff.local",
  password: "Admin@123",
} as const

type SeedVisit = {
  id: string
  visitDate: string
  bloodPressure: string
  weight: string
  chestHeartSound: "Normal" | "Wheeze" | "Rhonci" | "Creps" | "Other"
  otherChestHeartSound: string
  chiefComplaint: string[]
  previousMedicalHistory: string[]
  diagnosis: string[]
  labReports: Array<{ test: string; result: string; reportDate: string }>
  medicinesPrescribed: Array<{
    name: string
    frequency: "OD" | "BD" | "TDS" | "BBF" | "SOS"
    duration: string
    notes: string
  }>
  remarks: string
  t2dmAssessment: Record<string, string | boolean> | null
  ibsAssessment: Record<string, string | number | boolean> | null
}

type SeedPatient = {
  pid: string
  fullName: string
  mobile: string
  address: string
  ageYears: number
  gender: "male" | "female" | "other"
  createdAt: string
  visits: SeedVisit[]
}

const t2dmAssessment = {
  symptomsDuration: "8 months",
  polyuria: true,
  polydipsia: true,
  polyphagia: false,
  unexplainedWeightLoss: true,
  blurredVision: true,
  fatigueOrLethargy: true,
  age35OrOlder: true,
  overweightOrObese: true,
  highRiskEthnicity: true,
  firstDegreeRelative: true,
  historyOfCvd: false,
  hypertension: true,
  historyOfGdm: true,
  pcos: false,
  physicalInactivity: true,
  fruityBreathOdor: false,
  kussmaulRespirations: false,
  intractableNauseaVomiting: false,
  alteredMentalStatus: false,
  neuropathicSymptoms: true,
  footComplications: false,
  visionChangesOrFloaters: true,
  exertionalChestPainOrSob: false,
}

const ibsAssessment = {
  romePainWeekly: true,
  romeDefecationRelated: true,
  romeStoolChange: true,
  romeDurationSixMonths: true,
  redFlagWeightLoss: false,
  redFlagBleeding: false,
  redFlagIronDeficiencyAnemia: false,
  redFlagFever: false,
  redFlagNocturnalSymptoms: false,
  redFlagOnsetAfter50: false,
  redFlagFamilyHistory: false,
  bristolStoolType: "6",
  subtype: "IBS-D",
  painSeverity: 58,
  painFrequency: 64,
  bloating: 72,
  bowelDissatisfaction: 68,
  lifeInterference: 55,
  missedWork: true,
  avoidsTravelOrSocial: true,
  toiletAnxiety: true,
  dominatesDailyThinking: false,
  anxietySymptoms: true,
  lowMoodOrDepression: false,
}

const DEMO_PATIENTS: SeedPatient[] = [
  {
    pid: "PID900001",
    fullName: "Anita Verma",
    mobile: "9876543201",
    address: "Mithanpura, Muzaffarpur, Bihar",
    ageYears: 52,
    gender: "female",
    createdAt: "2026-02-05",
    visits: [
      {
        id: "demo-anita-visit-1",
        visitDate: "2026-02-05",
        bloodPressure: "154/94 mmHg",
        weight: "78.4 kg",
        chestHeartSound: "Normal",
        otherChestHeartSound: "",
        chiefComplaint: [
          "Frequent urination",
          "Excessive thirst",
          "Fatigue",
          "Blurred vision",
        ],
        previousMedicalHistory: [
          "Hypertension for 6 years",
          "Gestational diabetes in 2001",
          "Mother had type 2 diabetes mellitus",
        ],
        diagnosis: ["Type 2 diabetes mellitus", "Hypertension"],
        labReports: [
          { test: "HbA1c", result: "9.4 %", reportDate: "2026-02-03" },
          { test: "Fasting blood sugar", result: "186 mg/dL", reportDate: "2026-02-03" },
          { test: "Postprandial blood sugar", result: "278 mg/dL", reportDate: "2026-02-03" },
          { test: "Serum creatinine", result: "0.9 mg/dL", reportDate: "2026-02-03" },
        ],
        medicinesPrescribed: [
          { name: "Metformin 500 mg", frequency: "BD", duration: "30 days", notes: "After meals" },
          { name: "Telmisartan 40 mg", frequency: "OD", duration: "30 days", notes: "Morning" },
          { name: "Atorvastatin 10 mg", frequency: "OD", duration: "30 days", notes: "At bedtime" },
        ],
        remarks: "Diabetic diet and daily 30-minute walk advised. Maintain home blood glucose and BP chart.",
        t2dmAssessment,
        ibsAssessment: null,
      },
      {
        id: "demo-anita-visit-2",
        visitDate: "2026-03-12",
        bloodPressure: "146/90 mmHg",
        weight: "77.1 kg",
        chestHeartSound: "Normal",
        otherChestHeartSound: "",
        chiefComplaint: ["Persistent fatigue", "Occasional tingling in feet"],
        previousMedicalHistory: ["Type 2 diabetes mellitus", "Hypertension"],
        diagnosis: ["Type 2 diabetes mellitus - uncontrolled", "Early peripheral neuropathy"],
        labReports: [
          { test: "Fasting blood sugar", result: "162 mg/dL", reportDate: "2026-03-10" },
          { test: "Postprandial blood sugar", result: "236 mg/dL", reportDate: "2026-03-10" },
          { test: "Urine microalbumin", result: "22 mg/L", reportDate: "2026-03-10" },
        ],
        medicinesPrescribed: [
          { name: "Metformin 1000 mg", frequency: "BD", duration: "30 days", notes: "After meals" },
          { name: "Glimepiride 1 mg", frequency: "BBF", duration: "30 days", notes: "Before breakfast" },
          { name: "Methylcobalamin 1500 mcg", frequency: "OD", duration: "30 days", notes: "After lunch" },
        ],
        remarks: "Reviewed glucometer technique. Foot-care counselling completed.",
        t2dmAssessment: null,
        ibsAssessment: null,
      },
      {
        id: "demo-anita-visit-3",
        visitDate: "2026-04-23",
        bloodPressure: "138/86 mmHg",
        weight: "75.8 kg",
        chestHeartSound: "Normal",
        otherChestHeartSound: "",
        chiefComplaint: ["Blood sugar follow-up", "Mild numbness in toes"],
        previousMedicalHistory: ["Type 2 diabetes mellitus", "Hypertension", "Peripheral neuropathy"],
        diagnosis: ["Type 2 diabetes mellitus - improving", "Hypertension - controlled"],
        labReports: [
          { test: "HbA1c", result: "8.1 %", reportDate: "2026-04-20" },
          { test: "Fasting blood sugar", result: "138 mg/dL", reportDate: "2026-04-20" },
          { test: "LDL cholesterol", result: "112 mg/dL", reportDate: "2026-04-20" },
        ],
        medicinesPrescribed: [
          { name: "Metformin 1000 mg", frequency: "BD", duration: "3 months", notes: "After meals" },
          { name: "Glimepiride 1 mg", frequency: "BBF", duration: "3 months", notes: "Before breakfast" },
          { name: "Telmisartan 40 mg", frequency: "OD", duration: "3 months", notes: "Morning" },
          { name: "Atorvastatin 20 mg", frequency: "OD", duration: "3 months", notes: "At bedtime" },
        ],
        remarks: "Continue diet plan. Ophthalmology screening and annual foot examination advised.",
        t2dmAssessment: null,
        ibsAssessment: null,
      },
      {
        id: "demo-anita-visit-4",
        visitDate: "2026-06-18",
        bloodPressure: "132/82 mmHg",
        weight: "74.2 kg",
        chestHeartSound: "Normal",
        otherChestHeartSound: "",
        chiefComplaint: ["Routine diabetes review", "No hypoglycaemic episodes"],
        previousMedicalHistory: ["Type 2 diabetes mellitus", "Hypertension", "Dyslipidaemia"],
        diagnosis: ["Type 2 diabetes mellitus - fair control", "Dyslipidaemia"],
        labReports: [
          { test: "HbA1c", result: "7.3 %", reportDate: "2026-06-15" },
          { test: "Fasting blood sugar", result: "121 mg/dL", reportDate: "2026-06-15" },
          { test: "LDL cholesterol", result: "86 mg/dL", reportDate: "2026-06-15" },
          { test: "Serum creatinine", result: "0.8 mg/dL", reportDate: "2026-06-15" },
        ],
        medicinesPrescribed: [
          { name: "Metformin 1000 mg", frequency: "BD", duration: "3 months", notes: "After meals" },
          { name: "Glimepiride 1 mg", frequency: "BBF", duration: "3 months", notes: "Before breakfast" },
          { name: "Telmisartan 40 mg", frequency: "OD", duration: "3 months", notes: "Morning" },
        ],
        remarks: "Good adherence and weight reduction. Continue present treatment.",
        t2dmAssessment: null,
        ibsAssessment: null,
      },
      {
        id: "demo-anita-visit-5",
        visitDate: "2026-08-27",
        bloodPressure: "128/80 mmHg",
        weight: "72.9 kg",
        chestHeartSound: "Normal",
        otherChestHeartSound: "",
        chiefComplaint: ["Scheduled follow-up", "Occasional burning feet at night"],
        previousMedicalHistory: ["Type 2 diabetes mellitus", "Hypertension", "Peripheral neuropathy"],
        diagnosis: ["Type 2 diabetes mellitus - controlled", "Mild diabetic peripheral neuropathy"],
        labReports: [
          { test: "HbA1c", result: "6.8 %", reportDate: "2026-08-24" },
          { test: "Fasting blood sugar", result: "108 mg/dL", reportDate: "2026-08-24" },
          { test: "Postprandial blood sugar", result: "154 mg/dL", reportDate: "2026-08-24" },
          { test: "Urine microalbumin", result: "16 mg/L", reportDate: "2026-08-24" },
        ],
        medicinesPrescribed: [
          { name: "Metformin 1000 mg", frequency: "BD", duration: "3 months", notes: "After meals" },
          { name: "Glimepiride 1 mg", frequency: "BBF", duration: "3 months", notes: "Before breakfast" },
          { name: "Pregabalin 75 mg", frequency: "OD", duration: "30 days", notes: "At bedtime" },
          { name: "Telmisartan 40 mg", frequency: "OD", duration: "3 months", notes: "Morning" },
        ],
        remarks: "Targets achieved. Reinforced foot inspection, exercise and annual retinal screening.",
        t2dmAssessment: null,
        ibsAssessment: null,
      },
    ],
  },
  {
    pid: "PID900002",
    fullName: "Rajesh Kumar",
    mobile: "9876543202",
    address: "Aghoria Bazar, Muzaffarpur, Bihar",
    ageYears: 36,
    gender: "male",
    createdAt: "2026-03-02",
    visits: [
      {
        id: "demo-rajesh-visit-1",
        visitDate: "2026-03-02",
        bloodPressure: "126/78 mmHg",
        weight: "68.5 kg",
        chestHeartSound: "Normal",
        otherChestHeartSound: "",
        chiefComplaint: ["Recurrent lower abdominal pain", "Loose stools", "Post-meal bloating"],
        previousMedicalHistory: ["Intermittent dyspepsia", "Work-related anxiety"],
        diagnosis: ["Irritable bowel syndrome with diarrhoea", "Functional bloating"],
        labReports: [
          { test: "Haemoglobin", result: "14.1 g/dL", reportDate: "2026-02-28" },
          { test: "CRP", result: "2.8 mg/L", reportDate: "2026-02-28" },
          { test: "TSH", result: "2.1 mIU/L", reportDate: "2026-02-28" },
        ],
        medicinesPrescribed: [
          { name: "Mebeverine 135 mg", frequency: "BD", duration: "30 days", notes: "20 minutes before meals" },
          { name: "Probiotic capsule", frequency: "OD", duration: "15 days", notes: "After breakfast" },
          { name: "ORS sachet", frequency: "SOS", duration: "10 days", notes: "After each loose stool" },
        ],
        remarks: "Low-FODMAP trial, regular meal timing and symptom diary advised. No alarm features.",
        t2dmAssessment: null,
        ibsAssessment,
      },
      {
        id: "demo-rajesh-visit-2",
        visitDate: "2026-04-06",
        bloodPressure: "124/76 mmHg",
        weight: "68.1 kg",
        chestHeartSound: "Normal",
        otherChestHeartSound: "",
        chiefComplaint: ["Bloating improved", "Loose stools three times weekly"],
        previousMedicalHistory: ["Irritable bowel syndrome", "Anxiety symptoms"],
        diagnosis: ["IBS-D - partial response"],
        labReports: [
          { test: "CRP", result: "2.2 mg/L", reportDate: "2026-04-04" },
          { test: "Stool occult blood", result: "Negative", reportDate: "2026-04-04" },
        ],
        medicinesPrescribed: [
          { name: "Mebeverine 135 mg", frequency: "BD", duration: "30 days", notes: "Before meals" },
          { name: "Psyllium husk", frequency: "OD", duration: "30 days", notes: "With water at bedtime" },
        ],
        remarks: "Identified milk and late-night meals as triggers. Continue food diary.",
        t2dmAssessment: null,
        ibsAssessment: null,
      },
      {
        id: "demo-rajesh-visit-3",
        visitDate: "2026-06-01",
        bloodPressure: "122/76 mmHg",
        weight: "67.8 kg",
        chestHeartSound: "Normal",
        otherChestHeartSound: "",
        chiefComplaint: ["Occasional urgency", "Abdominal pain once weekly"],
        previousMedicalHistory: ["IBS-D"],
        diagnosis: ["IBS-D - improving"],
        labReports: [
          { test: "Haemoglobin", result: "14.4 g/dL", reportDate: "2026-05-29" },
          { test: "CRP", result: "1.9 mg/L", reportDate: "2026-05-29" },
        ],
        medicinesPrescribed: [
          { name: "Mebeverine 135 mg", frequency: "SOS", duration: "30 days", notes: "For abdominal cramping" },
          { name: "Probiotic capsule", frequency: "OD", duration: "30 days", notes: "After breakfast" },
        ],
        remarks: "Sleep and stress management discussed. Encourage gradual soluble fibre increase.",
        t2dmAssessment: null,
        ibsAssessment: null,
      },
      {
        id: "demo-rajesh-visit-4",
        visitDate: "2026-08-10",
        bloodPressure: "120/74 mmHg",
        weight: "67.5 kg",
        chestHeartSound: "Normal",
        otherChestHeartSound: "",
        chiefComplaint: ["Stable bowel pattern", "Mild bloating after restaurant food"],
        previousMedicalHistory: ["IBS-D", "Functional bloating"],
        diagnosis: ["IBS-D - stable"],
        labReports: [
          { test: "CRP", result: "1.6 mg/L", reportDate: "2026-08-08" },
          { test: "TSH", result: "2.3 mIU/L", reportDate: "2026-08-08" },
        ],
        medicinesPrescribed: [
          { name: "Mebeverine 135 mg", frequency: "SOS", duration: "30 days", notes: "For cramps" },
          { name: "Psyllium husk", frequency: "OD", duration: "30 days", notes: "At bedtime with adequate water" },
        ],
        remarks: "Continue trigger avoidance. Review early if bleeding, fever, weight loss or nocturnal symptoms occur.",
        t2dmAssessment: null,
        ibsAssessment: null,
      },
    ],
  },
  {
    pid: "PID900003",
    fullName: "Sunil Singh",
    mobile: "9876543203",
    address: "Fardo Gola Chowk, Muzaffarpur, Bihar",
    ageYears: 64,
    gender: "male",
    createdAt: "2026-04-14",
    visits: [
      {
        id: "demo-sunil-visit-1",
        visitDate: "2026-04-14",
        bloodPressure: "166/98 mmHg",
        weight: "82.6 kg",
        chestHeartSound: "Wheeze",
        otherChestHeartSound: "Bilateral expiratory wheeze",
        chiefComplaint: ["Exertional breathlessness", "Night cough", "Occasional chest tightness"],
        previousMedicalHistory: ["Hypertension for 10 years", "Bronchial asthma", "Former smoker - 18 pack-years"],
        diagnosis: ["Uncontrolled hypertension", "Bronchial asthma exacerbation", "Obesity"],
        labReports: [
          { test: "LDL cholesterol", result: "154 mg/dL", reportDate: "2026-04-12" },
          { test: "Triglycerides", result: "218 mg/dL", reportDate: "2026-04-12" },
          { test: "Serum creatinine", result: "1.1 mg/dL", reportDate: "2026-04-12" },
          { test: "Eosinophil count", result: "620 cells/uL", reportDate: "2026-04-12" },
        ],
        medicinesPrescribed: [
          { name: "Telmisartan 40 mg", frequency: "OD", duration: "30 days", notes: "Morning" },
          { name: "Amlodipine 5 mg", frequency: "OD", duration: "30 days", notes: "Evening" },
          { name: "Budesonide Formoterol inhaler", frequency: "BD", duration: "30 days", notes: "Two puffs; rinse mouth after use" },
          { name: "Montelukast 10 mg", frequency: "OD", duration: "30 days", notes: "At bedtime" },
        ],
        remarks: "Inhaler technique demonstrated. Salt restriction, weight reduction and home BP log advised.",
        t2dmAssessment: null,
        ibsAssessment: null,
      },
      {
        id: "demo-sunil-visit-2",
        visitDate: "2026-06-09",
        bloodPressure: "148/88 mmHg",
        weight: "80.9 kg",
        chestHeartSound: "Rhonci",
        otherChestHeartSound: "Scattered rhonchi, improved after bronchodilator",
        chiefComplaint: ["Breathlessness improved", "Morning cough with scant sputum"],
        previousMedicalHistory: ["Hypertension", "Bronchial asthma", "Dyslipidaemia"],
        diagnosis: ["Hypertension - improving", "Asthma - partly controlled", "Dyslipidaemia"],
        labReports: [
          { test: "LDL cholesterol", result: "118 mg/dL", reportDate: "2026-06-07" },
          { test: "Triglycerides", result: "176 mg/dL", reportDate: "2026-06-07" },
          { test: "Serum creatinine", result: "1.0 mg/dL", reportDate: "2026-06-07" },
        ],
        medicinesPrescribed: [
          { name: "Telmisartan 80 mg", frequency: "OD", duration: "3 months", notes: "Morning" },
          { name: "Amlodipine 5 mg", frequency: "OD", duration: "3 months", notes: "Evening" },
          { name: "Atorvastatin 20 mg", frequency: "OD", duration: "3 months", notes: "At bedtime" },
          { name: "Budesonide Formoterol inhaler", frequency: "BD", duration: "3 months", notes: "Two puffs; rinse mouth" },
        ],
        remarks: "Continue inhaler spacer. Pulmonary function testing advised when symptom-free.",
        t2dmAssessment: null,
        ibsAssessment: null,
      },
      {
        id: "demo-sunil-visit-3",
        visitDate: "2026-08-21",
        bloodPressure: "134/82 mmHg",
        weight: "79.3 kg",
        chestHeartSound: "Normal",
        otherChestHeartSound: "Good bilateral air entry; no wheeze",
        chiefComplaint: ["Routine BP review", "No nocturnal respiratory symptoms"],
        previousMedicalHistory: ["Hypertension", "Bronchial asthma", "Dyslipidaemia", "Former smoker"],
        diagnosis: ["Hypertension - controlled", "Asthma - controlled", "Dyslipidaemia - improving"],
        labReports: [
          { test: "LDL cholesterol", result: "88 mg/dL", reportDate: "2026-08-19" },
          { test: "Triglycerides", result: "142 mg/dL", reportDate: "2026-08-19" },
          { test: "Serum creatinine", result: "1.0 mg/dL", reportDate: "2026-08-19" },
          { test: "Eosinophil count", result: "310 cells/uL", reportDate: "2026-08-19" },
        ],
        medicinesPrescribed: [
          { name: "Telmisartan 80 mg", frequency: "OD", duration: "3 months", notes: "Morning" },
          { name: "Amlodipine 5 mg", frequency: "OD", duration: "3 months", notes: "Evening" },
          { name: "Atorvastatin 20 mg", frequency: "OD", duration: "3 months", notes: "At bedtime" },
          { name: "Budesonide Formoterol inhaler", frequency: "BD", duration: "3 months", notes: "One puff; rinse mouth" },
        ],
        remarks: "Good clinical control. Continue exercise, low-salt diet and inhaler adherence.",
        t2dmAssessment: null,
        ibsAssessment: null,
      },
    ],
  },
]

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const workerDirectory = resolve(scriptDirectory, "..")
const localD1Directory = resolve(
  workerDirectory,
  ".wrangler/state/v3/d1/miniflare-D1DatabaseObject"
)

async function findLocalDatabase(): Promise<string> {
  const entries = await readdir(localD1Directory, { withFileTypes: true }).catch(
    () => []
  )
  const databases = entries
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith(".sqlite") &&
        entry.name !== "metadata.sqlite"
    )
    .map((entry) => resolve(localD1Directory, entry.name))

  if (databases.length === 0) {
    throw new Error(
      "Local D1 database not found. Run `bun run db:migrate:local` first."
    )
  }
  if (databases.length > 1) {
    throw new Error(
      `Found multiple local D1 databases. Remove stale local state or seed one explicitly: ${databases.join(", ")}`
    )
  }
  return databases[0]!
}

async function seedAdmin() {
  const databasePath = await findLocalDatabase()
  const client = createClient({ url: `file:${databasePath}` })
  const db = drizzle(client, { schema })

  try {
    await client.execute("SELECT 1 FROM user LIMIT 1")

    const [existing] = await db
      .select({ id: schema.user.id })
      .from(schema.user)
      .where(
        or(
          eq(schema.user.username, ADMIN.username),
          eq(schema.user.email, ADMIN.email)
        )
      )
      .limit(1)

    let adminUserId: string

    if (existing) {
      await db
        .update(schema.user)
        .set({
          name: ADMIN.name,
          username: ADMIN.username,
          email: ADMIN.email,
          role: "admin",
          updatedAt: new Date(),
        })
        .where(eq(schema.user.id, existing.id))
      console.log(`Local admin already exists; ensured admin role for ${ADMIN.username}.`)
      adminUserId = existing.id
    } else {
      const auth = betterAuth({
        baseURL: "http://localhost:8787",
        secret: "local-development-seed-secret-change-before-production",
        database: drizzleAdapter(db, {
          provider: "sqlite",
          schema: {
            user: schema.user,
            session: schema.session,
            account: schema.account,
            verification: schema.verification,
          },
        }),
        user: {
          additionalFields: {
            role: {
              type: "string",
              defaultValue: "user",
              input: false,
            },
            isFirstLogin: {
              type: "boolean",
              defaultValue: false,
              input: false,
            },
          },
        },
        emailAndPassword: {
          enabled: true,
          requireEmailVerification: false,
          autoSignIn: false,
        },
        plugins: [
          username({
            displayUsername: false,
            minUsernameLength: 3,
            maxUsernameLength: 32,
            usernameValidator: (value) => /^[a-z0-9_]+$/i.test(value),
          }),
        ],
      })

      const result = await auth.api.signUpEmail({
        body: {
          name: ADMIN.name,
          email: ADMIN.email,
          password: ADMIN.password,
          username: ADMIN.username,
        },
      })

      await db
        .update(schema.user)
        .set({ role: "admin" })
        .where(eq(schema.user.id, result.user.id))

      adminUserId = result.user.id
      console.log(`Created local admin ${ADMIN.username}.`)
    }

    for (const patient of DEMO_PATIENTS) {
      await db
        .insert(schema.patients)
        .values({
          pid: patient.pid,
          userId: null,
          fullName: patient.fullName,
          mobile: patient.mobile,
          address: patient.address,
          ageYears: patient.ageYears,
          gender: patient.gender,
          bookedByStaffId: adminUserId,
          isFirstLogin: true,
          createdAt: new Date(`${patient.createdAt}T10:00:00+05:30`),
        })
        .onConflictDoUpdate({
          target: schema.patients.pid,
          set: {
            fullName: patient.fullName,
            mobile: patient.mobile,
            address: patient.address,
            ageYears: patient.ageYears,
            gender: patient.gender,
            bookedByStaffId: adminUserId,
            isFirstLogin: true,
          },
        })

      // Refresh only our stable demo records so repeat runs keep exact counts.
      await db
        .delete(schema.patientVisits)
        .where(eq(schema.patientVisits.patientPid, patient.pid))

      await db.insert(schema.patientVisits).values(
        patient.visits.map((visit) => {
          const { id, ...details } = visit
          const timestamp = new Date(`${visit.visitDate}T12:00:00+05:30`)

          return {
            id,
            patientPid: patient.pid,
            visitDate: visit.visitDate,
            details: JSON.stringify(details),
            createdAt: timestamp,
            updatedAt: timestamp,
          }
        })
      )
    }

    const visitCount = DEMO_PATIENTS.reduce(
      (total, patient) => total + patient.visits.length,
      0
    )
    console.log(
      `Seeded ${DEMO_PATIENTS.length} demo patients with ${visitCount} visits.`
    )
  } catch (error) {
    if (error instanceof Error && error.message.includes("no such table")) {
      throw new Error(
        "Local D1 schema is not migrated. Run `bun run db:migrate:local` first."
      )
    }
    throw error
  } finally {
    client.close()
  }
}

await seedAdmin()
