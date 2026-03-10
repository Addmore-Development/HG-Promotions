import { Role } from '../constants/roles'

export interface UserProfile {
  id:        string
  name:      string
  email:     string
  phone?:    string
  role:      Role
  avatarUrl?: string
  createdAt: string
}

export interface TeamMember extends UserProfile {
  businessId:   string      
  jobsAssigned: number
}