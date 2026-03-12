// shared/services/paymentsService.ts
// Persists payments in localStorage (hg_payments).

import type { Payment, EarningsSummary } from '../types/payment.types';
import { MOCK_PAYMENTS } from './mockData';

const STORAGE_KEY = 'hg_payments';

function initializePayments(): void {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (!existing) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_PAYMENTS));
    }
  } catch (e) {
    console.warn('Failed to initialize payments', e);
  }
}
initializePayments();

function getPayments(): Payment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePayments(payments: Payment[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payments));
  } catch (e) {
    console.warn('Failed to save payments', e);
  }
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export const paymentsService = {
  async getPaymentsByPromoter(promoterId: string): Promise<Payment[]> {
    await delay(300);
    return getPayments().filter(p => p.promoterId === promoterId);
  },

  async getEarningsSummary(promoterId: string): Promise<EarningsSummary> {
    await delay(200);
    const payments = getPayments().filter(p => p.promoterId === promoterId);
    return {
      totalEarned:     payments.reduce((s, p) => s + p.netAmount, 0),
      totalPending:    payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.netAmount, 0),
      totalPaid:       payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.netAmount, 0),
      shiftsCompleted: payments.filter(p => p.status === 'paid').length,
    };
  },

  async getAllPayments(): Promise<Payment[]> {
    await delay(300);
    return getPayments();
  },

  async approvePayment(paymentId: string, adminId: string): Promise<Payment> {
    await delay(500);
    const payments = getPayments();
    const pay = payments.find(p => p.id === paymentId);
    if (!pay) throw new Error('Payment not found');
    pay.status = 'approved';
    pay.approvedBy = adminId;
    pay.approvedAt = new Date().toISOString();
    savePayments(payments);
    return { ...pay };
  },
};