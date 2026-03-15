import { Router } from "express";
import {
  applyToJob, getApplicationsForJob, updateApplicationStatus, getMyApplications,
} from "../controllers/application.controller";
import { protect, adminOnly, adminOrBusiness } from "../middleware/auth";

const router = Router();

router.post("/", protect, applyToJob);
router.get("/my", protect, getMyApplications);
router.get("/job/:jobId", protect, adminOrBusiness, getApplicationsForJob);
router.put("/:id/status", protect, adminOnly, updateApplicationStatus);

export default router;