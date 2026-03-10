export const ROLES = {
  PROMOTER: 'promoter',
  BUSINESS: 'business',      
  ADMIN:    'admin',
} as const

export type Role = typeof ROLES[keyof typeof ROLES]
// Role = 'promoter' | 'business' | 'admin'