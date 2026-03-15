import { Request, Response } from 'express';
import { prisma } from '../config';
import { AuthRequest } from '../middleware/auth';
import { auditLog } from '../utils/auditLogger';


export const applyToJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { jobId } = req.body;
    const promoterId = req.user!.id;

    // Prevent duplicate applications
    const existing = await prisma.application.findUnique({
      where: { jobId_promoterId: { jobId, promoterId } },
    });
    if (existing) {
      res.status(409).json({ error: 'Already applied to this job', application: existing });
      return;
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) { res.status(404).json({ error: 'Job not found' }); return; }
    if (job.status !== 'OPEN') { res.status(400).json({ error: 'Job is no longer open' }); return; }

    // Auto-allocate if slots available, otherwise standby
    const status = job.filledSlots < job.totalSlots ? 'ALLOCATED' : 'STANDBY';

    const application = await prisma.application.create({
      data: { jobId, promoterId, status },
    });

    if (status === 'ALLOCATED') {
      await prisma.job.update({
        where: { id: jobId },
        data: {
          filledSlots: { increment: 1 },
          ...(job.filledSlots + 1 >= job.totalSlots && { status: 'FILLED' }),
        },
      });
    }

    await auditLog({
      userId: promoterId,
      action: `APPLY_${status}`,
      entity: 'Application',
      entityId: application.id,
      meta: { jobId, status },
    });

    res.status(201).json(application);
  } catch (err) {
    console.error('[Applications] apply error:', err);
    res.status(500).json({ error: 'Application failed' });
  }
};


export const getApplicationsForJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const applications = await prisma.application.findMany({
      where: { jobId: req.params.jobId },
      include: {
        promoter: {
          select: {
            id: true, fullName: true, email: true, phone: true,
            profilePhotoUrl: true, reliabilityScore: true, city: true,
          },
        },
      },
      orderBy: { appliedAt: 'asc' },
    });
    res.json(applications);
  } catch {
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
};


export const updateApplicationStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body; // ALLOCATED | DECLINED | STANDBY

    const app = await prisma.application.findUnique({ where: { id: req.params.id } });
    if (!app) { res.status(404).json({ error: 'Application not found' }); return; }

    const updated = await prisma.application.update({
      where: { id: req.params.id },
      data: { status },
    });

    // Adjust filledSlots on job
    if (app.status === 'ALLOCATED' && status === 'DECLINED') {
      await prisma.job.update({ where: { id: app.jobId }, data: { filledSlots: { decrement: 1 }, status: 'OPEN' } });
    }
    if (app.status !== 'ALLOCATED' && status === 'ALLOCATED') {
      const job = await prisma.job.findUnique({ where: { id: app.jobId } });
      if (job) {
        await prisma.job.update({
          where: { id: app.jobId },
          data: {
            filledSlots: { increment: 1 },
            ...(job.filledSlots + 1 >= job.totalSlots && { status: 'FILLED' }),
          },
        });
      }
    }

    await auditLog({
      userId: req.user!.id,
      action: `UPDATE_APPLICATION_${status}`,
      entity: 'Application',
      entityId: app.id,
    });

    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update application' });
  }
};


export const getMyApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const applications = await prisma.application.findMany({
      where: { promoterId: req.user!.id },
      include: { job: true },
      orderBy: { appliedAt: 'desc' },
    });
    res.json(applications);
  } catch {
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
};
