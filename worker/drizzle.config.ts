import { defineConfig } from "drizzle-kit"

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  // For local D1 dev — Wrangler stores the SQLite file here
  dbCredentials: {
    url: ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/clinic-db.sqlite",
  },
})
