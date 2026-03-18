import { Response } from 'express';
import { prisma }   from '../config';
import { AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path   from 'path';
import fs     from 'fs';

// ── Multer setup ────────────────────────────────────────────────────────────
const docDir = path.join(process.cwd(), 'uploads', 'documents');
if (!fs.existsSync(docDir)) fs.mkdirSync(docDir, { recursive: true });

const docStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, docDir),
  filename:    (_req, file, cb)  => cb(null, `${Date.now()}-${file.originalname}`),
});

export const documentUpload = multer({
  storage: docStorage,
  limits:  { fileSize: 20 * 1024 * 1024 },
}).fields([
  { name: 'headshot',      maxCount: 1 },
  { name: 'fullBodyPhoto', maxCount: 1 },
  { name: 'cv',            maxCount: 1 },
  { name: 'profilePhoto',  maxCount: 1 },
]);

// ── GET all users (admin) ───────────────────────────────────────────────────
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role, status } = req.query;
    const where: any = {};
    if (role)   where.role   = (role   as string).toUpperCase();
    if (status) where.status = (status as string).toLowerCase();

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true, fullName: true, email: true, phone: true, role: true,
        status: true, onboardingStatus: true, city: true, province: true,
        streetNumber: true, streetName: true, suburb: true, postalCode: true,
        reliabilityScore: true, profilePhotoUrl: true, headshotUrl: true,
        fullBodyPhotoUrl: true, createdAt: true, gender: true,
        height: true, clothingSize: true, shoeSize: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err) {
    console.error('[User] getAllUsers error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// ── GET single user ─────────────────────────────────────────────────────────
export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, fullName: true, email: true, phone: true, role: true,
        status: true, onboardingStatus: true, city: true, province: true,
        streetNumber: true, streetName: true, suburb: true, postalCode: true,
        reliabilityScore: true, profilePhotoUrl: true, headshotUrl: true,
        fullBodyPhotoUrl: true, cvUrl: true, createdAt: true,
        gender: true, height: true, clothingSize: true, shoeSize: true,
        idNumber: true, bankName: true, accountNumber: true, branchCode: true,
        rejectionReason: true, consentPopia: true,
      },
    });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json(user);
  } catch (err) {
    console.error('[User] getUserById error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// ── PUT update own profile ──────────────────────────────────────────────────
export const updateMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      city, province,
      streetNumber, streetName, suburb, postalCode,
      height, clothingSize, shoeSize,
      bankName, accountNumber, branchCode,
    } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(city          !== undefined && { city }),
        ...(province      !== undefined && { province }),
        ...(streetNumber  !== undefined && { streetNumber }),
        ...(streetName    !== undefined && { streetName }),
        ...(suburb        !== undefined && { suburb }),
        ...(postalCode    !== undefined && { postalCode }),
        ...(height        !== undefined && { height: Number(height) || null }),
        ...(clothingSize  !== undefined && { clothingSize }),
        ...(shoeSize      !== undefined && { shoeSize }),
        ...(bankName      !== undefined && { bankName }),
        ...(accountNumber !== undefined && { accountNumber }),
        ...(branchCode    !== undefined && { branchCode }),
      },
    });
    res.json(updated);
  } catch (err) {
    console.error('[User] updateMyProfile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// ── POST upload documents ───────────────────────────────────────────────────
export const uploadDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const data: any = {};

    if (files?.headshot?.[0])      data.headshotUrl      = `/uploads/documents/${files.headshot[0].filename}`;
    if (files?.fullBodyPhoto?.[0]) data.fullBodyPhotoUrl = `/uploads/documents/${files.fullBodyPhoto[0].filename}`;
    if (files?.cv?.[0])            data.cvUrl            = `/uploads/documents/${files.cv[0].filename}`;
    if (files?.profilePhoto?.[0])  data.profilePhotoUrl  = `/uploads/documents/${files.profilePhoto[0].filename}`;

    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: 'No files uploaded' });
      return;
    }

    const updated = await prisma.user.update({ where: { id: req.user!.id }, data });
    res.json(updated);
  } catch (err) {
    console.error('[User] uploadDocuments error:', err);
    res.status(500).json({ error: 'Failed to upload documents' });
  }
};

// ── Admin: update user status / onboarding ─────────────────────────────────
export const adminUpdateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      status, onboardingStatus, rejectionReason,
      role, reliabilityScore, paymentStatus,
    } = req.body;

    const data: any = {};
    if (status           !== undefined) data.status           = status;
    if (onboardingStatus !== undefined) data.onboardingStatus = onboardingStatus;
    if (rejectionReason  !== undefined) data.rejectionReason  = rejectionReason;
    if (role             !== undefined) data.role             = role.toUpperCase();
    if (reliabilityScore !== undefined) data.reliabilityScore = parseFloat(reliabilityScore);
    if (paymentStatus    !== undefined) data.paymentStatus    = paymentStatus;

    const updated = await prisma.user.update({ where: { id: req.params.id }, data });
    res.json(updated);
  } catch (err) {
    console.error('[User] adminUpdateUser error:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// ── Admin: delete user ──────────────────────────────────────────────────────
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('[User] deleteUser error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// ── Eligible promoters for a job ────────────────────────────────────────────
export const getEligiblePromoters = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { jobId } = req.query;
    const where: any = { role: 'PROMOTER', status: 'approved' };

    const promoters = await prisma.user.findMany({
      where,
      select: {
        id: true, fullName: true, email: true, phone: true, city: true,
        province: true, gender: true, height: true, clothingSize: true,
        shoeSize: true, reliabilityScore: true, profilePhotoUrl: true,
        headshotUrl: true, fullBodyPhotoUrl: true, cvUrl: true,
        onboardingStatus: true, status: true, createdAt: true,
      },
      orderBy: { reliabilityScore: 'desc' },
    });

    // Exclude already-allocated promoters if jobId provided
    if (jobId) {
      const allocated = await prisma.application.findMany({
        where: { jobId: jobId as string, status: 'ALLOCATED' },
        select: { promoterId: true },
      });
      const allocatedIds = new Set(allocated.map(a => a.promoterId));
      res.json(promoters.filter(p => !allocatedIds.has(p.id)));
      return;
    }

    res.json(promoters);
  } catch (err) {
    console.error('[User] getEligiblePromoters error:', err);
    res.status(500).json({ error: 'Failed to fetch promoters' });
  }
};