# Deploy — Cloudflare Git Integration (push to `main` auto-deploys)

This repo has **two Cloudflare projects**. Both are connected to GitHub so that
every push to `main` deploys automatically — no `wrangler deploy` or GitHub
Actions needed.

| App | Cloudflare project | Type | URL |
|---|---|---|---|
| `web/` — marketing site | `drnikhilprakash` | **Pages** | `https://drnikhilprakash.pages.dev` |
| `dashboard/` + `worker/` — portal SPA + API | `clinic-worker` | **Workers** (with `[assets]`) | `https://clinic-worker.<subdomain>.workers.dev` |

> **Why the dashboard is served by the Worker:** `*.pages.dev` and
> `*.workers.dev` are different sites, so a session cookie set by the API would
> be blocked by SameSite on a separate Pages frontend. Serving the SPA and the
> API from **one origin** (via `[assets]` in `worker/wrangler.toml`) makes
> login, sessions, CORS and CSRF work with zero extra config.

---

## One-time setup

### 0. Prerequisites

- Cloudflare account (free plan is fine).
- GitHub repo `meamank/dr_nikhil_prakash_` pushed to `main`.
- Pick your `workers.dev` subdomain: Cloudflare Dashboard → **Workers & Pages**
  → right side **workers.dev subdomain** → set it (e.g. `amankr`). The portal
  will live at `https://clinic-worker.amankr.workers.dev`.

### 1. Create the production D1 database

Local dev uses a local SQLite file — production starts empty (schema only).

```bash
bunx wrangler login
bunx wrangler whoami          # verify

cd worker
bunx wrangler d1 create clinic-db
```

Copy the printed `database_id` into `worker/wrangler.toml` (replace the
placeholder), commit and push:

```toml
[[d1_databases]]
binding = "DB"
database_name = "clinic-db"
database_id = "1bacd1e6-6278-412a-8e98-57fe4d6f4282"  # ← real id
```

Apply migrations to production:

```bash
bun run db:migrate:remote
```

Set the auth secret (never commit it — stored only in Cloudflare):

```bash
openssl rand -base64 32
bunx wrangler secret put BETTER_AUTH_SECRET   # paste the generated value
```

### 2. Connect the Worker to GitHub (auto-deploy on push to `main`)

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Worker** →
   select **`clinic-worker`** (or create it if it doesn't exist yet).
2. Open the Worker → **Settings** → **Build** (or **Deployments → Git integration**,
   depending on dashboard version) → **Connect to Git**.
3. Authorize Cloudflare to access GitHub and select:
   - Repository: `meamank/dr_nikhil_prakash_`
   - Production branch: `main`
   - Preview branches: `All non-production branches` (optional — gives you
     preview deployments per PR).
4. **Build settings** for the Worker:

   | Field | Value |
   |---|---|
   | Build command | `bun install && bun --filter=dashboard run build` |
   | Deploy command | `npx wrangler deploy` |
   | Root directory | `/` (repo root) |

   > If the dashboard shows a single **Build command** field, use:
   > `bun install && bun --filter=dashboard run build && npx wrangler deploy`
   > and leave **Deploy command** empty.

5. Save. Cloudflare will trigger an initial build. Future pushes to `main`
   will auto-deploy.

> **Note:** The Worker's `[assets] directory = "../dashboard/dist"` means the
> dashboard must be built **before** `wrangler deploy`. The build command above
> ensures that.

### 3. Connect Pages to GitHub (auto-deploy on push to `main`)

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git** → select `meamank/dr_nikhil_prakash_`.
2. Configure the Pages project:

   | Field | Value |
   |---|---|
   | Project name | `drnikhilprakash` |
   | Production branch | `main` |
   | Framework preset | `Astro` |
   | Root directory | `/` (repo root — monorepo, `bun.lock` lives here) |
   | Build command | `bun install && bun --filter=drnikhilprakash run build` |
   | Build output directory | `web/dist` |
   | Environment variable | `PUBLIC_PORTAL_URL=https://clinic-worker.<subdomain>.workers.dev` |

   > **Why root `/` + `--filter`:** `npm install` at root fails on
   > `workspace:*`. Building from the repo root with `bun` lets Cloudflare
   > resolve the `bun` workspaces correctly; `web/dist` is the Astro output.

   Set `PUBLIC_PORTAL_URL` under **Settings → Environment variables** →
   **Production** (and **Preview** if you want previews to point at the preview
   Worker). This value is baked into the static site at build time — it controls
   where the **Login** button goes.

3. Save. Pages will build and deploy. Every future push to `main` rebuilds
   and deploys the site automatically. PRs get preview deployments.

### 4. Verify

- [ ] `curl https://clinic-worker.<subdomain>.workers.dev/api/health` → `{"ok":true}`
- [ ] `https://clinic-worker.<subdomain>.workers.dev/login` loads the portal
- [ ] Sign up → user appears in remote D1:
  ```bash
  bunx wrangler d1 execute clinic-db --remote --command "select id, email, role from user limit 5"
  ```
- [ ] Log out / log in works; refresh after login — still logged in (same-origin cookie)
- [ ] `https://drnikhilprakash.pages.dev` loads; **Login** button goes to the portal

---

## Day-to-day

Just push to `main` — both projects deploy automatically.

| Task | How |
|---|---|
| Deploy (normal) | `git push origin main` — Cloudflare builds & deploys both projects |
| Preview a PR | Open a PR against `main` — Pages + Workers create preview deployments |
| Apply new D1 migration to prod | `cd worker && bun run db:migrate:remote` (manual — not auto-applied) |
| Rollback Worker | Dashboard → `clinic-worker` → **Deployments** → **Rollback** |
| Rollback Pages | Dashboard → `drnikhilprakash` → **Deployments** → **Rollback** |
| Manual deploy (if needed) | `cd worker && bun run deploy` · `cd web && bun run build && npx wrangler pages deploy dist --project-name=drnikhilprakash` |

## Local dev

Run each app separately (no root `dev` script):

```bash
# Terminal 1 — marketing site
cd web && bun run dev        # http://localhost:4321

# Terminal 2 — portal + API (Worker serves dashboard via [assets])
cd worker && bun run dev     # http://localhost:8787 (API + dashboard)
# Dashboard HMR still on :5173 if you run `cd dashboard && bun run dev` separately
```

`localhost:8787` also serves the last-built dashboard, mirroring production.

## When you buy a domain later

1. Add the domain to Cloudflare (nameservers).
2. `worker/wrangler.toml`: uncomment `routes` (custom domain for the Worker) and update `BETTER_AUTH_URL`, then push to `main`.
3. Pages → `drnikhilprakash` → **Custom domains** → add `drnikhilprakash.com`.
4. Update `PUBLIC_PORTAL_URL` in Pages → **Settings → Environment variables** (and `web/.env.production` for local builds), push to `main`.
5. Optionally add the new origins in `worker/src/auth.ts` (`getAllowedOrigins`). The dashboard needs no changes — same-origin already.

## Gotchas

1. **`database_id` placeholder** — pushing before replacing it in `wrangler.toml` will fail the Worker build. Do step 1 first.
2. **Dashboard must be built before the Worker deploy** — the build command in step 2 handles this; don't run `wrangler deploy` alone without building.
3. **Secrets** — only `BETTER_AUTH_SECRET` is secret (via `wrangler secret put`). `.dev.vars` and `.env.production` are gitignored / non-sensitive.
4. **Pages project names are globally unique** — if `drnikhilprakash` is taken, pick e.g. `drnikhil-web` and update the project name in step 3.
5. **Monorepo root** — both Cloudflare projects build from repo root `/`
   (so `bun` sees `bun.lock` + workspaces); they differ only by build command
   (`--filter=dashboard` + `wrangler deploy` for Workers,
   `--filter=drnikhilprakash` for Pages with output `web/dist`).
