import { Request, Response } from 'express';
import { prisma } from '../config';
import { AuthRequest } from '../middleware/auth';
import { auditLog } from '../utils/auditLogger';
import { setLiveLocation, clearLiveLocation, getAllLiveLocations } from '../services/redis.service';
import { uploadToS3, mockS3Url } from '../services/s3.service';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
export const selfieUpload = upload.single('selfie');

export const getMyShifts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const shifts = await prisma.shift.findMany({
      where: { promoterId: req.user!.id },
      include: { job: true, payment: true },
      orderBy: { job: { date: 'desc' } },
    });
    res.json(shifts);
  } catch {
    res.status(500).json({ error: 'Failed to fetch shifts' });
  }
};

export const getAllShifts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const shifts = await prisma.shift.findMany({
      include: {
        job: true,
        promoter: { select: { id: true, fullName: true, profilePhotoUrl: true } },
        payment: true,
      },
      orderBy: { checkInTime: 'desc' },
    });
    res.json(shifts);
  } catch {
    res.status(500).json({ error: 'Failed to fetch shifts' });
  }
};

export const checkIn = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { lat, lng } = req.body;
    const file = (req as any).file as Express.Multer.File | undefined;
    const userId = req.user!.id;

    // Mandatory checks
    if (!file) {
      res.status(400).json({ error: 'Selfie is required' });
      return;
    }
    if (!lat || !lng) {
      res.status(400).json({ error: 'Location coordinates are required' });
      return;
    }

    const shift = await prisma.shift.findUnique({
      where: { id: req.params.id },
      include: { job: true },
    });

    if (!shift) {
      res.status(404).json({ error: 'Shift not found' });
      return;
    }
    if (shift.promoterId !== userId) {
      res.status(403).json({ error: 'Not your shift' });
      return;
    }
    if (shift.status !== 'SCHEDULED') {
      res.status(400).json({ error: 'Shift already checked in or completed' });
      return;
    }

    // --- Time window validation (shift must be within job start/end) ---
    const job = shift.job;
    const startDateTime = new Date(job.date);
    const [startHour, startMinute] = job.startTime.split(':').map(Number);
    startDateTime.setHours(startHour, startMinute, 0, 0);

    const endDateTime = new Date(job.date);
    const [endHour, endMinute] = job.endTime.split(':').map(Number);
    endDateTime.setHours(endHour, endMinute, 0, 0);

    // Handle overnight shifts
    if (endDateTime < startDateTime) {
      endDateTime.setDate(endDateTime.getDate() + 1);
    }

    const now = new Date();
    if (now < startDateTime) {
      res.status(400).json({ error: 'Shift has not started yet' });
      return;
    }
    if (now > endDateTime) {
      res.status(400).json({ error: 'Shift has already ended' });
      return;
    }
    // --- End of time window validation ---

    // Upload selfie
    const isDev = process.env.NODE_ENV !== 'production';
    const selfieUrl = isDev
      ? mockS3Url(`shifts/${shift.id}`, `checkin-${Date.now()}.jpg`)
      : await uploadToS3(`shifts/${shift.id}/checkin-${Date.now()}.jpg`, file.buffer, file.mimetype);

    // Atomically update shift
    const updated = await prisma.shift.update({
      where: {
        id: req.params.id,
        status: 'SCHEDULED',
      },
      data: {
        status: 'CHECKED_IN',
        checkInTime: new Date(),
        checkInSelfieUrl: selfieUrl,
      },
    });

    if (!updated) {
      res.status(409).json({ error: 'Shift was already modified' });
      return;
    }

    // Store live location (Redis, non‑critical)
    try {
      const name = `${job.title}  ${job.venue}`;
      await setLiveLocation(userId, parseFloat(lat), parseFloat(lng), name);
    } catch (redisErr) {
      console.warn('[Redis] Failed to store live location:', redisErr);
    }

    await auditLog({ userId, action: 'CHECK_IN', entity: 'Shift', entityId: shift.id });
    res.json(updated);
  } catch (err) {
    console.error('[Shifts] checkIn error:', err);
    res.status(500).json({ error: 'Check-in failed' });
  }
};

export const checkOut = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { lat, lng } = req.body; // Now expecting location for checkout too
    const file = (req as any).file as Express.Multer.File | undefined;
    const userId = req.user!.id;

    // --- Epic 3 mandatory selfie and GPS ---
    if (!file) {
      res.status(400).json({ error: 'Selfie is required' });
      return;
    }
    if (!lat || !lng) {
      res.status(400).json({ error: 'Location coordinates are required for checkout' });
      return;
    }

    const shift = await prisma.shift.findUnique({
      where: { id: req.params.id },
      include: { job: true },
    });

    if (!shift) {
      res.status(404).json({ error: 'Shift not found' });
      return;
    }
    if (shift.promoterId !== userId) {
      res.status(403).json({ error: 'Not your shift' });
      return;
    }
    if (shift.status !== 'CHECKED_IN') {
      res.status(400).json({ error: 'Must be checked in first' });
      return;
    }

    const isDev = process.env.NODE_ENV !== 'production';
    const selfieUrl = isDev
      ? mockS3Url(`shifts/${shift.id}`, `checkout-${Date.now()}.jpg`)
      : await uploadToS3(`shifts/${shift.id}/checkout-${Date.now()}.jpg`, file.buffer, file.mimetype);

    const checkOutTime = new Date();
    const checkInTime = shift.checkInTime!;
    const totalHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

    // Atomically update shift – ensure it's still CHECKED_IN
    const updated = await prisma.shift.update({
      where: {
        id: req.params.id,
        status: 'CHECKED_IN',
      },
      data: {
        status: 'PENDING_APPROVAL',
        checkOutTime,
        totalHours: Math.round(totalHours * 10) / 10,
        checkOutSelfieUrl: selfieUrl,
      },
    });

    if (!updated) {
      res.status(409).json({ error: 'Shift was already modified' });
      return;
    }

    // Remove from live map – Redis failure is not critical for checkout
    try {
      await clearLiveLocation(userId);
    } catch (redisErr) {
      console.warn('[Redis] Failed to clear live location:', redisErr);
    }

    // Auto-create pending payment
    const grossAmount = Math.round(totalHours * shift.job.hourlyRate);
    await prisma.payment.create({
      data: {
        shiftId: shift.id,
        promoterId: userId,
        grossAmount,
        netAmount: grossAmount, // deductions handled on approval
        status: 'PENDING',
      },
    });

    await auditLog({ userId, action: 'CHECK_OUT', entity: 'Shift', entityId: shift.id, meta: { totalHours } });
    res.json(updated);
  } catch (err) {
    console.error('[Shifts] checkOut error:', err);
    res.status(500).json({ error: 'Check-out failed' });
  }
};

export const reportIssue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, note } = req.body;
    const shift = await prisma.shift.findUnique({ where: { id: req.params.id } });
    if (!shift) {
      res.status(404).json({ error: 'Shift not found' });
      return;
    }

    const issues = [...(shift.issues as any[]), { type, note, reportedAt: new Date(), reportedBy: req.user!.id }];
    const updated = await prisma.shift.update({ where: { id: req.params.id }, data: { issues } });

    await auditLog({ userId: req.user!.id, action: 'REPORT_ISSUE', entity: 'Shift', entityId: shift.id, meta: { type } });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to report issue' });
  }
};

export const getLiveLocations = async (_req: Request, res: Response): Promise<void> => {
  try {
    const locations = await getAllLiveLocations();
    res.json(locations);
  } catch {
    res.status(500).json({ error: 'Failed to fetch live locations' });
  }
};

export const approveShift = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { supervisorRating, deductions } = req.body;

    const shift = await prisma.shift.update({
      where: { id: req.params.id },
      data: { status: 'APPROVED', supervisorRating },
    });

    // Update payment deductions
    if (deductions !== undefined) {
      const payment = await prisma.payment.findUnique({ where: { shiftId: shift.id } });
      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            deductions,
            netAmount: payment.grossAmount - deductions,
            status: 'APPROVED',
          },
        });
      }
    }

    await auditLog({ userId: req.user!.id, action: 'APPROVE_SHIFT', entity: 'Shift', entityId: shift.id });
    res.json(shift);
  } catch {
    res.status(500).json({ error: 'Failed to approve shift' });
  }
};