// shared/services/authService.ts
// Persists session to localStorage so it survives page reloads.
// FUTURE: replace with real API calls.

import type { User, RegisterPayload } from '../types/auth.types';
import { MOCK_PROFILES } from './mockData';

const SESSION_KEY = 'hg_session';
const USERS_KEY   = 'hg_users';

function getLsUsers(): Record<string, unknown>[] {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
  catch { return []; }
}

export const authService = {

  login: async (email: string, _password: string): Promise<User> => {
    const lower = email.toLowerCase();

    // 1. Check mock demo accounts
    const mockProfile = MOCK_PROFILES.find(
      p => (p as UserProfile & { email?: string }).email?.toLowerCase() === lower
    );
    if (mockProfile) {
      const user: User = {
        id:    mockProfile.userId,
        name:  mockProfile.fullName,
        email: lower,
        role:  'promoter',
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        loggedIn: true,
        userId:   user.id,
        name:     user.name,
        email:    user.email,
        role:     user.role,
        status:   mockProfile.onboardingStatus,
      }));
      return user;
    }

    // 2. Check real registered users in hg_users
    const lsUsers = getLsUsers();
    const lsRec   = lsUsers.find(u => (u.email as string)?.toLowerCase() === lower);
    if (lsRec) {
      const user: User = {
        id:    (lsRec.userId as string) || lower,
        name:  (lsRec.fullName as string) || (lsRec.name as string) || lower,
        email: lower,
        role:  (lsRec.role as User['role']) || 'promoter',
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        loggedIn: true,
        userId:   user.id,
        name:     user.name,
        email:    user.email,
        role:     user.role,
        status:   (lsRec.status as string) || 'pending_review',
      }));
      return user;
    }

    // 3. Unknown user — still let them in (swap for real auth later)
    const user: User = { id: lower, name: lower, email: lower, role: 'promoter' };
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      loggedIn: true, userId: lower, name: lower, email: lower, role: 'promoter', status: 'pending_review',
    }));
    return user;
  },

  register: async (data: RegisterPayload): Promise<User> => {
    const lower = data.email.toLowerCase();
    const now   = new Date().toISOString();

    // Store full registration data in hg_users
    const lsUsers = getLsUsers();
    const existing = lsUsers.findIndex(u => (u.email as string)?.toLowerCase() === lower);
    const record: Record<string, unknown> = {
      ...(existing !== -1 ? lsUsers[existing] : {}),
      email:     lower,
      userId:    lower,
      role:      data.role || 'promoter',
      status:    'pending_review',
      createdAt: existing !== -1 ? lsUsers[existing].createdAt : now,
      updatedAt: now,
      // Spread all registration payload fields flat so usersService can read them
      ...data,
      email: lower, // ensure lowercase
    };
    if (existing !== -1) { lsUsers[existing] = record; }
    else                  { lsUsers.push(record); }
    localStorage.setItem(USERS_KEY, JSON.stringify(lsUsers));

    const user: User = {
      id:    lower,
      name:  data.name || lower,
      email: lower,
      role:  data.role || 'promoter',
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      loggedIn: true,
      userId:   lower,
      name:     user.name,
      email:    lower,
      role:     user.role,
      status:   'pending_review',
    }));
    return user;
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem(SESSION_KEY);
  },
};

// Type shim so the mock lookup above compiles without a separate import
type UserProfile = { userId: string; fullName: string; onboardingStatus: string; email?: string };