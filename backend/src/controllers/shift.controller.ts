import { Request, Response } from 'express';
import { prisma } from '../config';
import { AuthRequest } from '../middleware/auth';
import { auditLog } from '../utils/auditLogger';
import { setLiveLocation, clearLiveLocation, getAllLiveLocations } from '../services/redis.service';
import { uploadToS3, mockS3Url } from '../services/s3.service';
import multer from 'multer';
import * as fs from 'fs';
import * as path from 'path';

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 },
});

export const selfieUpload = upload.single('selfie');

// ── Helpers ───────────────────────────────────────────────────────────────────
const isDev = process.env.NODE_ENV !== 'production';

async function saveSelfie(
  buffer:      Buffer,
  mimetype:    string,
  originalname: string,
  shiftId:     string,
  prefix:      string
): Promise<string | undefined> {
  try {
    if (isDev) {
      const uploadDir = path.join(process.cwd(), 'uploads', 'shifts', shiftId);
      fs.mkdirSync(uploadDir, { recursive: true });
      const filename = `${prefix}-${Date.now()}${path.extname(originalname) || '.jpg'}`;
      fs.writeFileSync(path.join(uploadDir, filename), buffer);
      return `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/shifts/${shiftId}/${filename}`;
    } else {
      return await uploadToS3(
        `shifts/${shiftId}/${prefix}-${Date.now()}.jpg`,
        buffer,
        mimetype
      );
    }
  } catch (err) {
    console.error(`[Shift] ${prefix} selfie upload failed (non-fatal):`, err);
    return undefined;
  }
}

// ── Get my shifts ─────────────────────────────────────────────────────────────
export const getMyShifts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const shifts = await prisma.shift.findMany({
      where: { promoterId: req.user!.id },
      include: {
        job: {
          select: {
            id:         true,
            title:      true,
            client:     true,
            venue:      true,
            address:    true,
            date:       true,
            startTime:  true,
            endTime:    true,
            hourlyRate: true,
            totalSlots: true,
            filledSlots: true,
            status:     true,
            lat:        true,
            lng:        true,
          },
        },
        payment: true,
      },
      orderBy: { checkInTime: 'desc' },
    });
    res.json(shifts);
  } catch (err) {
    console.error('[Shifts] getMyShifts error:', err);
    res.status(500).json({ error: 'Failed to fetch shifts' });
  }
};

// ── Get all shifts (admin) ────────────────────────────────────────────────────
export const getAllShifts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const shifts = await prisma.shift.findMany({
      include: {
        job:     true,
        promoter: {
          select: { id: true, fullName: true, profilePhotoUrl: true, headshotUrl: true, city: true },
        },
        payment: true,
      },
      orderBy: { checkInTime: 'desc' },
    });
    res.json(shifts);
  } catch (err) {
    console.error('[Shifts] getAllShifts error:', err);
    res.status(500).json({ error: 'Failed to fetch shifts' });
  }
};

// ── Check In ──────────────────────────────────────────────────────────────────
export const checkIn = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { lat, lng } = req.body;
    const file   = (req as any).file as Express.Multer.File | undefined;
    const userId = req.user!.id;

    console.log('[CheckIn] shiftId:', req.params.id, 'userId:', userId);

    const shift = await prisma.shift.findUnique({
      where:   { id: req.params.id },
      include: { job: true },
    });

    if (!shift) { res.status(404).json({ error: 'Shift not found' }); return; }
    if (shift.promoterId !== userId) { res.status(403).json({ error: 'Not your shift' }); return; }
    if (shift.status === 'CHECKED_IN') { res.status(400).json({ error: 'Already checked in to this shift' }); return; }
    if (['PENDING_APPROVAL', 'APPROVED'].includes(shift.status)) { res.status(400).json({ error: 'Shift is already completed' }); return; }

    const selfieUrl = file
      ? await saveSelfie(file.buffer, file.mimetype, file.originalname, shift.id, 'checkin')
      : undefined;

    const updated = await prisma.shift.update({
      where: { id: req.params.id },
      data: {
        status:      'CHECKED_IN',
        checkInTime: new Date(),
        ...(selfieUrl && { checkInSelfieUrl: selfieUrl }),
      },
      include: { job: true },
    });

    // Store live location — setLiveLocation(userId, lat, lng, meta)
    if (lat && lng) {
      try {
        const promoter = await prisma.user.findUnique({
          where:  { id: userId },
          select: { fullName: true },
        });
        const meta: Record<string, any> = {
          shiftId:      shift.id,
          jobId:        shift.jobId,
          jobTitle:     shift.job.title,
          venue:        shift.job.venue,
          promoterName: promoter?.fullName ?? 'Unknown',
          checkInTime:  new Date().toISOString(),
          hourlyRate:   shift.job.hourlyRate,
        };
        await setLiveLocation(userId, parseFloat(lat), parseFloat(lng), meta);
      } catch (redisErr) {
        console.error('[CheckIn] Redis failed (non-fatal):', redisErr);
      }
    }

    await auditLog({ userId, action: 'CHECK_IN', entity: 'Shift', entityId: shift.id, meta: { lat, lng } });
    console.log('[CheckIn] Success for shift:', shift.id);
    res.json(updated);
  } catch (err) {
    console.error('[Shifts] checkIn error:', err);
    res.status(500).json({ error: 'Check-in failed' });
  }
};

// ── Check Out ─────────────────────────────────────────────────────────────────
export const checkOut = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { lat, lng } = req.body;
    const file   = (req as any).file as Express.Multer.File | undefined;
    const userId = req.user!.id;

    console.log('[CheckOut] shiftId:', req.params.id, 'userId:', userId);

    const shift = await prisma.shift.findUnique({
      where:   { id: req.params.id },
      include: { job: true },
    });

    if (!shift) { res.status(404).json({ error: 'Shift not found' }); return; }
    if (shift.promoterId !== userId) { res.status(403).json({ error: 'Not your shift' }); return; }
    if (shift.status !== 'CHECKED_IN') { res.status(400).json({ error: 'Must be checked in before checking out' }); return; }

    // Fix: checkInTime could be null — guard before passing to new Date()
    if (!shift.checkInTime) {
      res.status(400).json({ error: 'No check-in time recorded for this shift' });
      return;
    }

    const selfieUrl = file
      ? await saveSelfie(file.buffer, file.mimetype, file.originalname, shift.id, 'checkout')
      : undefined;

    const checkOutTime  = new Date();
    // shift.checkInTime is now guaranteed non-null
    const checkInDate   = new Date(shift.checkInTime);
    const totalHours    = (checkOutTime.getTime() - checkInDate.getTime()) / (1000 * 60 * 60);
    const roundedHours  = Math.round(totalHours * 100) / 100;

    const updated = await prisma.shift.update({
      where: { id: req.params.id },
      data: {
        status:       'PENDING_APPROVAL',
        checkOutTime,
        totalHours:   roundedHours,
        ...(selfieUrl && { checkOutSelfieUrl: selfieUrl }),
      },
      include: { job: true },
    });

    // Remove from live map
    try {
      await clearLiveLocation(userId);
    } catch (redisErr) {
      console.error('[CheckOut] Redis clear failed (non-fatal):', redisErr);
    }

    // Create pending payment record
    const grossAmount = Math.round(roundedHours * shift.job.hourlyRate);
    try {
      const existingPayment = await prisma.payment.findUnique({ where: { shiftId: shift.id } });
      if (!existingPayment) {
        await prisma.payment.create({
          data: {
            shiftId:    shift.id,
            promoterId: userId,
            grossAmount,
            netAmount:  grossAmount,
            status:     'PENDING',
          },
        });
      }
    } catch (payErr) {
      console.error('[CheckOut] Payment creation failed (non-fatal):', payErr);
    }

    await auditLog({ userId, action: 'CHECK_OUT', entity: 'Shift', entityId: shift.id, meta: { totalHours: roundedHours, grossAmount } });
    console.log('[CheckOut] Success for shift:', shift.id, 'hours:', roundedHours);
    res.json(updated);
  } catch (err) {
    console.error('[Shifts] checkOut error:', err);
    res.status(500).json({ error: 'Check-out failed' });
  }
};

// ── Update live location (called every 30s by promoter device) ────────────────
export const updateLiveLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { lat, lng, shiftId } = req.body;
    const userId = req.user!.id;

    if (!lat || !lng) { res.status(400).json({ error: 'lat and lng are required' }); return; }

    const shift = await prisma.shift.findFirst({
      where: {
        promoterId: userId,
        status:     'CHECKED_IN',
        ...(shiftId && { id: shiftId }),
      },
      include: {
        job: { select: { title: true, venue: true, hourlyRate: true } },
      },
    });

    if (!shift) { res.status(400).json({ error: 'No active shift found' }); return; }

    const promoter = await prisma.user.findUnique({
      where:  { id: userId },
      select: { fullName: true, headshotUrl: true, profilePhotoUrl: true },
    });

    // checkInTime is non-null on a CHECKED_IN shift — but guard anyway
    const hoursWorked = shift.checkInTime
      ? (Date.now() - new Date(shift.checkInTime).getTime()) / (1000 * 60 * 60)
      : 0;
    const currentEarnings = Math.round(hoursWorked * shift.job.hourlyRate);

    const meta: Record<string, any> = {
      shiftId:         shift.id,
      jobId:           shift.jobId,
      jobTitle:        shift.job.title,
      venue:           shift.job.venue,
      promoterName:    promoter?.fullName ?? 'Unknown',
      promoterPhoto:   promoter?.headshotUrl ?? promoter?.profilePhotoUrl,
      checkInTime:     shift.checkInTime?.toISOString(),
      hourlyRate:      shift.job.hourlyRate,
      hoursWorked:     Math.round(hoursWorked * 100) / 100,
      currentEarnings,
    };

    await setLiveLocation(userId, parseFloat(lat), parseFloat(lng), meta);

    res.json({
      message:         'Location updated',
      hoursWorked:     Math.round(hoursWorked * 100) / 100,
      currentEarnings,
    });
  } catch (err) {
    console.error('[Shifts] updateLiveLocation error:', err);
    res.status(500).json({ error: 'Failed to update location' });
  }
};

// ── Report issue ──────────────────────────────────────────────────────────────
export const reportIssue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, note } = req.body;
    const shift = await prisma.shift.findUnique({ where: { id: req.params.id } });
    if (!shift) { res.status(404).json({ error: 'Shift not found' }); return; }

    const issues = [
      ...(shift.issues as any[]),
      { type, note, reportedAt: new Date(), reportedBy: req.user!.id },
    ];
    const updated = await prisma.shift.update({ where: { id: req.params.id }, data: { issues } });
    await auditLog({ userId: req.user!.id, action: 'REPORT_ISSUE', entity: 'Shift', entityId: shift.id, meta: { type } });
    res.json(updated);
  } catch (err) {
    console.error('[Shifts] reportIssue error:', err);
    res.status(500).json({ error: 'Failed to report issue' });
  }
};

// ── Get live locations (admin + business) ─────────────────────────────────────
export const getLiveLocations = async (_req: Request, res: Response): Promise<void> => {
  try {
    const locations = await getAllLiveLocations();
    res.json(locations);
  } catch (err) {
    console.error('[Shifts] getLiveLocations error:', err);
    res.status(500).json({ error: 'Failed to fetch live locations' });
  }
};

// ── Approve shift (admin) ─────────────────────────────────────────────────────
export const approveShift = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { supervisorRating, deductions } = req.body;

    const shift = await prisma.shift.update({
      where: { id: req.params.id },
      data: {
        status: 'APPROVED',
        ...(supervisorRating !== undefined && { supervisorRating }),
      },
    });

    if (deductions !== undefined) {
      const payment = await prisma.payment.findUnique({ where: { shiftId: shift.id } });
      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { deductions, netAmount: payment.grossAmount - deductions, status: 'APPROVED' },
        });
      }
    }

    await auditLog({ userId: req.user!.id, action: 'APPROVE_SHIFT', entity: 'Shift', entityId: shift.id });
    res.json(shift);
  } catch (err) {
    console.error('[Shifts] approveShift error:', err);
    res.status(500).json({ error: 'Failed to approve shift' });
  }
};