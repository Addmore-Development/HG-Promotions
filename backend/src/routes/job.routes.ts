import { Router } from "express";
import { getAllJobs, getJobById, createJob, updateJob, deleteJob, getMyJobs, getBusinessJobs } from "../controllers/job.controller";
import { protect, adminOnly } from "../middleware/auth";

const router = Router();

// All authenticated users can view jobs (promoters see open jobs, business sees their jobs, admin sees all)
router.get("/", protect, getAllJobs);
router.get("/my", protect, getMyJobs);

// ── Dedicated endpoint for business users — guaranteed to return their jobs ──
// Must be defined BEFORE /:id to avoid being caught by the param route
router.get("/business", protect, getBusinessJobs);

router.get("/:id", protect, getJobById);
router.post("/", protect, adminOnly, createJob);
router.put("/:id", protect, adminOnly, updateJob);
router.delete("/:id", protect, adminOnly, deleteJob);

export default router;