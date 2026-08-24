import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { Link, useNavigate } from "@tanstack/react-router"
import { z } from "zod"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"
import { Logo } from "./Logo"

// Validation

const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name is too long")

const mobileSchema = z
  .string()
  .trim()
  .min(10, "Enter 10-digit mobile number")
  .refine(
    (val) => {
      const digits = val.replace(/\D/g, "")
      const normalized =
        digits.length === 12 && digits.startsWith("91")
          ? digits.slice(2)
          : digits.length === 11 && digits.startsWith("0")
            ? digits.slice(1)
            : digits
      return /^\d{10}$/.test(normalized) && /^[6-9]\d{9}$/.test(normalized)
    },
    { message: "Enter a valid 10-digit mobile (6-9 prefix)" }
  )

const emailSchema = z
  .string()
  .trim()
  .optional()
  .refine(
    (val) => {
      if (!val || val === "") return true
      return z.string().email().safeParse(val).success
    },
    { message: "Enter a valid email or leave it empty" }
  )

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")

const signupSchema = z
  .object({
    name: nameSchema,
    mobile: mobileSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export type SignupFormValues = z.infer<typeof signupSchema>

function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "")
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2)
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1)
  return digits
}

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: {
      name: "",
      mobile: "",
      email: "",
      password: "",
      confirmPassword: "",
    } as SignupFormValues,
    onSubmit: async ({ value }) => {
      setServerError(null)

      const parsed = signupSchema.safeParse(value)
      if (!parsed.success) {
        // surface first issue as banner, field errors handle per-field
        const first = parsed.error.issues[0]
        // if it's confirmPassword mismatch, let the field show it
        if (first?.path[0] !== "confirmPassword") {
          setServerError(first?.message || "Validation failed")
        }
        return
      }

      try {
        const normalizedPhone = normalizePhone(parsed.data.mobile)
        const emailTrimmed = parsed.data.email?.trim()
        const emailOrTemp =
          emailTrimmed && emailTrimmed !== ""
            ? emailTrimmed.toLowerCase()
            : `${normalizedPhone}@phone.local`

        const res = await authClient.signUp.email({
          name: parsed.data.name.trim(),
          email: emailOrTemp,
          password: parsed.data.password,
          phoneNumber: normalizedPhone,
        } as unknown as Parameters<typeof authClient.signUp.email>[0])

        if (res.error) {
          const msg =
            (res.error as { message?: string })?.message ||
            "Failed to create account"
          setServerError(msg)
          return
        }

        toast.success("Account created")
        navigate({ to: "/appointments" })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unexpected error"
        setServerError(msg)
      }
    },
  })

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form
            className="p-6 md:p-8"
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
          >
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Create your account</h1>
                <p className="text-sm text-balance text-muted-foreground">
                  Create your account
                </p>
              </div>

              {serverError && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm font-medium text-destructive">
                  {serverError}
                </div>
              )}

              {/* Name */}
              <form.Field
                name="name"
                validators={{
                  onChange: ({ value }) => {
                    const r = nameSchema.safeParse(value)
                    return r.success ? undefined : r.error.issues[0]?.message
                  },
                }}
              >
                {(field) => {
                  const hasError =
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0
                  return (
                    <Field data-invalid={hasError}>
                      <FieldLabel htmlFor={field.name}>Full name</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        placeholder="Aman Sharma"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        autoComplete="name"
                      />
                      {hasError && (
                        <FieldError
                          errors={field.state.meta.errors.map((m) => ({
                            message: m,
                          }))}
                        />
                      )}
                    </Field>
                  )
                }}
              </form.Field>

              {/* Mobile */}
              <form.Field
                name="mobile"
                validators={{
                  onChange: ({ value }) => {
                    const r = mobileSchema.safeParse(value)
                    return r.success ? undefined : r.error.issues[0]?.message
                  },
                }}
              >
                {(field) => {
                  const hasError =
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0
                  return (
                    <Field data-invalid={hasError}>
                      <FieldLabel htmlFor={field.name}>
                        Mobile <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="tel"
                        inputMode="numeric"
                        placeholder="9123456789"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        autoComplete="tel"
                      />
                      {hasError && (
                        <FieldError
                          errors={field.state.meta.errors.map((m) => ({
                            message: m,
                          }))}
                        />
                      )}
                    </Field>
                  )
                }}
              </form.Field>

              {/* Email (optional) */}
              <form.Field
                name="email"
                validators={{
                  onChange: ({ value }) => {
                    const r = emailSchema.safeParse(value)
                    return r.success ? undefined : r.error.issues[0]?.message
                  },
                }}
              >
                {(field) => {
                  const hasError =
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0
                  return (
                    <Field data-invalid={hasError}>
                      <FieldLabel htmlFor={field.name}>
                        Email{" "}
                        <span className="font-normal text-muted-foreground">
                          (optional)
                        </span>
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="email"
                        placeholder="you@example.com"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        autoComplete="email"
                      />
                      {hasError && (
                        <FieldError
                          errors={field.state.meta.errors.map((m) => ({
                            message: m,
                          }))}
                        />
                      )}
                    </Field>
                  )
                }}
              </form.Field>

              {/* Password */}
              <form.Field
                name="password"
                validators={{
                  onChange: ({ value }) => {
                    const r = passwordSchema.safeParse(value)
                    return r.success ? undefined : r.error.issues[0]?.message
                  },
                }}
              >
                {(field) => {
                  const hasError =
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0
                  return (
                    <Field data-invalid={hasError}>
                      <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="password"
                        placeholder="••••••••"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        autoComplete="new-password"
                      />
                      {hasError ? (
                        <FieldError
                          errors={field.state.meta.errors.map((m) => ({
                            message: m,
                          }))}
                        />
                      ) : (
                        <FieldDescription>
                          At least 8 characters
                        </FieldDescription>
                      )}
                    </Field>
                  )
                }}
              </form.Field>

              {/* Confirm Password */}
              <form.Field
                name="confirmPassword"
                validators={{
                  onChange: ({ value }) => {
                    const pwd = form.getFieldValue("password") as string
                    if (!value) return "Confirm your password"
                    if (value !== pwd) return "Passwords do not match"
                    return undefined
                  },
                  onChangeListenTo: ["password"],
                }}
              >
                {(field) => {
                  const hasError =
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0
                  return (
                    <Field data-invalid={hasError}>
                      <FieldLabel htmlFor={field.name}>
                        Confirm password
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="password"
                        placeholder="••••••••"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        autoComplete="new-password"
                      />
                      {hasError && (
                        <FieldError
                          errors={field.state.meta.errors.map((m) => ({
                            message: m,
                          }))}
                        />
                      )}
                    </Field>
                  )
                }}
              </form.Field>

              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
              >
                {([canSubmit, isSubmitting]) => (
                  <Field>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={!canSubmit || isSubmitting}
                    >
                      {isSubmitting ? "Creating account..." : "Create account"}
                    </Button>
                  </Field>
                )}
              </form.Subscribe>

              <FieldDescription className="text-center">
                Already have an account? <Link to="/login">Log in</Link>
              </FieldDescription>
            </FieldGroup>
          </form>

          <div className="relative hidden items-center justify-center bg-muted p-8 md:flex">
            <Logo className="size-60 text-primary" />
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center text-xs">
        By creating an account you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
}
