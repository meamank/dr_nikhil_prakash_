import { drizzle } from "drizzle-orm/d1"
import * as schema from "./schema"

/**
 * Creates a Drizzle client bound to the D1 instance from the current request.
 * Must be called inside a Hono handler — D1Database is only available per-request.
 *
 * Usage:
 *   const db = createDb(c.env.DB)
 */
export function createDb(d1: D1Database) {
  return drizzle(d1, { schema })
}

export type Db = ReturnType<typeof createDb>
