import { Role } from '../constants/roles'

export type OnboardingStatus = 'incomplete' | 'pending_review' | 'approved' | 'rejected' | 'blacklisted';

export interface PhysicalAttributes {
  height: number; // cm
  clothingSize: string;
  shoeSize?: string;
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountType: string;
  branchCode: string;
}

export interface DocumentVault {
  idFront?: string;       // file URL / base64 placeholder
  idBack?: string;
  taxNumber?: string;
  bankConfirmation?: string;
  cv?: string;
  profilePhotos: string[]; // max 3
}

export interface UserProfile {
  id:        string
  name:      string
  email:     string
  phone?:    string
  role:      Role
  avatarUrl?: string
  createdAt: string
  gender: 'male' | 'female' | 'other';
  physicalAttributes: PhysicalAttributes;
}

export interface TeamMember extends UserProfile {
  businessId:   string      
  jobsAssigned: number
}

export interface TeamMember {
  userId: string;
  fullName: string;
  profilePhoto?: string;
  reliabilityScore: number;
  onboardingStatus: OnboardingStatus;
}