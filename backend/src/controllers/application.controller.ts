import { Request, Response } from 'express';
import { prisma } from '../config';
import { AuthRequest } from '../middleware/auth';
import { auditLog } from '../utils/auditLogger';

export const applyToJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { jobId } = req.body;
    const promoterId = req.user!.id;

    const existing = await prisma.application.findUnique({
      where: { jobId_promoterId: { jobId, promoterId } },
    });
    if (existing) {
      res.status(409).json({ error: 'Already applied to this job', application: existing });
      return;
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) { res.status(404).json({ error: 'Job not found' }); return; }
    if (job.status === 'CANCELLED') { res.status(400).json({ error: 'Job is cancelled' }); return; }

    const promoter = await prisma.user.findUnique({
      where: { id: promoterId },
      select: { status: true },
    });
    if (!promoter || promoter.status !== 'approved') {
      res.status(400).json({ error: 'Your account must be approved before applying for jobs' });
      return;
    }

    // Promoter-initiated applications always start as STANDBY
    const application = await prisma.application.create({
      data: { jobId, promoterId, status: 'STANDBY' },
    });

    await auditLog({
      userId: promoterId,
      action: 'APPLY_STANDBY',
      entity: 'Application',
      entityId: application.id,
      meta: { jobId },
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
            id: true,
            fullName: true,
            email: true,
            phone: true,
            city: true,
            province: true,
            gender: true,
            height: true,
            clothingSize: true,
            shoeSize: true,
            profilePhotoUrl: true,
            headshotUrl: true,
            fullBodyPhotoUrl: true,
            cvUrl: true,
            reliabilityScore: true,
            onboardingStatus: true,
            status: true,
            createdAt: true,
            idNumber: true,
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
    const { status } = req.body;

    const app = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: { job: true },
    });
    if (!app) { res.status(404).json({ error: 'Application not found' }); return; }

    const updated = await prisma.application.update({
      where: { id: req.params.id },
      data: { status },
    });

    // When ALLOCATING: create shift so it appears on promoter's dashboard
    if (app.status !== 'ALLOCATED' && status === 'ALLOCATED') {
      const existingShift = await prisma.shift.findFirst({
        where: { jobId: app.jobId, promoterId: app.promoterId },
      });
      if (!existingShift) {
        await prisma.shift.create({
          data: {
            jobId:      app.jobId,
            promoterId: app.promoterId,
            status:     'SCHEDULED',
            issues:     [],
          },
        });
      }

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

    // When DE-ALLOCATING
    if (app.status === 'ALLOCATED' && (status === 'DECLINED' || status === 'STANDBY')) {
      // Remove the shift if it exists and hasn't been checked in yet
      await prisma.shift.deleteMany({
        where: { jobId: app.jobId, promoterId: app.promoterId, status: 'SCHEDULED' },
      });
      await prisma.job.update({
        where: { id: app.jobId },
        data: { filledSlots: { decrement: 1 }, status: 'OPEN' },
      });
    }

    await auditLog({
      userId:   req.user!.id,
      action:   `UPDATE_APPLICATION_${status}`,
      entity:   'Application',
      entityId: app.id,
    });

    res.json(updated);
  } catch (err) {
    console.error('[Applications] updateStatus error:', err);
    res.status(500).json({ error: 'Failed to update application' });
  }
};

// New endpoint: allocate multiple promoters at once (business bulk confirm)
export const bulkAllocate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { jobId, promoterIds } = req.body as { jobId: string; promoterIds: string[] };

    if (!jobId || !promoterIds || !Array.isArray(promoterIds)) {
      res.status(400).json({ error: 'jobId and promoterIds array required' });
      return;
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) { res.status(404).json({ error: 'Job not found' }); return; }

    const results = [];

    for (const promoterId of promoterIds) {
      // Upsert application
      let app = await prisma.application.findUnique({
        where: { jobId_promoterId: { jobId, promoterId } },
      });

      if (!app) {
        app = await prisma.application.create({
          data: { jobId, promoterId, status: 'ALLOCATED' },
        });
      } else if (app.status !== 'ALLOCATED') {
        app = await prisma.application.update({
          where: { id: app.id },
          data: { status: 'ALLOCATED' },
        });
      }

      // Create shift if not exists
      const existingShift = await prisma.shift.findFirst({
        where: { jobId, promoterId },
      });
      if (!existingShift) {
        await prisma.shift.create({
          data: { jobId, promoterId, status: 'SCHEDULED', issues: [] },
        });
      }

      results.push(app);
    }

    // Update job filled slots
    const allocatedCount = await prisma.application.count({
      where: { jobId, status: 'ALLOCATED' },
    });
    await prisma.job.update({
      where: { id: jobId },
      data: {
        filledSlots: allocatedCount,
        ...(allocatedCount >= job.totalSlots && { status: 'FILLED' }),
      },
    });

    await auditLog({
      userId:   req.user!.id,
      action:   'BULK_ALLOCATE',
      entity:   'Job',
      entityId: jobId,
      meta:     { promoterIds, count: promoterIds.length },
    });

    res.json({ message: `${results.length} promoters allocated`, applications: results });
  } catch (err) {
    console.error('[Applications] bulkAllocate error:', err);
    res.status(500).json({ error: 'Bulk allocation failed' });
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