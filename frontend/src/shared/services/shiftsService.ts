// shared/services/shiftsService.ts
// FUTURE: replace each function body with a real fetch() call.

import type { Shift } from '../types/shift.types';
import { MOCK_SHIFTS } from './mockData';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export const shiftsService = {
  async getShiftsByPromoter(promoterId: string): Promise<Shift[]> {
    await delay(300);
    return MOCK_SHIFTS.filter(s => s.promoterId === promoterId);
  },

  async getAllShifts(): Promise<Shift[]> {
    await delay(300);
    return [...MOCK_SHIFTS];
  },

  async checkIn(
    shiftId: string,
    selfieUrl: string,
    location: { lat: number; lng: number },
  ): Promise<Shift> {
    await delay(600);
    const shift = MOCK_SHIFTS.find(s => s.id === shiftId);
    if (!shift) throw new Error('Shift not found');
    const now = new Date().toISOString();
    shift.attendance.checkInTime = now;
    shift.attendance.checkInSelfie = selfieUrl;
    shift.attendance.checkInLocation = { ...location, accuracy: 10, timestamp: now };
    shift.attendance.status = 'checked_in';
    shift.status = 'checked_in';
    return { ...shift };
  },

  async checkOut(
    shiftId: string,
    selfieUrl: string,
    location: { lat: number; lng: number },
  ): Promise<Shift> {
    await delay(600);
    const shift = MOCK_SHIFTS.find(s => s.id === shiftId);
    if (!shift) throw new Error('Shift not found');
    const now = new Date().toISOString();
    shift.attendance.checkOutTime = now;
    shift.attendance.checkOutSelfie = selfieUrl;
    shift.attendance.checkOutLocation = { ...location, accuracy: 10, timestamp: now };
    shift.attendance.status = 'checked_out';
    shift.status = 'checked_out';
    return { ...shift };
  },
};