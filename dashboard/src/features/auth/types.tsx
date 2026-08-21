export type UserRole = "ADMIN" | "STAFF" | "PATIENT"

export type AuthUser = {
  id: string
  name: string
  mobile: string
  role: UserRole
}

export type AuthContextType = {
  isAuthenticated: boolean
  user: AuthUser | null
  isLoading?: boolean
}
