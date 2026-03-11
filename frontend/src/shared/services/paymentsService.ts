// shared/services/paymentsService.ts
// FUTURE: replace each function body with a real fetch() call.

import type { Payment, EarningsSummary } from '../types/payment.types';
import { MOCK_PAYMENTS } from './mockData';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export const paymentsService = {
  async getPaymentsByPromoter(promoterId: string): Promise<Payment[]> {
    await delay(300);
    return MOCK_PAYMENTS.filter(p => p.promoterId === promoterId);
  },

  async getEarningsSummary(promoterId: string): Promise<EarningsSummary> {
    await delay(200);
    const payments = MOCK_PAYMENTS.filter(p => p.promoterId === promoterId);
    return {
      totalEarned:     payments.reduce((s, p) => s + p.netAmount, 0),
      totalPending:    payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.netAmount, 0),
      totalPaid:       payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.netAmount, 0),
      shiftsCompleted: payments.filter(p => p.status === 'paid').length,
    };
  },

  async getAllPayments(): Promise<Payment[]> {
    await delay(300);
    return [...MOCK_PAYMENTS];
  },

  async approvePayment(paymentId: string, adminId: string): Promise<Payment> {
    await delay(500);
    const pay = MOCK_PAYMENTS.find(p => p.id === paymentId);
    if (!pay) throw new Error('Payment not found');
    pay.status = 'approved';
    pay.approvedBy = adminId;
    pay.approvedAt = new Date().toISOString();
    return { ...pay };
  },
};