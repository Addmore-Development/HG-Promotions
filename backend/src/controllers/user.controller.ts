import { Request, Response } from 'express';
import { prisma } from '../config';
import { AuthRequest } from '../middleware/auth';
import { auditLog } from '../utils/auditLogger';
import { uploadToS3 } from '../services/s3.service';
import * as fs from 'fs';
import * as path from 'path';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
export const uploadMiddleware = upload.fields([
  { name: 'profilePhoto',  maxCount: 1 },
  { name: 'cv',            maxCount: 1 },
  { name: 'headshot',      maxCount: 1 },
  { name: 'fullBodyPhoto', maxCount: 1 },
  { name: 'cipcDoc',       maxCount: 1 },
  { name: 'taxPin',        maxCount: 1 },
  { name: 'bizBankProof',  maxCount: 1 },
]);


export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, fullName: true, email: true, phone: true,
        city: true, province: true, gender: true, dateOfBirth: true,
        address: true, height: true, clothingSize: true, shoeSize: true,
        bankName: true, accountNumber: true, branchCode: true,
        profilePhotoUrl: true, cvUrl: true,
        headshotUrl: true, fullBodyPhotoUrl: true,
        status: true, onboardingStatus: true, reliabilityScore: true, consentPopia: true,
        role: true, createdAt: true,
      },
    });

    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};


export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      fullName, phone, city, province, gender, dateOfBirth,
      address, height, clothingSize, shoeSize, bankName, accountNumber, branchCode,
      // Business-specific fields
      contactName, vatNumber, industry, website,
    } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(fullName    !== undefined && { fullName }),
        ...(phone       !== undefined && { phone }),
        ...(city        !== undefined && { city }),
        ...(province    !== undefined && { province }),
        ...(gender      !== undefined && { gender }),
        ...(address     !== undefined && { address }),
        ...(dateOfBirth !== undefined && { dateOfBirth: new Date(dateOfBirth) }),
        ...(height      !== undefined && { height: parseInt(height) }),
        ...(clothingSize !== undefined && { clothingSize }),
        ...(shoeSize    !== undefined && { shoeSize }),
        ...(bankName    !== undefined && { bankName }),
        ...(accountNumber !== undefined && { accountNumber }),
        ...(branchCode  !== undefined && { branchCode }),
        // Business fields
        ...(contactName !== undefined && { contactName }),
        ...(vatNumber   !== undefined && { vatNumber }),
        ...(industry    !== undefined && { industry }),
        ...(website     !== undefined && { website }),
      },
    });

    await auditLog({ userId: req.user!.id, action: 'UPDATE_PROFILE', entity: 'User', entityId: req.user!.id });
    res.json({ message: 'Profile updated', user: updated });
  } catch {
    res.status(500).json({ error: 'Profile update failed' });
  }
};


export const uploadDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const files = req.files as Record<string, Express.Multer.File[]>;
    const userId = req.user!.id;
    const updates: Record<string, string> = {};

    const isDev = process.env.NODE_ENV !== 'production';

    for (const [field, fileArr] of Object.entries(files)) {
      const file = fileArr[0];
      const key = `users/${userId}/${field}-${Date.now()}`;
      const fieldMap: Record<string, string> = {
        profilePhoto:  'profilePhotoUrl',
        cv:            'cvUrl',
        headshot:      'headshotUrl',
        fullBodyPhoto: 'fullBodyPhotoUrl',
        cipcDoc:       'cipcDocUrl',
        taxPin:        'taxPinUrl',
        bizBankProof:  'bizBankProofUrl',
      };

      if (fieldMap[field]) {
        let url: string;
        if (isDev) {
          const uploadDir = path.join(process.cwd(), 'uploads', userId);
          fs.mkdirSync(uploadDir, { recursive: true });
          const filename = `${field}-${Date.now()}${path.extname(file.originalname) || ''}`;
          fs.writeFileSync(path.join(uploadDir, filename), file.buffer);
          url = `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${userId}/${filename}`;
        } else {
          url = await uploadToS3(key, file.buffer, file.mimetype);
        }
        updates[fieldMap[field]] = url;
      }
    }

    const user = await prisma.user.update({ where: { id: userId }, data: updates });

    await auditLog({ userId, action: 'UPLOAD_DOCUMENTS', entity: 'User', entityId: userId, meta: { fields: Object.keys(updates) } });

    // Auto-flag for review if core docs uploaded
    if ((user.headshotUrl && user.fullBodyPhotoUrl) || user.cipcDocUrl) {
      await prisma.user.update({ where: { id: userId }, data: { onboardingStatus: 'documents_submitted' } });
    }

    res.json({ message: 'Documents uploaded', urls: updates });
  } catch (err) {
    console.error('[User] document upload error:', err);
    res.status(500).json({ error: 'Document upload failed' });
  }
};

export const uploadDocumentsByUserId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    if (!userId) { res.status(400).json({ error: 'userId is required' }); return; }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const files = req.files as Record<string, Express.Multer.File[]>;
    const updates: Record<string, string> = {};
    const isDev = process.env.NODE_ENV !== 'production';

    for (const [field, fileArr] of Object.entries(files)) {
      const file = fileArr[0];
      const key = `users/${userId}/${field}-${Date.now()}`;
      const fieldMap: Record<string, string> = {
        profilePhoto:  'profilePhotoUrl',
        cv:            'cvUrl',
        headshot:      'headshotUrl',
        fullBodyPhoto: 'fullBodyPhotoUrl',
        cipcDoc:       'cipcDocUrl',
        taxPin:        'taxPinUrl',
        bizBankProof:  'bizBankProofUrl',
      };
      if (fieldMap[field]) {
        let url: string;
        if (isDev) {
          const uploadDir = path.join(process.cwd(), 'uploads', userId);
          fs.mkdirSync(uploadDir, { recursive: true });
          const filename = `${field}-${Date.now()}${path.extname(file.originalname) || ''}`;
          fs.writeFileSync(path.join(uploadDir, filename), file.buffer);
          url = `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${userId}/${filename}`;
        } else {
          url = await uploadToS3(key, file.buffer, file.mimetype);
        }
        updates[fieldMap[field]] = url;
      }
    }

    if (Object.keys(updates).length > 0) {
      const updated = await prisma.user.update({ where: { id: userId }, data: updates });
      await auditLog({ userId, action: 'UPLOAD_DOCUMENTS', entity: 'User', entityId: userId, meta: { fields: Object.keys(updates) } });
      if ((updated.headshotUrl && updated.fullBodyPhotoUrl) || updated.cipcDocUrl) {
        await prisma.user.update({ where: { id: userId }, data: { onboardingStatus: 'documents_submitted' } });
      }
    }

    res.json({ message: 'Documents uploaded', urls: updates });
  } catch (err) {
    console.error('[User] public document upload error:', err);
    res.status(500).json({ error: 'Document upload failed' });
  }
};



export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        shifts: { include: { job: true } },
        applications: { include: { job: true } },
        payments: true,
      },
    });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};


export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, status, search } = req.query;
    const users = await prisma.user.findMany({
      where: {
        ...(role && { role: role as any }),
        ...(status && { status: status as string }),
        ...(search && {
          OR: [
            { fullName: { contains: search as string, mode: 'insensitive' } },
            { email: { contains: search as string, mode: 'insensitive' } },
          ],
        }),
      },
      select: {
        id: true, fullName: true, email: true, role: true, status: true,
        onboardingStatus: true, phone: true, city: true, reliabilityScore: true,
        profilePhotoUrl: true, headshotUrl: true, fullBodyPhotoUrl: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};


/**
 * GET /api/users/promoters/eligible?jobId=xxx
 * Returns approved promoters eligible for a given job, sorted by:
 *   1. City match (same city as job venue)
 *   2. Reliability score desc
 * Also returns basic profile photos for business display.
 */
export const getEligiblePromoters = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId, city, category } = req.query;

    // Fetch job to get location/category context
    let jobCity = city as string | undefined;
    let jobCategory = category as string | undefined;

    if (jobId) {
      const job = await prisma.job.findUnique({ where: { id: jobId as string } });
      if (job) {
        jobCity = jobCity || job.address?.split(',')[0]?.trim();
        jobCategory = jobCategory || (job.filters as any)?.category;
      }
    }

    const promoters = await prisma.user.findMany({
      where: {
        role: 'PROMOTER',
        status: 'approved',
      },
      select: {
        id: true, fullName: true, email: true, phone: true,
        city: true, province: true, gender: true, height: true,
        clothingSize: true, reliabilityScore: true,
        profilePhotoUrl: true, headshotUrl: true, fullBodyPhotoUrl: true,
        onboardingStatus: true,
      },
      orderBy: [
        { reliabilityScore: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    // Sort: city-match first
    const sorted = [...promoters].sort((a, b) => {
      const aMatch = jobCity && a.city?.toLowerCase().includes(jobCity.toLowerCase()) ? 0 : 1;
      const bMatch = jobCity && b.city?.toLowerCase().includes(jobCity.toLowerCase()) ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
      return (b.reliabilityScore || 0) - (a.reliabilityScore || 0);
    });

    res.json(sorted);
  } catch (err) {
    console.error('[Users] eligible promoters error:', err);
    res.status(500).json({ error: 'Failed to fetch eligible promoters' });
  }
};