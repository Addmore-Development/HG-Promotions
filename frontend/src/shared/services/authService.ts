import type { User, RegisterPayload } from '../types/auth.types'

export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    // swap with real API later
    return { id: '1', name: 'Test User', email, role: 'promoter' }
  },

  register: async (data: RegisterPayload): Promise<User> => {
    // swap with real API later
    return { id: '2', name: data.name, email: data.email, role: data.role }
  },

  logout: async (): Promise<void> => {},
}