/**
 * usersService.ts
 * Swap mock implementations for real fetch() calls when API is ready.
 */
import type { UserProfile } from '../types/user.types';
import { MOCK_PROFILES } from './mockData';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const usersService = {
  async getProfile(userId: string): Promise<UserProfile | null> {
    await delay(300);
    // Future: GET /api/users/:userId/profile
    return MOCK_PROFILES.find(p => p.userId === userId) ?? null;
  },

  async updateProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    await delay(600);
    // Future: PATCH /api/users/:userId/profile
    const idx = MOCK_PROFILES.findIndex(p => p.userId === userId);
    if (idx === -1) throw new Error('Profile not found');
    MOCK_PROFILES[idx] = { ...MOCK_PROFILES[idx], ...data, updatedAt: new Date().toISOString() };
    return MOCK_PROFILES[idx];
  },

  async submitOnboarding(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    await delay(800);
    // Future: POST /api/users/:userId/onboarding
    const idx = MOCK_PROFILES.findIndex(p => p.userId === userId);
    const updated: UserProfile = {
      ...(idx !== -1 ? MOCK_PROFILES[idx] : ({} as UserProfile)),
      ...data,
      userId,
      onboardingStatus: 'pending_review',
      updatedAt: new Date().toISOString(),
      createdAt: idx !== -1 ? MOCK_PROFILES[idx].createdAt : new Date().toISOString(),
    };
    if (idx !== -1) MOCK_PROFILES[idx] = updated;
    else MOCK_PROFILES.push(updated);
    return updated;
  },

  // Admin use: get all pending applicants
  async getPendingApplicants(): Promise<UserProfile[]> {
    await delay(400);
    // Future: GET /api/admin/applicants?status=pending_review
    return MOCK_PROFILES.filter(p => p.onboardingStatus === 'pending_review');
  },

  async reviewApplicant(userId: string, decision: 'approved' | 'rejected', reason?: string): Promise<UserProfile> {
    await delay(500);
    // Future: POST /api/admin/applicants/:userId/review
    const idx = MOCK_PROFILES.findIndex(p => p.userId === userId);
    if (idx === -1) throw new Error('User not found');
    MOCK_PROFILES[idx].onboardingStatus = decision;
    if (reason) MOCK_PROFILES[idx].rejectionReason = reason;
    MOCK_PROFILES[idx].updatedAt = new Date().toISOString();
    return MOCK_PROFILES[idx];
  },
};