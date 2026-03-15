import { Request, Response } from 'express';
import { prisma } from '../config';
import { AuthRequest } from '../middleware/auth';
import { auditLog } from '../utils/auditLogger';


export const getAllJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, city, date } = req.query;
    const jobs = await prisma.job.findMany({
      where: {
        ...(status ? { status: status as any } : { status: 'OPEN' }),
        ...(city && { address: { contains: city as string, mode: 'insensitive' } }),
        ...(date && { date: { gte: new Date(date as string) } }),
      },
      include: {
        applications: { select: { id: true, status: true, promoterId: true } },
        _count: { select: { shifts: true } },
      },
      orderBy: { date: 'asc' },
    });
    res.json(jobs);
  } catch {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
};


export const getJobById = async (req: Request, res: Response): Promise<void> => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
      include: {
        applications: {
          include: {
            promoter: { select: { id: true, fullName: true, profilePhotoUrl: true, reliabilityScore: true } },
          },
        },
        shifts: { include: { promoter: { select: { id: true, fullName: true } } } },
      },
    });
    if (!job) { res.status(404).json({ error: 'Job not found' }); return; }
    res.json(job);
  } catch {
    res.status(500).json({ error: 'Failed to fetch job' });
  }
};


export const createJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const job = await prisma.job.create({
      data: {
        ...req.body,
        createdBy: req.user!.id,
        date: new Date(req.body.date),
        status: 'OPEN',
        filledSlots: 0,
      },
    });

    await auditLog({ userId: req.user!.id, action: 'CREATE_JOB', entity: 'Job', entityId: job.id });
    res.status(201).json(job);
  } catch (err) {
    console.error('[Jobs] create error:', err);
    res.status(500).json({ error: 'Failed to create job' });
  }
};


export const updateJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const job = await prisma.job.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        ...(req.body.date && { date: new Date(req.body.date) }),
      },
    });
    await auditLog({ userId: req.user!.id, action: 'UPDATE_JOB', entity: 'Job', entityId: job.id });
    res.json(job);
  } catch {
    res.status(500).json({ error: 'Failed to update job' });
  }
};


export const deleteJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.job.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } });
    await auditLog({ userId: req.user!.id, action: 'CANCEL_JOB', entity: 'Job', entityId: req.params.id });
    res.json({ message: 'Job cancelled' });
  } catch {
    res.status(500).json({ error: 'Failed to cancel job' });
  }
};


export const getMyJobs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const applications = await prisma.application.findMany({
      where: { promoterId: req.user!.id },
      include: { job: true },
      orderBy: { appliedAt: 'desc' },
    });
    res.json(applications);
  } catch {
    res.status(500).json({ error: 'Failed to fetch your jobs' });
  }
};
