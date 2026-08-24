import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { Link, useNavigate } from "@tanstack/react-router"
import { z } from "zod"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { loginWithIdentifier } from "@/lib/auth-client"
import { Logo } from "./Logo"

const identifierSchema = z
  .string()
  .trim()
  .min(3, "Mobile number, email, or PID is required")
  .refine(
    (val) => {
      // If user is entering an email, validate email format
      if (val.includes("@")) {
        return z.string().email().safeParse(val).success
      }
      // If user is entering numbers, check for valid 10-digit phone
      const digits = val.replace(/\D/g, "")
      if (/^\+?\d+$/.test(val)) {
        return digits.length === 10
      }
      // Otherwise username / PID (e.g. PID-00001, admin)
      return val.length >= 3
    },
    {
      message: "Please enter a valid 10-digit mobile, email, or PID",
    }
  )

const passwordSchema = z
  .string()
  .min(1, "Password is required")
  .min(8, "Password must be at least 8 characters")

const loginSchema = z.object({
  identifier: identifierSchema,
  password: passwordSchema,
})

export type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: {
      identifier: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      setServerError(null)

      // Validate entire payload with Zod
      const parsed = loginSchema.safeParse(value)
      if (!parsed.success) {
        setServerError(parsed.error.issues[0]?.message || "Validation failed")
        return
      }

      try {
        const res = await loginWithIdentifier(
          parsed.data.identifier,
          parsed.data.password
        )

        if (res?.error) {
          setServerError(
            res.error.message || "Invalid credentials. Please try again."
          )
          return
        }

        navigate({ to: "/" })
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error
            ? err.message
            : "An unexpected error occurred during login."
        setServerError(errorMsg)
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
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-sm text-balance text-muted-foreground">
                  Login to book your account
                </p>
              </div>

              {serverError && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm font-medium text-destructive">
                  {serverError}
                </div>
              )}

              {/* Identifier field: Phone / Email / PID */}
              <form.Field
                name="identifier"
                validators={{
                  onChange: ({ value }) => {
                    const result = identifierSchema.safeParse(value)
                    return result.success
                      ? undefined
                      : result.error.issues[0]?.message
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
                        Mobile / Email / PID
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="text"
                        placeholder="9123456789 or PID-0001 or doc@example.com"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        autoComplete="username"
                      />
                      {hasError && (
                        <FieldError
                          errors={field.state.meta.errors.map((msg) => ({
                            message: msg,
                          }))}
                        />
                      )}
                    </Field>
                  )
                }}
              </form.Field>

              {/* Password field */}
              <form.Field
                name="password"
                validators={{
                  onChange: ({ value }) => {
                    const result = passwordSchema.safeParse(value)
                    return result.success
                      ? undefined
                      : result.error.issues[0]?.message
                  },
                }}
              >
                {(field) => {
                  const hasError =
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0
                  return (
                    <Field data-invalid={hasError}>
                      <div className="flex items-center justify-between">
                        <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                        <a
                          href="#"
                          className="ml-auto text-xs text-muted-foreground underline-offset-2 hover:underline"
                        >
                          Forgot password?
                        </a>
                      </div>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="password"
                        placeholder="••••••••"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        autoComplete="current-password"
                      />
                      {hasError && (
                        <FieldError
                          errors={field.state.meta.errors.map((msg) => ({
                            message: msg,
                          }))}
                        />
                      )}
                    </Field>
                  )
                }}
              </form.Field>

              {/* Submit Button */}
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
                      {isSubmitting ? "Signing in..." : "Login"}
                    </Button>
                  </Field>
                )}
              </form.Subscribe>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or
              </FieldSeparator>
              <FieldDescription className="text-center">
                Don't have an account?{" "}
                <Link to="/signup">Create an account</Link>
              </FieldDescription>
            </FieldGroup>
          </form>

          <div className="relative hidden items-center justify-center bg-muted p-8 md:flex">
            <Logo className="size-60 text-primary" />
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center text-xs">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
}
