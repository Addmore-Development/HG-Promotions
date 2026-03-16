import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma, JWT_SECRET, JWT_EXPIRES_IN } from '../config';
import { AuthRequest } from '../middleware/auth';
import { auditLog } from '../utils/auditLogger';


export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name, email, password, role, consentPopia,
      // Promoter fields
      phone, idNumber, city,
      // Business fields
      companyName, contactName, companyReg, vatNumber,
    } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'name, email and password are required' });
      return;
    }

    // POPIA: consent required for promoters
    if (role === 'PROMOTER' && !consentPopia) {
      res.status(400).json({ error: 'POPIA consent is required to register as a promoter' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const hashed = await bcrypt.hash(password, 12);
    const normalizedRole = (role?.toUpperCase() || 'PROMOTER') as any;
    const isBusiness = normalizedRole === 'BUSINESS';

    const user = await prisma.user.create({
      data: {
        // For business: store company name as fullName, contact person in contactName
        fullName:         isBusiness ? (companyName || name) : name,
        email,
        password:         hashed,
        role:             normalizedRole,
        consentPopia:     !!consentPopia,
        status:           'pending_review',
        onboardingStatus: 'pending_review',

        // Shared fields
        phone:            phone    || null,
        city:             city     || null,

        // Promoter-specific
        idNumber:         !isBusiness ? (idNumber || null) : null,

        // Business-specific — stored in available schema fields
        contactName:      isBusiness ? (contactName || name) : null,  // contact person name
        vatNumber:        isBusiness ? (vatNumber || null) : null,
        // companyReg stored in address field for business users
        address:          isBusiness ? (companyReg || null) : null,
      },
    });

    await auditLog({ userId: user.id, action: 'REGISTER', entity: 'User', entityId: user.id });

    res.status(201).json({
      message: 'Registration successful — pending admin review',
      userId: user.id,
    });
  } catch (err) {
    console.error('[Auth] register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
};


export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as any
    );

    await auditLog({ userId: user.id, action: 'LOGIN', entity: 'User', entityId: user.id });

    res.json({
      token,
      user: {
        id:               user.id,
        name:             user.fullName,
        email:            user.email,
        role:             user.role,
        status:           user.status,
        onboardingStatus: user.onboardingStatus,
        profilePhotoUrl:  user.profilePhotoUrl,
      },
    });
  } catch (err) {
    console.error('[Auth] login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};


export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        onboardingStatus: true,
        phone: true,
        city: true,
        province: true,
        reliabilityScore: true,
        profilePhotoUrl: true,
        consentPopia: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};


export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });

    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      res.status(401).json({ error: 'Current password incorrect' });
      return;
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

    await auditLog({ userId: user.id, action: 'CHANGE_PASSWORD', entity: 'User', entityId: user.id });

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Password change failed' });
  }
};