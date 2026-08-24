import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { phoneNumber, username } from "better-auth/plugins"
import { drizzle } from "drizzle-orm/d1"
import * as schema from "./db/schema"

export type Env = {
  DB: D1Database
}



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



    trustedOrigins: ["http://localhost:5173"],
  })
}

export type Auth = ReturnType<typeof createAuth>
