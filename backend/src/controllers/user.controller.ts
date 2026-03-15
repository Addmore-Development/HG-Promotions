import { Request, Response } from 'express';
import { prisma } from '../config';
import { AuthRequest } from '../middleware/auth';
import { auditLog } from '../utils/auditLogger';
import { uploadToS3, mockS3Url } from '../services/s3.service';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
export const uploadMiddleware = upload.fields([
  { name: 'idFront', maxCount: 1 },
  { name: 'idBack', maxCount: 1 },
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'cv', maxCount: 1 },
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
        idFrontUrl: true, idBackUrl: true, profilePhotoUrl: true, cvUrl: true,
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
    } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        fullName, phone, city, province, gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        address,
        height: height ? parseInt(height) : undefined,
        clothingSize, shoeSize, bankName, accountNumber, branchCode,
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
        idFront: 'idFrontUrl',
        idBack: 'idBackUrl',
        profilePhoto: 'profilePhotoUrl',
        cv: 'cvUrl',
      };

      if (fieldMap[field]) {
        const url = isDev
          ? mockS3Url(`users/${userId}`, `${field}-${Date.now()}`)
          : await uploadToS3(key, file.buffer, file.mimetype);

        updates[fieldMap[field]] = url;
      }
    }

    const user = await prisma.user.update({ where: { id: userId }, data: updates });

    await auditLog({ userId, action: 'UPLOAD_DOCUMENTS', entity: 'User', entityId: userId, meta: { fields: Object.keys(updates) } });

    // Auto-flag for review if all docs uploaded
    if (user.idFrontUrl && user.idBackUrl && user.profilePhotoUrl) {
      await prisma.user.update({ where: { id: userId }, data: { onboardingStatus: 'documents_submitted' } });
    }

    res.json({ message: 'Documents uploaded', urls: updates });
  } catch (err) {
    console.error('[User] document upload error:', err);
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
        profilePhotoUrl: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};
