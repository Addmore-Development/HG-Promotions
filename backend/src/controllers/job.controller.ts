import { Request, Response } from 'express';
import { prisma } from '../config';
import { AuthRequest } from '../middleware/auth';
import { auditLog } from '../utils/auditLogger';

export const getAllJobs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const userRole = req.user?.role;
    const userId   = req.user?.id;

    let where: any = {};

    if (status && status !== 'all') {
      where.status = (status as string).toUpperCase();
    }

    // Business users see all jobs posted under their company name
    // Admin sees ALL jobs regardless
    if (userRole === 'BUSINESS') {
      // Get the business user's fullName (company name)
      const bizUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { fullName: true },
      });
      if (bizUser?.fullName) {
        // Match jobs where client name contains the business name (case-insensitive)
        where.OR = [
          { client: { contains: bizUser.fullName, mode: 'insensitive' } },
          { brand:  { contains: bizUser.fullName, mode: 'insensitive' } },
        ];
      }
    }

    const jobs = await prisma.job.findMany({
      where,
      include: { applications: { include: { promoter: { select: { id: true, fullName: true, profilePhotoUrl: true } } } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json(jobs);
  } catch (err) {
    console.error('[Job] getAllJobs error:', err);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
};

export const getJobById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
      include: { applications: { include: { promoter: true } } },
    });
    if (!job) { res.status(404).json({ error: 'Job not found' }); return; }
    res.json(job);
  } catch {
    res.status(500).json({ error: 'Failed to fetch job' });
  }
};

export const getMyJobs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jobs = await prisma.job.findMany({
      where: { createdBy: req.user!.id },
      include: { applications: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(jobs);
  } catch {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
};

export const createJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      title, client, brand, venue, address, lat, lng,
      date, startTime, endTime, hourlyRate, totalSlots,
      filledSlots, status, filters,
    } = req.body;

    if (!title || !client || !date) {
      res.status(400).json({ error: 'title, client and date are required' });
      return;
    }

    const job = await prisma.job.create({
      data: {
        title,
        client:     client,
        brand:      brand || client,
        venue:      venue  || '',
        address:    address || venue || '',
        lat:        parseFloat(lat)  || -26.2041,
        lng:        parseFloat(lng)  || 28.0473,
        date:       new Date(date),
        startTime:  startTime || '09:00',
        endTime:    endTime   || '17:00',
        hourlyRate: parseInt(hourlyRate) || 0,
        totalSlots: parseInt(totalSlots) || 1,
        filledSlots: parseInt(filledSlots) || 0,
        status:     (status || 'OPEN').toUpperCase() as any,
        filters:    filters || {},
        createdBy:  req.user!.id,
      },
    });

    await auditLog({ userId: req.user!.id, action: 'CREATE_JOB', entity: 'Job', entityId: job.id });
    res.status(201).json(job);
  } catch (err) {
    console.error('[Job] createJob error:', err);
    res.status(500).json({ error: 'Failed to create job' });
  }
};

export const updateJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      title, client, brand, venue, address, lat, lng,
      date, startTime, endTime, hourlyRate, totalSlots,
      filledSlots, status, filters,
    } = req.body;

    const existing = await prisma.job.findUnique({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Job not found' }); return; }

    const job = await prisma.job.update({
      where: { id: req.params.id },
      data: {
        ...(title      !== undefined && { title }),
        ...(client     !== undefined && { client }),
        ...(brand      !== undefined && { brand }),
        ...(venue      !== undefined && { venue }),
        ...(address    !== undefined && { address }),
        ...(lat        !== undefined && { lat: parseFloat(lat) }),
        ...(lng        !== undefined && { lng: parseFloat(lng) }),
        ...(date       !== undefined && { date: new Date(date) }),
        ...(startTime  !== undefined && { startTime }),
        ...(endTime    !== undefined && { endTime }),
        ...(hourlyRate !== undefined && { hourlyRate: parseInt(hourlyRate) }),
        ...(totalSlots !== undefined && { totalSlots: parseInt(totalSlots) }),
        ...(filledSlots!== undefined && { filledSlots: parseInt(filledSlots) }),
        ...(status     !== undefined && { status: status.toUpperCase() as any }),
        ...(filters    !== undefined && { filters }),
      },
    });

    await auditLog({ userId: req.user!.id, action: 'UPDATE_JOB', entity: 'Job', entityId: job.id });
    res.json(job);
  } catch (err) {
    console.error('[Job] updateJob error:', err);
    res.status(500).json({ error: 'Failed to update job' });
  }
};

export const deleteJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await prisma.job.findUnique({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Job not found' }); return; }

    await prisma.job.delete({ where: { id: req.params.id } });
    await auditLog({ userId: req.user!.id, action: 'DELETE_JOB', entity: 'Job', entityId: req.params.id });
    res.json({ message: 'Job deleted' });
  } catch (err) {
    console.error('[Job] deleteJob error:', err);
    res.status(500).json({ error: 'Failed to delete job' });
  }
};