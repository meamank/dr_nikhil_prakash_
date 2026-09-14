import { Hono } from "hono"
import type { Env } from "../auth"

type MetaStatus = {
  id?: string
  status?: string
  errors?: Array<{ code?: number; title?: string; message?: string }>
}

type MetaWebhookPayload = {
  object?: string
  entry?: Array<{
    changes?: Array<{
      field?: string
      value?: { statuses?: MetaStatus[] }
    }>
  }>
}

const webhook = new Hono<{ Bindings: Env }>()

function hex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("")
}

function constantTimeEqual(left: string, right: string): boolean {
  const size = Math.max(left.length, right.length)
  let difference = left.length ^ right.length
  for (let index = 0; index < size; index += 1) {
    difference |=
      (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0)
  }
  return difference === 0
}

async function expectedSignature(
  appSecret: string,
  body: ArrayBuffer,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  return `sha256=${hex(await crypto.subtle.sign("HMAC", key, body))}`
}

// Meta calls this once when "Verify and save" is pressed in App Dashboard.
webhook.get("/webhook", (c) => {
  const mode = c.req.query("hub.mode")
  const token = c.req.query("hub.verify_token")
  const challenge = c.req.query("hub.challenge")

  if (
    mode !== "subscribe" ||
    !token ||
    !challenge ||
    !c.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ||
    !constantTimeEqual(token, c.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN)
  ) {
    return c.text("Webhook verification failed", 403)
  }

  return c.text(challenge, 200)
})

// Delivery, read, failure, and inbound-message notifications arrive here.
webhook.post("/webhook", async (c) => {
  const appSecret = c.env.META_APP_SECRET
  if (!appSecret) {
    console.error("META_APP_SECRET is not configured")
    return c.text("Webhook signature validation is unavailable", 503)
  }

  const body = await c.req.raw.arrayBuffer()
  const signature = c.req.header("X-Hub-Signature-256") ?? ""
  const expected = await expectedSignature(appSecret, body)
  if (!constantTimeEqual(signature, expected)) {
    return c.text("Invalid webhook signature", 401)
  }

  let payload: MetaWebhookPayload
  try {
    payload = JSON.parse(new TextDecoder().decode(body)) as MetaWebhookPayload
  } catch {
    return c.text("Invalid JSON", 400)
  }

  if (payload.object !== "whatsapp_business_account") {
    return c.json({ ok: true })
  }

  const statements: D1PreparedStatement[] = []
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "messages") continue
      for (const status of change.value?.statuses ?? []) {
        if (!status.id) continue

        const storedStatus =
          status.status === "failed"
            ? "failed"
            : status.status === "sent"
              ? "sent"
              : status.status === "delivered" || status.status === "read"
                ? "delivered"
                : null
        if (!storedStatus) continue

        const firstError = status.errors?.[0]
        const error = firstError
          ? [firstError.code, firstError.title, firstError.message]
              .filter((part) => part !== undefined && part !== "")
              .join(": ")
          : null
        statements.push(
          c.env.DB.prepare(
            "UPDATE whatsapp_logs SET status = ?, error = ? WHERE provider_id = ?",
          ).bind(storedStatus, error, status.id),
        )
      }
    }
  }

  if (statements.length > 0) await c.env.DB.batch(statements)
  return c.json({ ok: true })
})

export default webhook
