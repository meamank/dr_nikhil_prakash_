import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { phoneNumber, username } from "better-auth/plugins"
import { drizzle } from "drizzle-orm/d1"
import * as schema from "./db/schema"

export type Env = {
  DB: D1Database
  /**
   * Secret used to sign sessions/cookies. REQUIRED in production — set with
   * `wrangler secret put BETTER_AUTH_SECRET` (generate: openssl rand -base64 32).
   * In local dev it can stay unset (better-auth falls back to an insecure dev secret).
   */
  BETTER_AUTH_SECRET?: string
  /**
   * Public URL of the API in production, e.g. "https://api.drnikhilprakash.com".
   * Set in wrangler.toml [vars]; overridden in dev via .dev.vars.
   */
  BETTER_AUTH_URL?: string
  /**
   * Comma-separated list of extra origins allowed to call the API during
   * local development (e.g. "http://192.168.1.9:5173" when testing the
   * dashboard from a phone on the LAN). Set in .dev.vars.
   */
  DEV_ORIGINS?: string
}

/** Origins allowed for CORS and better-auth (dashboard runs on :5173). */
export function getAllowedOrigins(env?: Partial<Env>): string[] {
  const extra = (env?.DEV_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
  return [
    "http://localhost:5173",
    // Production frontends (Cloudflare Pages custom domains)
    "https://drnikhilprakash.com",
    "https://portal.drnikhilprakash.com",
    ...extra,
  ]
}



export function createAuth(env: Env) {
  const db = drizzle(env.DB, { schema })

  return betterAuth({
    baseURL: env.BETTER_AUTH_URL ?? "http://localhost:8787",
    // Workers have no process.env — the secret must be passed explicitly
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, {
      provider: "sqlite",
      // Map better-auth table names to our Drizzle schema
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),

   
    // Custom user fields

    user: {
      additionalFields: {
        role: {
          type: "string",
          defaultValue: "user",
          input: false, // Disallows client-supplied role on public signups
        },
        isFirstLogin: {
          type: "boolean",
          defaultValue: false,
          input: false,
        },
      },
    },


    // Email + password — enabled by default in better-auth

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },


    // Plugins

    plugins: [
     
      phoneNumber({
        // Stub — wire WhatsApp OTP here later
        sendOTP: async ({ phoneNumber, code }) => {
          console.log(` ${phoneNumber} → ${code}`)
        },

        signUpOnVerification: {
          getTempEmail: (phoneNumber) =>
            `${phoneNumber.replace(/\D/g, "")}@phone.local`,
        },
      }),

      // Username + password — used for PID login
      username(),
    ],


    // Session config

    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24,      // roll session if older than 1 day
    },



    trustedOrigins: getAllowedOrigins(env),
  })
}

export type Auth = ReturnType<typeof createAuth>
