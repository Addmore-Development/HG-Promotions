import { Router } from "express";
import {
  getProfile, updateProfile, uploadDocuments, uploadMiddleware,
  getAllUsers, getUserById, getEligiblePromoters, uploadDocumentsByUserId,
} from "../controllers/user.controller";
import { protect, adminOnly, adminOrBusiness } from "../middleware/auth";

const router = Router();

router.get("/me/profile", protect, getProfile);
router.put("/me/profile", protect, updateProfile);
router.post("/me/documents", protect, uploadMiddleware, uploadDocuments);
// Public route — used immediately after registration before account is approved
router.post("/register-documents/:userId", uploadMiddleware, uploadDocumentsByUserId);

// Business + Admin can fetch eligible promoters for a job
router.get("/promoters/eligible", protect, adminOrBusiness, getEligiblePromoters);

router.get("/", protect, adminOnly, getAllUsers);
router.get("/:id", protect, adminOrBusiness, getUserById);

export default router;