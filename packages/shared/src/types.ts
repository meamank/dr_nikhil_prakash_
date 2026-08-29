export type Role = "admin" | "staff" | "user"

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; field?: string }

export type UserPublic = {
  id: string
  name: string
  email: string | null
  phoneNumber: string | null
  role: Role
}
