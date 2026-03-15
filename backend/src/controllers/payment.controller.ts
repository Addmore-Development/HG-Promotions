import { Request, Response } from 'express';
import { prisma } from '../config';
import { AuthRequest } from '../middleware/auth';
import { auditLog } from '../utils/auditLogger';


export const getMyPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const payments = await prisma.payment.findMany({
      where: { promoterId: req.user!.id },
      include: {
        shift: { include: { job: { select: { title: true, client: true, date: true } } } },
      },
      orderBy: { shift: { checkOutTime: 'desc' } },
    });
    res.json(payments);
  } catch {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};


export const getAllPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const payments = await prisma.payment.findMany({
      where: { ...(status && { status: status as any }) },
      include: {
        promoter: { select: { id: true, fullName: true, bankName: true, accountNumber: true, branchCode: true } },
        shift: { include: { job: { select: { title: true, client: true, date: true } } } },
      },
      orderBy: { shift: { checkOutTime: 'desc' } },
    });
    res.json(payments);
  } catch {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};


export const approvePayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { deductions } = req.body;
    const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
    if (!payment) { res.status(404).json({ error: 'Payment not found' }); return; }

    const netAmount = payment.grossAmount - (deductions ?? payment.deductions);

    const updated = await prisma.payment.update({
      where: { id: req.params.id },
      data: {
        status: 'APPROVED',
        deductions: deductions ?? payment.deductions,
        netAmount,
        approvedBy: req.user!.id,
      },
    });

    await auditLog({
      userId: req.user!.id,
      action: 'APPROVE_PAYMENT',
      entity: 'Payment',
      entityId: payment.id,
      meta: { netAmount, deductions },
    });

    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to approve payment' });
  }
};


export const batchPay = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { paymentIds } = req.body as { paymentIds: string[] };

    const result = await prisma.payment.updateMany({
      where: { id: { in: paymentIds }, status: 'APPROVED' },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        reference: `BATCH-${Date.now()}`,
      },
    });

    await auditLog({
      userId: req.user!.id,
      action: 'BATCH_PAY',
      entity: 'Payment',
      meta: { count: result.count, paymentIds },
    });

    res.json({ message: `${result.count} payments marked as paid` });
  } catch {
    res.status(500).json({ error: 'Batch pay failed' });
  }
};


export const getPaymentSummary = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [pending, approved, paid] = await Promise.all([
      prisma.payment.aggregate({ where: { status: 'PENDING' }, _sum: { netAmount: true }, _count: true }),
      prisma.payment.aggregate({ where: { status: 'APPROVED' }, _sum: { netAmount: true }, _count: true }),
      prisma.payment.aggregate({ where: { status: 'PAID' }, _sum: { netAmount: true }, _count: true }),
    ]);

    res.json({
      pending: { count: pending._count, total: pending._sum.netAmount ?? 0 },
      approved: { count: approved._count, total: approved._sum.netAmount ?? 0 },
      paid: { count: paid._count, total: paid._sum.netAmount ?? 0 },
    });
  } catch {
    res.status(500).json({ error: 'Failed to get payment summary' });
  }
};
