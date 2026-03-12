// shared/services/usersService.ts
// getProfile() accepts userId OR email — works with both auth systems.
// FUTURE: replace each function body with a real fetch() call.

import type { UserProfile } from '../types/user.types';
import { MOCK_PROFILES } from './mockData';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

/** Find a profile by userId OR email (handles both auth systems) */
function findProfile(key: string): UserProfile | undefined {
  return MOCK_PROFILES.find(p => p.userId === key || (p as UserProfile & { email?: string }).email === key);
}

export const usersService = {
  async getProfile(userIdOrEmail: string): Promise<UserProfile | null> {
    await delay(300);
    return findProfile(userIdOrEmail) ?? null;
  },

  async updateProfile(userIdOrEmail: string, data: Partial<UserProfile>): Promise<UserProfile> {
    await delay(500);
    const idx = MOCK_PROFILES.findIndex(p => p.userId === userIdOrEmail || (p as UserProfile & { email?: string }).email === userIdOrEmail);
    if (idx === -1) throw new Error('Profile not found');
    MOCK_PROFILES[idx] = { ...MOCK_PROFILES[idx], ...data, updatedAt: new Date().toISOString() };
    return MOCK_PROFILES[idx];
  },

  async submitOnboarding(userIdOrEmail: string, data: Partial<UserProfile>): Promise<UserProfile> {
    await delay(800);
    const existing = findProfile(userIdOrEmail);
    const now = new Date().toISOString();
    const updated: UserProfile = {
      ...(existing ?? {} as UserProfile),
      ...data,
      userId: existing?.userId ?? userIdOrEmail,
      onboardingStatus: 'pending_review',
      reliabilityScore: existing?.reliabilityScore ?? 0,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    if (existing) {
      MOCK_PROFILES[MOCK_PROFILES.indexOf(existing as typeof MOCK_PROFILES[0])] = updated as typeof MOCK_PROFILES[0];
    } else {
      MOCK_PROFILES.push(updated as typeof MOCK_PROFILES[0]);
    }
    return updated;
  },

  async getPendingApplicants(): Promise<UserProfile[]> {
    await delay(300);
    return MOCK_PROFILES.filter(p => p.onboardingStatus === 'pending_review');
  },

  async reviewApplicant(userId: string, decision: 'approved' | 'rejected', reason?: string): Promise<UserProfile> {
    await delay(500);
    const idx = MOCK_PROFILES.findIndex(p => p.userId === userId);
    if (idx === -1) throw new Error('Profile not found');
    MOCK_PROFILES[idx] = { ...MOCK_PROFILES[idx], onboardingStatus: decision, rejectionReason: reason, updatedAt: new Date().toISOString() };
    return MOCK_PROFILES[idx];
  },
};