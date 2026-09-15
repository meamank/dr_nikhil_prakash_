/**
 * Single source of truth for the Worker API base URL.
 *
 * - Explicit `VITE_API_URL` wins (CI / previews).
 * - Production: same origin (Worker serves this SPA + /api/*).
 * - Dev: worker on :8787 next to this dashboard on :5173.
 */
export function apiBase(): string {
  if (import.meta.env.VITE_API_URL)
    return import.meta.env.VITE_API_URL as string
  if (typeof window === "undefined") return "http://localhost:8787"
  if (import.meta.env.PROD) return window.location.origin
  return `${window.location.protocol}//${window.location.hostname}:8787`
}

type ApiError = { error?: string }

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => null)) as
    | (T & ApiError)
    | null
  if (!res.ok) throw new Error(data?.error ?? `Request failed (${res.status})`)
  return data as T
}

/** GET JSON with session cookies. Throws with the server's error message. */
export async function apiGet<T>(
  path: string,
  options?: { signal?: AbortSignal }
): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    credentials: "include",
    signal: options?.signal,
  })
  return parse<T>(res)
}

/** POST JSON with session cookies. Throws with the server's error message. */
export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return parse<T>(res)
}

/** PATCH JSON with session cookies. Throws with the server's error message. */
export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  })
  return parse<T>(res)
}

/** DELETE with session cookies. Throws with the server's error message. */
export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    method: "DELETE",
    credentials: "include",
  })
  return parse<T>(res)
}
