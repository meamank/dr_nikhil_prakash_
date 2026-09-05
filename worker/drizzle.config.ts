import { defineConfig } from "drizzle-kit"

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  // For local D1 dev — Wrangler stores the SQLite file here
  dbCredentials: {
    url: ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/e3e7a76d4c5fc3e18852a395750346a787435963c5cb2ffc024946c861a91124.sqlite",
  },
})
