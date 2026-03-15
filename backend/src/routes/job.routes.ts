import { Router } from "express";
import { getAllJobs, getJobById, createJob, updateJob, deleteJob, getMyJobs } from "../controllers/job.controller";
import { protect, adminOnly, adminOrBusiness } from "../middleware/auth";

const router = Router();

router.get("/", protect, adminOrBusiness, getAllJobs);
router.get("/my", protect, getMyJobs);
router.get("/:id", protect, adminOrBusiness, getJobById);
router.post("/", protect, adminOnly, createJob);
router.put("/:id", protect, adminOnly, updateJob);
router.delete("/:id", protect, adminOnly, deleteJob);

export default router;