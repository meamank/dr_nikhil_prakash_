import { useState } from "react"
import { toast } from "sonner"
import Header from "@/components/common/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"
import { apiPost } from "@/lib/api"

type StaffRole = "staff" | "admin"

export default function SettingsPage() {
  const [fullName, setFullName] = useState("")
  const [username, setUsername] = useState("")
  const [mobile, setMobile] = useState("")
  const [role, setRole] = useState<StaffRole>("staff")
  const [password, setPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<{
    id: string
    username: string
    role: StaffRole
  } | null>(null)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setCreated(null)
    try {
      const data = await apiPost<{
        staff: { id: string; fullName: string; username: string; role: StaffRole }
      }>("/api/staff", { fullName, username, mobile, role, password })
      setCreated(data.staff)
      setFullName("")
      setUsername("")
      setMobile("")
      setPassword("")
      setRole("staff")
      toast.success("Staff account created")
    } catch (reason) {
      const message =
        reason instanceof Error ? reason.message : "Could not create staff account"
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <Header title="Settings" />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Generate staff ID</CardTitle>
          <CardDescription>
            Create credentials for a staff member or administrator. They sign in
            with the generated username and password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="staff-full-name">Full name</Label>
              <Input
                id="staff-full-name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="e.g. Priya Kumari"
                autoFocus
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="staff-username">Username</Label>
              <Input
                id="staff-username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="e.g. reception_1"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="staff-mobile">Mobile</Label>
              <Input
                id="staff-mobile"
                inputMode="numeric"
                value={mobile}
                onChange={(event) => setMobile(event.target.value)}
                placeholder="10-digit mobile"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="staff-role">Role</Label>
              <NativeSelect
                id="staff-role"
                className="w-full"
                value={role}
                onChange={(event) => setRole(event.target.value as StaffRole)}
              >
                <NativeSelectOption value="staff">Staff</NativeSelectOption>
                <NativeSelectOption value="admin">Admin</NativeSelectOption>
              </NativeSelect>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="staff-password">Password</Label>
              <Input
                id="staff-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive sm:col-span-2">
                {error}
              </p>
            )}
            {created && (
              <p className="rounded-md bg-muted px-3 py-2 text-sm sm:col-span-2">
                Created {created.role} account for <strong>{created.username}</strong>.
                Staff ID: <span className="font-mono">{created.id}</span>
              </p>
            )}
            <div className="flex justify-end sm:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Creating…" : "Create staff ID"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
