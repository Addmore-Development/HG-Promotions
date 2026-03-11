/**
 * jobsService.ts
 * Swap mock implementations for real fetch() calls when API is ready.
 */
import type { Job, JobApplication } from '../types/job.types';
import { MOCK_JOBS } from './mockData';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const jobsService = {
  async getAvailableJobs(promoterId?: string): Promise<Job[]> {
    await delay(400);
    // Future: GET /api/jobs?promoterId=...&status=open
    return MOCK_JOBS.filter(j => j.status === 'open' || j.status === 'filled');
  },

  async getJobById(jobId: string): Promise<Job | null> {
    await delay(200);
    // Future: GET /api/jobs/:jobId
    return MOCK_JOBS.find(j => j.id === jobId) ?? null;
  },

  async applyForJob(jobId: string, promoterId: string): Promise<JobApplication> {
    await delay(600);
    // Future: POST /api/jobs/:jobId/apply
    const job = MOCK_JOBS.find(j => j.id === jobId);
    if (!job) throw new Error('Job not found');
    if (job.filledSlots >= job.totalSlots) throw new Error('No slots available');

    const application: JobApplication = {
      id: `app-${Date.now()}`,
      jobId,
      promoterId,
      status: job.filledSlots < job.totalSlots ? 'allocated' : 'standby',
      appliedAt: new Date().toISOString(),
    };
    // Mutate mock in memory
    job.filledSlots = Math.min(job.filledSlots + 1, job.totalSlots);
    return application;
  },
};