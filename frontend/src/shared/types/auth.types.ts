export type Role = 'promoter' | 'business' | 'admin'

export interface User {
  id:    string
  name:  string
  email: string
  role:  Role
}

export interface RegisterPayload {
  name:     string
  email:    string
  password: string
  role:     Role
}

export interface AuthContextType {
  user:            User | null
  role:            Role | null
  login:           (email: string, password: string) => Promise<void>
  logout:          () => void
  register:        (data: RegisterPayload) => Promise<void>
  isAuthenticated: boolean
}