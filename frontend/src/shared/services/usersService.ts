// shared/services/usersService.ts
// Works with BOTH mock profiles (MOCK_PROFILES) AND real registered users (localStorage 'hg_users').
// FUTURE: replace each function body with a real fetch() call.

import type { UserProfile } from '../types/user.types';
import { MOCK_PROFILES } from './mockData';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
const LS_USERS_KEY = 'hg_users';

// ── localStorage helpers ──────────────────────────────────────────────────────

function getLsUsers(): Record<string, unknown>[] {
  try { return JSON.parse(localStorage.getItem(LS_USERS_KEY) || '[]'); }
  catch { return []; }
}

function saveLsUsers(users: Record<string, unknown>[]): void {
  try { localStorage.setItem(LS_USERS_KEY, JSON.stringify(users)); }
  catch { /* quota/private mode — ignore */ }
}

/** Build a full UserProfile from a raw localStorage registration record */
function lsRecordToProfile(rec: Record<string, unknown>): UserProfile {
  const now = new Date().toISOString();

  // Pull onboarding status: prefer the record's own field, else read from session
  let onboardingStatus: UserProfile['onboardingStatus'] = 'pending_review';
  if (rec.status && typeof rec.status === 'string') {
    onboardingStatus = rec.status as UserProfile['onboardingStatus'];
  } else {
    try {
      const sess = JSON.parse(localStorage.getItem('hg_session') || '{}');
      if (sess.email === rec.email && sess.status) {
        onboardingStatus = sess.status as UserProfile['onboardingStatus'];
      }
    } catch { /* use default */ }
  }

  const firstName = (rec.firstName as string) || '';
  const lastName  = (rec.lastName  as string) || '';

  return {
    userId:      (rec.userId as string) || (rec.email as string) || 'unknown',
    fullName:    (rec.fullName as string) || `${firstName} ${lastName}`.trim() || '',
    idNumber:    (rec.idNumber as string) || '',
    dateOfBirth: (rec.dateOfBirth as string) || '',
    gender:      (rec.gender as UserProfile['gender']) || 'female',
    address:     (rec.address as string) || '',
    city:        (rec.city as string) || '',
    province:    (rec.province as string) || '',
    profilePhoto: (rec.profilePhoto as string) || undefined,
    physicalAttributes: {
      height:       Number(rec.height) || 0,
      clothingSize: (rec.clothingSize as string) || '',
      shoeSize:     (rec.shoeSize as string) || '',
    },
    socialMedia: {
      instagram: (rec.instagram as string) || '',
      tiktok:    (rec.tiktok    as string) || '',
    },
    documents: {
      idFront: (rec.idFront as string) || undefined,
      idBack:  (rec.idBack  as string) || undefined,
      profilePhotos: [],
    },
    bankDetails: rec.bankName ? {
      bankName:      rec.bankName      as string,
      accountNumber: (rec.accountNo   as string) || (rec.accountNumber as string) || '',
      accountType:   (rec.accountType as string) || 'Cheque',
      branchCode:    (rec.branchCode  as string) || '',
    } : undefined,
    reliabilityScore: 0,
    onboardingStatus,
    rejectionReason: rec.rejectionReason as string | undefined,
    createdAt: (rec.createdAt as string) || now,
    updatedAt: now,
  };
}

// ── Finders ───────────────────────────────────────────────────────────────────

function findMock(key: string): UserProfile | undefined {
  return MOCK_PROFILES.find(
    p => p.userId === key || (p as UserProfile & { email?: string }).email === key
  );
}

function findLsRecord(emailOrId: string): Record<string, unknown> | undefined {
  if (!emailOrId) return undefined;
  const lower = emailOrId.toLowerCase();
  return getLsUsers().find(u =>
    (u.email as string)?.toLowerCase() === lower ||
    (u.userId as string) === emailOrId
  );
}

// ── Service ───────────────────────────────────────────────────────────────────

export const usersService = {

  /** Get profile — tries mock first, then localStorage, then builds from session */
  async getProfile(userIdOrEmail: string): Promise<UserProfile | null> {
    await delay(100);

    // 1. Mock demo accounts (Lebo, Thabo, etc.)
    const mock = findMock(userIdOrEmail);
    if (mock) return { ...mock };

    // 2. Real registered users in hg_users
    const lsRec = findLsRecord(userIdOrEmail);
    if (lsRec) return lsRecordToProfile(lsRec);

    // 3. Fallback: build minimal profile from active session
    try {
      const sess = JSON.parse(localStorage.getItem('hg_session') || '{}');
      if (
        sess.loggedIn &&
        (sess.email === userIdOrEmail || sess.userId === userIdOrEmail || sess.name === userIdOrEmail)
      ) {
        const now = new Date().toISOString();
        return {
          userId:             sess.email || userIdOrEmail,
          fullName:           sess.name  || '',
          idNumber:           '',
          dateOfBirth:        '',
          gender:             'female',
          address:            '',
          city:               sess.city      || '',
          province:           sess.province  || '',
          physicalAttributes: { height: 0, clothingSize: '' },
          documents:          { profilePhotos: [] },
          reliabilityScore:   0,
          onboardingStatus:   (sess.status as UserProfile['onboardingStatus']) || 'pending_review',
          createdAt:          now,
          updatedAt:          now,
        };
      }
    } catch { /* ignore */ }

    return null;
  },

  /** Update profile — upserts mock (in-memory) or localStorage record. Never throws "not found". */
  async updateProfile(userIdOrEmail: string, data: Partial<UserProfile>): Promise<UserProfile> {
    await delay(300);

    // 1. Mock profile — update in-memory
    const mockIdx = MOCK_PROFILES.findIndex(
      p => p.userId === userIdOrEmail || (p as UserProfile & { email?: string }).email === userIdOrEmail
    );
    if (mockIdx !== -1) {
      MOCK_PROFILES[mockIdx] = { ...MOCK_PROFILES[mockIdx], ...data, updatedAt: new Date().toISOString() };
      return { ...MOCK_PROFILES[mockIdx] };
    }

    // 2. Real user in hg_users — update or create
    const users  = getLsUsers();
    const lower  = userIdOrEmail.toLowerCase();
    const lsIdx  = users.findIndex(u =>
      (u.email as string)?.toLowerCase() === lower || (u.userId as string) === userIdOrEmail
    );
    const now = new Date().toISOString();

    if (lsIdx !== -1) {
      // Merge all known flat fields
      users[lsIdx] = {
        ...users[lsIdx],
        ...(data.city               != null && { city:          data.city }),
        ...(data.province           != null && { province:      data.province }),
        ...(data.physicalAttributes != null && {
          height:       data.physicalAttributes.height,
          clothingSize: data.physicalAttributes.clothingSize,
          shoeSize:     data.physicalAttributes.shoeSize,
        }),
        ...(data.socialMedia != null && {
          instagram: data.socialMedia.instagram,
          tiktok:    data.socialMedia.tiktok,
        }),
        ...(data.bankDetails != null && {
          bankName:      data.bankDetails.bankName,
          accountNumber: data.bankDetails.accountNumber,
          accountType:   data.bankDetails.accountType,
          branchCode:    data.bankDetails.branchCode,
        }),
        ...(data.rejectionReason != null && { rejectionReason: data.rejectionReason }),
        updatedAt: now,
      };
      saveLsUsers(users);
      return lsRecordToProfile(users[lsIdx]);
    }

    // 3. No existing record — create one
    const newRec: Record<string, unknown> = {
      email:     lower,
      userId:    userIdOrEmail,
      role:      'promoter',
      status:    'pending_review',
      createdAt: now,
      updatedAt: now,
      city:          data.city,
      province:      data.province,
      height:        data.physicalAttributes?.height,
      clothingSize:  data.physicalAttributes?.clothingSize,
      shoeSize:      data.physicalAttributes?.shoeSize,
      instagram:     data.socialMedia?.instagram,
      tiktok:        data.socialMedia?.tiktok,
      bankName:      data.bankDetails?.bankName,
      accountNumber: data.bankDetails?.accountNumber,
      accountType:   data.bankDetails?.accountType,
      branchCode:    data.bankDetails?.branchCode,
    };
    users.push(newRec);
    saveLsUsers(users);
    return lsRecordToProfile(newRec);
  },

  async submitOnboarding(userIdOrEmail: string, data: Partial<UserProfile>): Promise<UserProfile> {
    await delay(500);
    return usersService.updateProfile(userIdOrEmail, { ...data, onboardingStatus: 'pending_review' });
  },

  async getPendingApplicants(): Promise<UserProfile[]> {
    await delay(300);
    const mockPending = MOCK_PROFILES.filter(p => p.onboardingStatus === 'pending_review');
    const lsPending   = getLsUsers()
      .filter(u => u.status === 'pending_review')
      .map(lsRecordToProfile);
    return [...mockPending, ...lsPending];
  },

  async reviewApplicant(userId: string, decision: 'approved' | 'rejected', reason?: string): Promise<UserProfile> {
    await delay(300);

    // Mock
    const mockIdx = MOCK_PROFILES.findIndex(p => p.userId === userId);
    if (mockIdx !== -1) {
      MOCK_PROFILES[mockIdx] = {
        ...MOCK_PROFILES[mockIdx],
        onboardingStatus: decision,
        rejectionReason: reason,
        updatedAt: new Date().toISOString()
      };
      return { ...MOCK_PROFILES[mockIdx] };
    }

    // localStorage
    const users  = getLsUsers();
    const lsIdx  = users.findIndex(u => u.email === userId || u.userId === userId);
    if (lsIdx !== -1) {
      users[lsIdx] = {
        ...users[lsIdx],
        status: decision,
        ...(reason ? { rejectionReason: reason } : {})
      };
      saveLsUsers(users);
      return lsRecordToProfile(users[lsIdx]);
    }

    throw new Error('User not found');
  },
};