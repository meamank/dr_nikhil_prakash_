import { z } from "zod"
import { isValidPhone } from "../phone"

// Re-export for convenience
export { z }

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name is too long")

export const mobileSchema = z
  .string()
  .trim()
  .min(10, "Enter 10-digit mobile number")
  .refine((val) => isValidPhone(val), {
    message: "Enter a valid 10-digit mobile (6-9 prefix)",
  })

export const emailOptionalSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine(
    (val) => {
      if (!val || val === "") return true
      return z.string().email().safeParse(val).success
    },
    { message: "Enter a valid email or leave it empty" }
  )

export const emailRequiredSchema = z.string().trim().email("Enter a valid email")

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")

export const signupSchema = z
  .object({
    name: nameSchema,
    mobile: mobileSchema,
    email: emailOptionalSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export const identifierSchema = z
  .string()
  .trim()
  .min(3, "Mobile number, email, or PID is required")
  .refine(
    (val) => {
      if (val.includes("@")) return z.string().email().safeParse(val).success
      const digits = val.replace(/\D/g, "")
      if (/^\+?\d+$/.test(val)) return digits.length === 10 || (digits.length === 12 && digits.startsWith("91")) || isValidPhone(val)
      return val.length >= 3
    },
    { message: "Please enter a valid 10-digit mobile, email, or PID" }
  )

export const loginSchema = z.object({
  identifier: identifierSchema,
  password: z.string().min(1, "Password is required").min(8, "Password must be at least 8 characters"),
})

export type SignupFormValues = z.infer<typeof signupSchema>
export type LoginFormValues = z.infer<typeof loginSchema>
