import { createDb } from "./db"
import * as schema from "./db/schema"

/**
 * WhatsApp Cloud API sender (Meta).
 *
 * Secrets (never commit — set via `wrangler secret put`):
 *   WHATSAPP_TOKEN            — System User token with whatsapp_business_messaging
 *   WHATSAPP_PHONE_NUMBER_ID  — phone_number_id from Meta dashboard
 *   WHATSAPP_OTP_TEMPLATE     — auth template name (default: clinic_otp)
 *   WHATSAPP_BOOKING_TEMPLATE — booking confirm template (default: booking_confirm)
 *   WHATSAPP_TEMPLATE_LANGUAGE — approved template language (default: en_US)
 *   WHATSAPP_API_VERSION      — Graph API version (default: v21.0)
 *
 * Local dev without secrets: logs the code to console and pretends success
 * so the booking flow can be tested end-to-end without Meta.
 */

export type WhatsAppEnv = {
  DB: D1Database
  WHATSAPP_TOKEN?: string
  WHATSAPP_PHONE_NUMBER_ID?: string
  WHATSAPP_OTP_TEMPLATE?: string
  WHATSAPP_BOOKING_TEMPLATE?: string
  WHATSAPP_TEMPLATE_LANGUAGE?: string
  WHATSAPP_API_VERSION?: string
}

export function isWhatsAppConfigured(env: WhatsAppEnv): boolean {
  return Boolean(env.WHATSAPP_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID)
}

function newId(): string {
  return crypto.randomUUID()
}

async function logMessage(
  env: WhatsAppEnv,
  row: {
    toMobile: string
    template: string
    appointmentId?: string | null
    providerId?: string | null
    status: "queued" | "sent" | "delivered" | "failed"
    error?: string | null
  },
) {
  try {
    const db = createDb(env.DB)
    await db.insert(schema.whatsappLogs).values({
      id: newId(),
      toMobile: row.toMobile,
      template: row.template,
      appointmentId: row.appointmentId ?? null,
      providerId: row.providerId ?? null,
      status: row.status,
      error: row.error ?? null,
    })
  } catch (e) {
    console.error("whatsapp log failed", e)
  }
}

/**
 * Send a six-letter code using an Authentication template with an OTP
 * copy-code button. The approved template receives the same code in its body
 * and button parameter.
 */
export async function sendOtpWhatsApp(
  env: WhatsAppEnv,
  mobile10: string,
  code: string,
): Promise<{ ok: boolean; providerId?: string; error?: string }> {
  const template = env.WHATSAPP_OTP_TEMPLATE ?? "clinic_otp"
  const language = env.WHATSAPP_TEMPLATE_LANGUAGE ?? "en_US"
  const apiVersion = env.WHATSAPP_API_VERSION ?? "v21.0"

  if (!isWhatsAppConfigured(env)) {
    // Dev fallback — visible in `wrangler dev` logs
    console.log(`[whatsapp:dev] OTP ${mobile10} → ${code}`)
    await logMessage(env, {
      toMobile: mobile10,
      template,
      status: "sent",
      providerId: "dev",
    })
    return { ok: true, providerId: "dev" }
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${apiVersion}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: `91${mobile10}`,
          type: "template",
          template: {
            name: template,
            language: { code: language },
            components: [
              {
                type: "body",
                parameters: [{ type: "text", text: code }],
              },
              {
                type: "button",
                sub_type: "url",
                index: "0",
                parameters: [{ type: "text", text: code }],
              },
            ],
          },
        }),
      },
    )
    const data = (await res.json().catch(() => null)) as {
      messages?: { id: string }[]
      error?: { message?: string; code?: number }
    } | null

    if (!res.ok || !data?.messages?.[0]?.id) {
      const error =
        data?.error?.message ?? `Meta API ${res.status} ${res.statusText}`
      await logMessage(env, {
        toMobile: mobile10,
        template,
        status: "failed",
        error,
      })
      return { ok: false, error }
    }

    const providerId = data.messages[0].id
    await logMessage(env, {
      toMobile: mobile10,
      template,
      status: "sent",
      providerId,
    })
    return { ok: true, providerId }
  } catch (e) {
    const error = e instanceof Error ? e.message : "whatsapp send failed"
    await logMessage(env, {
      toMobile: mobile10,
      template,
      status: "failed",
      error,
    })
    return { ok: false, error }
  }
}

/**
 * Send a booking confirmation (utility template with booking details).
 * Fire-and-forget — booking succeeds even if this fails.
 */
export async function sendBookingConfirmWhatsApp(
  env: WhatsAppEnv,
  mobile10: string,
  appointmentId: string,
  details: { patientName: string; appointmentDate: string; queueNumber: number },
): Promise<void> {
  const template = env.WHATSAPP_BOOKING_TEMPLATE ?? "booking_confirm"
  const language = env.WHATSAPP_TEMPLATE_LANGUAGE ?? "en_US"
  const apiVersion = env.WHATSAPP_API_VERSION ?? "v21.0"

  if (!isWhatsAppConfigured(env)) {
    console.log(
      `[whatsapp:dev] booking confirm ${mobile10} → ${details.patientName} on ${details.appointmentDate}, queue ${details.queueNumber}`,
    )
    await logMessage(env, {
      toMobile: mobile10,
      template,
      appointmentId,
      status: "sent",
      providerId: "dev",
    })
    return
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${apiVersion}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: `91${mobile10}`,
          type: "template",
          template: {
            name: template,
            language: { code: language },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: details.patientName },
                  { type: "text", text: details.appointmentDate },
                  { type: "text", text: String(details.queueNumber) },
                  { type: "text", text: "9801317878" },
                ],
              },
            ],
          },
        }),
      },
    )
    const data = (await res.json().catch(() => null)) as {
      messages?: { id: string }[]
      error?: { message?: string }
    } | null
    await logMessage(env, {
      toMobile: mobile10,
      template,
      appointmentId,
      status: res.ok && data?.messages?.[0]?.id ? "sent" : "failed",
      providerId: data?.messages?.[0]?.id ?? null,
      error: res.ok ? null : (data?.error?.message ?? `Meta API ${res.status}`),
    })
  } catch (e) {
    await logMessage(env, {
      toMobile: mobile10,
      template,
      appointmentId,
      status: "failed",
      error: e instanceof Error ? e.message : "whatsapp send failed",
    })
  }
}
