/**
 * MOCK DATA STORE
 * ---------------------------------------------------------
 * This file simulates the backend database.
 * When a real API is ready, replace each function body
 * with an actual fetch() / axios call and keep the same
 * return-type signatures so no consumer code changes.
 * ---------------------------------------------------------
 */

import type { UserProfile } from '../types/user.types';
import type { Job } from '../types/job.types';
import type { Shift } from '../types/shift.types';
import type { Payment } from '../types/payment.types';

// ─── Promoter Profiles (visible to Admin for review) ──────────────────────────
export const MOCK_PROFILES: UserProfile[] = [
  {
    id: 'p-001',
    name: 'Amara Dlamini',
    email: 'amara.dlamini@example.com',
    role: 'promoter',
    avatarUrl: 'https://i.pravatar.cc/150?img=47',
    createdAt: '2024-11-01T08:00:00Z',
    gender: 'female',
    physicalAttributes: {
      height: 168,
      clothingSize: 'S',
      shoeSize: '6'
    }
  },
  {
    id: 'p-002',
    name: 'Sipho Nkosi',
    email: 'sipho.nkosi@example.com',
    role: 'promoter',
    avatarUrl: 'https://i.pravatar.cc/150?img=12',
    createdAt: '2024-11-02T09:00:00Z',
    gender: 'male',
    physicalAttributes: {
      height: 182,
      clothingSize: 'L',
      shoeSize: '10'
    }
  },
  {
    id: 'p-003',
    name: 'Lebo Mokoena',
    email: 'lebo.mokoena@example.com',
    role: 'promoter',
    avatarUrl: 'https://i.pravatar.cc/150?img=32',
    createdAt: '2024-10-15T07:00:00Z',
    gender: 'female',
    physicalAttributes: {
      height: 172,
      clothingSize: 'M'
    }
  },
];

// ─── Available Jobs ────────────────────────────────────────────────────────────
export const MOCK_JOBS: Job[] = [
  {
    id: 'j-001',
    title: 'Castle Lite Brand Activator',
    client: 'AB InBev',
    brand: 'Castle Lite',
    venue: 'Sandton City Mall',
    address: '163 Fifth St, Sandhurst, Sandton',
    coordinates: { lat: -26.1076, lng: 28.056 },
    date: '2025-07-12',
    startTime: '18:00',
    endTime: '22:00',
    hourlyRate: 120,
    totalSlots: 4,
    filledSlots: 2,
    filters: { gender: 'female', minHeight: 160 },
    status: 'open',
    distanceKm: 3.2,
    createdBy: 'admin-001',
    createdAt: '2025-07-01T08:00:00Z',
  },
  {
    id: 'j-002',
    title: 'Vodacom Promo Specialist',
    client: 'Vodacom',
    brand: 'Vodacom',
    venue: 'Rosebank Mall',
    address: 'The Zone, Oxford Rd, Rosebank',
    coordinates: { lat: -26.1461, lng: 28.0438 },
    date: '2025-07-15',
    startTime: '09:00',
    endTime: '17:00',
    hourlyRate: 100,
    totalSlots: 6,
    filledSlots: 6,
    filters: { gender: 'any' },
    status: 'filled',
    distanceKm: 7.1,
    createdBy: 'admin-001',
    createdAt: '2025-07-02T08:00:00Z',
  },
  {
    id: 'j-003',
    title: 'Amarula Experiential Hostess',
    client: 'Distell',
    brand: 'Amarula',
    venue: 'Hyde Park Corner',
    address: 'Jan Smuts Ave, Hyde Park',
    coordinates: { lat: -26.1223, lng: 28.0371 },
    date: '2025-07-18',
    startTime: '17:00',
    endTime: '21:00',
    hourlyRate: 130,
    totalSlots: 3,
    filledSlots: 1,
    filters: { gender: 'female', minHeight: 165 },
    status: 'open',
    distanceKm: 5.4,
    createdBy: 'admin-001',
    createdAt: '2025-07-03T08:00:00Z',
  },
  {
    id: 'j-004',
    title: 'MTN Street Team Member',
    client: 'MTN',
    brand: 'MTN',
    venue: 'Eastgate Shopping Centre',
    address: '43 Bradford Rd, Bedfordview',
    coordinates: { lat: -26.1778, lng: 28.1214 },
    date: '2025-07-20',
    startTime: '10:00',
    endTime: '16:00',
    hourlyRate: 95,
    totalSlots: 8,
    filledSlots: 3,
    filters: { gender: 'any' },
    status: 'open',
    distanceKm: 14.8,
    createdBy: 'admin-001',
    createdAt: '2025-07-04T08:00:00Z',
  },
];

// ─── Shifts ────────────────────────────────────────────────────────────────────
export const MOCK_SHIFTS: Shift[] = [
  {
    id: 's-001',
    jobId: 'j-005',
    promoterId: 'p-003',
    attendance: {
      shiftId: 's-001',
      promoterId: 'p-003',
      jobId: 'j-005',
      checkInTime: '2025-06-28T18:02:00Z',
      checkInLocation: { lat: -26.1076, lng: 28.056, accuracy: 12, timestamp: '2025-06-28T18:02:00Z' },
      checkInSelfie: 'mock://selfie1.jpg',
      checkOutTime: '2025-06-28T22:05:00Z',
      checkOutLocation: { lat: -26.1076, lng: 28.056, accuracy: 8, timestamp: '2025-06-28T22:05:00Z' },
      totalHours: 4.05,
      issues: [],
      supervisorRating: 5,
      status: 'approved',
    },
    grossPay: 486,
    deductions: 0,
    netPay: 486,
    status: 'approved',
  },
  {
    id: 's-002',
    jobId: 'j-006',
    promoterId: 'p-003',
    attendance: {
      shiftId: 's-002',
      promoterId: 'p-003',
      jobId: 'j-006',
      checkInTime: '2025-07-05T09:10:00Z',
      checkInLocation: { lat: -26.1461, lng: 28.0438, accuracy: 15, timestamp: '2025-07-05T09:10:00Z' },
      checkInSelfie: 'mock://selfie2.jpg',
      totalHours: 8,
      issues: [{ id: 'i-1', type: 'late', note: 'Arrived 10 mins late', loggedBy: 'sup-001', loggedAt: '2025-07-05T09:10:00Z' }],
      supervisorRating: 3,
      status: 'pending_approval',
    },
    grossPay: 800,
    deductions: 50,
    netPay: 750,
    status: 'pending_approval',
  },
];

// ─── Payments ─────────────────────────────────────────────────────────────────
export const MOCK_PAYMENTS: Payment[] = [
  {
    id: 'pay-001',
    shiftId: 's-001',
    promoterId: 'p-003',
    grossAmount: 486,
    deductions: 0,
    netAmount: 486,
    status: 'paid',
    approvedBy: 'admin-001',
    approvedAt: '2025-06-29T10:00:00Z',
    paidAt: '2025-06-30T09:00:00Z',
    reference: 'HGP-20250630-001',
    createdAt: '2025-06-28T22:10:00Z',
  },
  {
    id: 'pay-002',
    shiftId: 's-002',
    promoterId: 'p-003',
    grossAmount: 800,
    deductions: 50,
    netAmount: 750,
    status: 'pending',
    createdAt: '2025-07-05T17:10:00Z',
  },
];