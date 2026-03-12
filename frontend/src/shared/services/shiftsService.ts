// shared/services/shiftsService.ts
// Persists shifts in localStorage (hg_shifts).

import type { Shift } from '../types/shift.types';
import { MOCK_SHIFTS } from './mockData';

const STORAGE_KEY = 'hg_shifts';

function initializeShifts(): void {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (!existing) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_SHIFTS));
    }
  } catch (e) {
    console.warn('Failed to initialize shifts', e);
  }
}
initializeShifts();

function getShifts(): Shift[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveShifts(shifts: Shift[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shifts));
  } catch (e) {
    console.warn('Failed to save shifts', e);
  }
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export const shiftsService = {
  async getShiftsByPromoter(promoterId: string): Promise<Shift[]> {
    await delay(300);
    const all = getShifts();
    return all.filter(s => s.promoterId === promoterId);
  },

  async getAllShifts(): Promise<Shift[]> {
    await delay(300);
    return getShifts();
  },

  async checkIn(
    shiftId: string,
    selfieUrl: string,
    location: { lat: number; lng: number },
  ): Promise<Shift> {
    await delay(600);
    const shifts = getShifts();
    const shift = shifts.find(s => s.id === shiftId);
    if (!shift) throw new Error('Shift not found');
    const now = new Date().toISOString();
    shift.attendance.checkInTime = now;
    shift.attendance.checkInSelfie = selfieUrl;
    shift.attendance.checkInLocation = { ...location, accuracy: 10, timestamp: now };
    shift.attendance.status = 'checked_in';
    shift.status = 'checked_in';
    saveShifts(shifts);
    return { ...shift };
  },

  async checkOut(
    shiftId: string,
    selfieUrl: string,
    location: { lat: number; lng: number },
  ): Promise<Shift> {
    await delay(600);
    const shifts = getShifts();
    const shift = shifts.find(s => s.id === shiftId);
    if (!shift) throw new Error('Shift not found');
    const now = new Date().toISOString();
    shift.attendance.checkOutTime = now;
    shift.attendance.checkOutSelfie = selfieUrl;
    shift.attendance.checkOutLocation = { ...location, accuracy: 10, timestamp: now };
    // Calculate total hours
    if (shift.attendance.checkInTime) {
      const checkIn = new Date(shift.attendance.checkInTime).getTime();
      const checkOut = new Date(now).getTime();
      shift.attendance.totalHours = (checkOut - checkIn) / (1000 * 60 * 60);
    }
    shift.attendance.status = 'checked_out';
    shift.status = 'checked_out';
    saveShifts(shifts);
    return { ...shift };
  },
};