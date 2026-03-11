// shared/services/usersService.ts
// FUTURE: replace each function body with a real fetch() call.
// The return type must stay identical — zero component changes needed.

import type { UserProfile } from '../types/user.types';
import { MOCK_PROFILES } from './mockData';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export const usersService = {
  async getProfile(userId: string): Promise<UserProfile | null> {
    await delay(300);
    return MOCK_PROFILES.find(p => p.userId === userId) ?? null;
  },

  async updateProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    await delay(500);
    const idx = MOCK_PROFILES.findIndex(p => p.userId === userId);
    if (idx === -1) throw new Error('Profile not found');
    MOCK_PROFILES[idx] = { ...MOCK_PROFILES[idx], ...data, updatedAt: new Date().toISOString() };
    return MOCK_PROFILES[idx];
  },

  async submitOnboarding(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    await delay(800);
    const existing = MOCK_PROFILES.find(p => p.userId === userId);
    const now = new Date().toISOString();
    const updated: UserProfile = {
      ...(existing ?? {} as UserProfile),
      ...data,
      userId,
      onboardingStatus: 'pending_review',
      reliabilityScore: existing?.reliabilityScore ?? 0,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    if (existing) {
      MOCK_PROFILES[MOCK_PROFILES.indexOf(existing)] = updated;
    } else {
      MOCK_PROFILES.push(updated);
    }
    return updated;
  },

  /** Used by Admin to list pending applicants */
  async getPendingApplicants(): Promise<UserProfile[]> {
    await delay(300);
    return MOCK_PROFILES.filter(p => p.onboardingStatus === 'pending_review');
  },

  /** Used by Admin to approve or reject an applicant */
  async reviewApplicant(userId: string, decision: 'approved' | 'rejected', reason?: string): Promise<UserProfile> {
    await delay(500);
    const idx = MOCK_PROFILES.findIndex(p => p.userId === userId);
    if (idx === -1) throw new Error('Profile not found');
    MOCK_PROFILES[idx] = {
      ...MOCK_PROFILES[idx],
      onboardingStatus: decision,
      rejectionReason: reason,
      updatedAt: new Date().toISOString(),
    };
    return MOCK_PROFILES[idx];
  },
};