import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { phoneNumber, username } from "better-auth/plugins"
import { drizzle } from "drizzle-orm/d1"
import * as schema from "./db/schema"

export type Env = {
  DB: D1Database
}

/**
 * Creates a better-auth instance bound to the D1 database from the current request.
 *
 * Plugins in use:
 *  - emailPassword  (built-in, enabled by default)
 *  - phoneNumber    → signIn.phoneNumber({ phoneNumber, password })
 *                     requires account row with providerId = "credential"
 *  - username       → signIn.username({ username, password })
 *                     used for PID-based login (walk-in patients, staff)
 *
 * Called once per request inside the Hono auth handler.
 */
export function createAuth(env: Env) {
  const db = drizzle(env.DB, { schema })

  return betterAuth({
    baseURL: "http://localhost:8787",
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
      // No email verification for now
      requireEmailVerification: false,
    },


    // Plugins

    plugins: [
      // Phone number + password sign-in
      // The plugin stores the credential under providerId = "credential" in
      // the account table, so signIn.phoneNumber({ phoneNumber, password })
      // resolves the user by phoneNumber column then validates the password.
      phoneNumber({
        // Stub — wire WhatsApp OTP here later
        sendOTP: async ({ phoneNumber, code }) => {
          console.log(`[OTP stub] ${phoneNumber} → ${code}`)
        },
        // Skip OTP verification during sign-up for now
        signUpOnVerification: {
          getTempEmail: (phoneNumber) =>
            `${phoneNumber.replace(/\D/g, "")}@phone.local`,
        },
      }),

      // Username + password — used for PID login
      // Walk-in patients created by staff have their PID stored as `username`.
      // Staff accounts also use email but can optionally have username set.
      username(),
    ],


    // Session config

    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24,      // roll session if older than 1 day
    },


    // Trusted origins — must list both dev and prod
    // Updated by setting the BETTER_AUTH_TRUSTED_ORIGINS env var in production

    trustedOrigins: ["http://localhost:5173"],
  })
}

export type Auth = ReturnType<typeof createAuth>
