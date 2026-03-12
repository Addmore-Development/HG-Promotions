// shared/services/mockData.ts
// Single source of truth for all mock data.
// UserProfile.email added so AuthContext can map logged-in user → profile.
// usersService.getProfile() accepts either userId OR email as lookup key.

import type { UserProfile }  from '../types/user.types';
import type { Job }           from '../types/job.types';
import type { Shift }         from '../types/shift.types';
import type { Payment }       from '../types/payment.types';

// ─── Profiles ─────────────────────────────────────────────────────────────────
// email field added — matches the credentials used in the real auth system
export interface UserProfileWithEmail extends UserProfile {
  email: string;
}

export const MOCK_PROFILES: UserProfileWithEmail[] = [
  {
    userId:      'p-003',
    email:       'lebo@honeygroup.co.za',
    fullName:    'Lebo Mokoena',
    idNumber:    '0001125034567',
    dateOfBirth: '2000-01-12',
    gender:      'female',
    address:     '7 Nelson Mandela Square',
    city:        'Sandton',
    province:    'Gauteng',
    physicalAttributes: { height: 172, clothingSize: 'M', shoeSize: '6' },
    documents: {
      idFront: 'mock://id_front.jpg', idBack: 'mock://id_back.jpg',
      taxNumber: '9876543210', bankConfirmation: 'mock://bank_letter.pdf',
      cv: 'mock://cv.pdf', profilePhotos: ['mock://photo1.jpg'],
    },
    bankDetails: { bankName: 'Capitec', accountNumber: '1234567890', accountType: 'Savings', branchCode: '470010' },
    reliabilityScore: 4.2,
    onboardingStatus: 'approved',
    profilePhoto: 'https://i.pravatar.cc/150?img=32',
    socialMedia: { instagram: '@lebo_promo', tiktok: '@lebopromo' },
    createdAt: '2024-10-15T07:00:00Z',
    updatedAt: '2024-10-20T09:00:00Z',
  },
  {
    userId:      'p-002',
    email:       'thabo@honeygroup.co.za',
    fullName:    'Thabo Nkosi',
    idNumber:    '9505105034567',
    dateOfBirth: '1995-05-10',
    gender:      'male',
    address:     '14 Commissioner Street',
    city:        'Johannesburg',
    province:    'Gauteng',
    physicalAttributes: { height: 182, clothingSize: 'L', shoeSize: '10' },
    documents: {
      idFront: 'mock://id_front2.jpg', idBack: 'mock://id_back2.jpg',
      taxNumber: '1234567890', bankConfirmation: 'mock://bank2.pdf',
      cv: 'mock://cv2.pdf', profilePhotos: [],
    },
    bankDetails: { bankName: 'FNB', accountNumber: '9876543210', accountType: 'Cheque', branchCode: '250655' },
    reliabilityScore: 3.8,
    onboardingStatus: 'approved',
    profilePhoto: 'https://i.pravatar.cc/150?img=12',
    socialMedia: { instagram: '@thabo_sa' },
    createdAt: '2024-09-01T08:00:00Z',
    updatedAt: '2024-09-10T08:00:00Z',
  },
  {
    userId:      'p-new',
    email:       '',
    fullName:    '',
    idNumber:    '',
    dateOfBirth: '',
    gender:      'female',
    address:     '',
    city:        '',
    province:    '',
    physicalAttributes: { height: 0, clothingSize: '' },
    documents: { profilePhotos: [] },
    reliabilityScore: 0,
    onboardingStatus: 'incomplete',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ─── Jobs ─────────────────────────────────────────────────────────────────────
export const MOCK_JOBS: Job[] = [
  {
    id: 'j-001', title: 'Castle Lite Brand Activator',
    client: 'AB InBev', brand: 'Castle Lite',
    venue: 'Sandton City Mall', address: '163 Fifth St, Sandhurst, Sandton',
    coordinates: { lat: -26.1076, lng: 28.0560 },
    date: '2025-07-12', startTime: '18:00', endTime: '22:00',
    hourlyRate: 120, totalSlots: 4, filledSlots: 2,
    filters: { gender: 'female', minHeight: 160 },
    status: 'open', distanceKm: 3.2,
    createdBy: 'admin-001', createdAt: '2025-07-01T08:00:00Z',
  },
  {
    id: 'j-002', title: 'Vodacom Promo Specialist',
    client: 'Vodacom', brand: 'Vodacom',
    venue: 'Rosebank Mall', address: 'The Zone, Oxford Rd, Rosebank',
    coordinates: { lat: -26.1461, lng: 28.0438 },
    date: '2025-07-15', startTime: '09:00', endTime: '17:00',
    hourlyRate: 100, totalSlots: 6, filledSlots: 6,
    filters: { gender: 'any' },
    status: 'filled', distanceKm: 7.1,
    createdBy: 'admin-001', createdAt: '2025-07-02T08:00:00Z',
  },
  {
    id: 'j-003', title: 'Amarula Experiential Hostess',
    client: 'Distell', brand: 'Amarula',
    venue: 'Hyde Park Corner', address: 'Jan Smuts Ave, Hyde Park',
    coordinates: { lat: -26.1223, lng: 28.0371 },
    date: '2025-07-18', startTime: '17:00', endTime: '21:00',
    hourlyRate: 130, totalSlots: 3, filledSlots: 1,
    filters: { gender: 'female', minHeight: 165 },
    status: 'open', distanceKm: 5.4,
    createdBy: 'admin-001', createdAt: '2025-07-03T08:00:00Z',
  },
  {
    id: 'j-004', title: 'MTN Street Team Member',
    client: 'MTN', brand: 'MTN',
    venue: 'Eastgate Shopping Centre', address: '43 Bradford Rd, Bedfordview',
    coordinates: { lat: -26.1778, lng: 28.1214 },
    date: '2025-07-20', startTime: '10:00', endTime: '16:00',
    hourlyRate: 95, totalSlots: 8, filledSlots: 3,
    filters: { gender: 'any' },
    status: 'open', distanceKm: 14.8,
    createdBy: 'admin-001', createdAt: '2025-07-04T08:00:00Z',
  },
  {
    id: 'j-005', title: 'Heineken Live Activation',
    client: 'Heineken', brand: 'Heineken',
    venue: 'Fourways Mall', address: 'William Nicol Dr, Fourways',
    coordinates: { lat: -26.0271, lng: 28.0068 },
    date: '2025-07-25', startTime: '19:00', endTime: '23:00',
    hourlyRate: 140, totalSlots: 5, filledSlots: 0,
    filters: { gender: 'female', minHeight: 162 },
    status: 'open', distanceKm: 18.3,
    createdBy: 'admin-001', createdAt: '2025-07-05T08:00:00Z',
  },
];

// ─── Shifts ───────────────────────────────────────────────────────────────────
export const MOCK_SHIFTS: Shift[] = [
  {
    id: 's-001', jobId: 'j-001', promoterId: 'p-003',
    attendance: {
      shiftId: 's-001', promoterId: 'p-003', jobId: 'j-001',
      checkInTime:  '2025-06-28T18:02:00Z',
      checkInLocation: { lat: -26.1076, lng: 28.056, accuracy: 12, timestamp: '2025-06-28T18:02:00Z' },
      checkInSelfie: 'mock://selfie1.jpg',
      checkOutTime: '2025-06-28T22:05:00Z',
      checkOutLocation: { lat: -26.1076, lng: 28.056, accuracy: 8, timestamp: '2025-06-28T22:05:00Z' },
      checkOutSelfie: 'mock://selfie1_out.jpg',
      totalHours: 4.05, issues: [], supervisorRating: 5, status: 'approved',
    },
    grossPay: 486, deductions: 0, netPay: 486, status: 'approved',
  },
  {
    id: 's-002', jobId: 'j-002', promoterId: 'p-003',
    attendance: {
      shiftId: 's-002', promoterId: 'p-003', jobId: 'j-002',
      checkInTime: '2025-07-05T09:10:00Z',
      checkInLocation: { lat: -26.1461, lng: 28.0438, accuracy: 15, timestamp: '2025-07-05T09:10:00Z' },
      checkInSelfie: 'mock://selfie2.jpg',
      checkOutTime: '2025-07-05T17:05:00Z',
      checkOutLocation: { lat: -26.1461, lng: 28.0438, accuracy: 10, timestamp: '2025-07-05T17:05:00Z' },
      checkOutSelfie: 'mock://selfie2_out.jpg',
      totalHours: 7.92,
      issues: [{ id: 'i-1', type: 'late', note: 'Arrived 10 mins late', loggedBy: 'sup-001', loggedAt: '2025-07-05T09:10:00Z' }],
      supervisorRating: 3, status: 'pending_approval',
    },
    grossPay: 800, deductions: 50, netPay: 750, status: 'pending_approval',
  },
  {
    id: 's-003', jobId: 'j-003', promoterId: 'p-003',
    attendance: { shiftId: 's-003', promoterId: 'p-003', jobId: 'j-003', issues: [], status: 'scheduled' },
    status: 'scheduled',
  },
];

// ─── Payments ─────────────────────────────────────────────────────────────────
export const MOCK_PAYMENTS: Payment[] = [
  {
    id: 'pay-001', shiftId: 's-001', promoterId: 'p-003',
    grossAmount: 486, deductions: 0, netAmount: 486,
    status: 'paid',
    approvedBy: 'admin-001', approvedAt: '2025-06-29T10:00:00Z',
    paidAt: '2025-06-30T09:00:00Z',
    reference: 'HGP-20250630-001',
    createdAt: '2025-06-28T22:10:00Z',
  },
  {
    id: 'pay-002', shiftId: 's-002', promoterId: 'p-003',
    grossAmount: 800, deductions: 50, netAmount: 750,
    status: 'pending',
    createdAt: '2025-07-05T17:10:00Z',
  },
];