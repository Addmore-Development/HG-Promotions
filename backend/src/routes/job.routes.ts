import { Router } from "express";
import { getAllJobs, getJobById, createJob, updateJob, deleteJob, getMyJobs } from "../controllers/job.controller";
import { protect, adminOnly } from "../middleware/auth";

const router = Router();

// All authenticated users can view jobs (promoters see open jobs, business sees their jobs, admin sees all)
router.get("/", protect, getAllJobs);
router.get("/my", protect, getMyJobs);
router.get("/:id", protect, getJobById);
router.post("/", protect, adminOnly, createJob);
router.put("/:id", protect, adminOnly, updateJob);
router.delete("/:id", protect, adminOnly, deleteJob);

export default router;