
import { createAuthClient } from "better-auth/react"
import {
  phoneNumberClient,
  usernameClient,
  inferAdditionalFields,
} from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8787",
  plugins: [
    phoneNumberClient(),
    usernameClient(),
    inferAdditionalFields({
      user: {
        role: {
          type: "string",
          required: false,
        },
        isFirstLogin: {
          type: "boolean",
          required: false,
        },
      },
    }),
  ],
})

export const { useSession, signIn, signOut, signUp, getSession } = authClient





/**
 * Detects whether the user entered a phone number, email, or username/PID.
 */
export function detectIdentifierType(input: string): "phone" | "email" | "username" {
  const trimmed = input.trim()
  
  if (trimmed.includes("@")) {
    return "email"
  }
  
  // Extract only digits to check for 10-digit phone number (or +91 format)
  const digits = trimmed.replace(/\D/g, "")
  if (digits.length === 10 || (digits.length === 12 && digits.startsWith("91"))) {
    return "phone"
  }
  
  // Anything else (e.g. PID-00001)
  return "username"
}

/**
 * Universal login function that calls the appropriate better-auth sign-in method.
 */
export async function loginWithIdentifier(identifier: string, password: string) {
  const type = detectIdentifierType(identifier)

  if (type === "phone") {
    const digits = identifier.replace(/\D/g, "")
    const normalizedPhone = digits.length === 12 && digits.startsWith("91") 
      ? digits.slice(2) 
      : digits

    return await authClient.signIn.phoneNumber({
      phoneNumber: normalizedPhone,
      password,
    })
  }

  if (type === "email") {
    return await authClient.signIn.email({
      email: identifier.trim(),
      password,
    })
  }

  // username / PID flow
  return await authClient.signIn.username({
    username: identifier.trim(),
    password,
  })
}
