import { formatClinicalText } from "@repo/shared"
import { and, asc, eq } from "drizzle-orm"
import { Hono } from "hono"
import { createAuth, type Env } from "../auth"
import { createDb } from "../db"
import { clinicalOptions } from "../db/schema"

const optionCategories = {
  diagnosis: "diagnosis",
  "previous-medical-history": "previous_medical_history",
  "lab-reports": "lab_reports",
  "medicines-prescribed": "medicines_prescribed",
} as const

type OptionSlug = keyof typeof optionCategories

const labels: Record<OptionSlug, string> = {
  diagnosis: "diagnosis",
  "previous-medical-history": "previous medical history",
  "lab-reports": "lab report",
  "medicines-prescribed": "prescribed medicine",
}

const options = new Hono<{ Bindings: Env }>()

options.use("*", async (c, next) => {
  const session = await createAuth(c.env).api.getSession({
    headers: c.req.raw.headers,
  })
  if (!session) return c.json({ error: "Sign in to access clinical options" }, 401)
  if (session.user.role !== "admin" && session.user.role !== "staff") {
    return c.json({ error: "Staff access required" }, 403)
  }
  await next()
})

function getSlug(value: string): OptionSlug | null {
  return value in optionCategories ? (value as OptionSlug) : null
}

options.get("/:category", async (c) => {
  const slug = getSlug(c.req.param("category"))
  if (!slug) return c.json({ error: "Unknown clinical option category" }, 404)

  const category = optionCategories[slug]
  const rows = await createDb(c.env.DB)
    .select({ label: clinicalOptions.label })
    .from(clinicalOptions)
    .where(eq(clinicalOptions.category, category))
    .orderBy(asc(clinicalOptions.normalizedLabel))

  return c.json({ options: rows.map((row) => formatClinicalText(row.label)) })
})

options.post("/:category", async (c) => {
  const slug = getSlug(c.req.param("category"))
  if (!slug) return c.json({ error: "Unknown clinical option category" }, 404)

  const body = await c.req.json<unknown>().catch(() => null)
  if (
    !body ||
    typeof body !== "object" ||
    !("label" in body) ||
    typeof body.label !== "string"
  ) {
    return c.json({ error: `Enter a ${labels[slug]}` }, 400)
  }

  const label = formatClinicalText(body.label.trim().replace(/\s+/g, " "))
  if (!label || label.length > 200) {
    return c.json(
      { error: `${formatClinicalText(labels[slug])} must be between 1 and 200 characters` },
      400,
    )
  }

  const category = optionCategories[slug]
  const normalizedLabel = label.toLowerCase()
  const db = createDb(c.env.DB)
  await db
    .insert(clinicalOptions)
    .values({ category, label, normalizedLabel })
    .onConflictDoNothing()

  const [option] = await db
    .select({ label: clinicalOptions.label })
    .from(clinicalOptions)
    .where(
      and(
        eq(clinicalOptions.category, category),
        eq(clinicalOptions.normalizedLabel, normalizedLabel),
      ),
    )

  return c.json({ option: formatClinicalText(option!.label) })
})

export default options
