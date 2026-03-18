import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  updateMyProfile,
  uploadDocuments,
  documentUpload,
  adminUpdateUser,
  deleteUser,
  getEligiblePromoters,
} from '../controllers/user.controller';
import { protect, adminOnly } from '../middleware/auth';

const router = Router();

// ── Own profile ──────────────────────────────────────────────────────────────
router.get('/me',       protect, getUserById);                      // GET    /api/users/me
router.put('/me/profile',       protect, updateMyProfile);                  // PUT    /api/users/me
router.post('/me/docs', protect, documentUpload, uploadDocuments);  // POST   /api/users/me/docs

// ── Admin: all users ─────────────────────────────────────────────────────────
router.get('/eligible', protect, adminOnly, getEligiblePromoters);  // GET    /api/users/eligible
router.get('/',         protect, adminOnly, getAllUsers);            // GET    /api/users
router.get('/:id',      protect, adminOnly, getUserById);           // GET    /api/users/:id
router.put('/:id',      protect, adminOnly, adminUpdateUser);       // PUT    /api/users/:id
router.delete('/:id',   protect, adminOnly, deleteUser);            // DELETE /api/users/:id

export default router;