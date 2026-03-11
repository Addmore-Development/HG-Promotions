// shared/services/jobsService.ts
// FUTURE: replace each function body with a real fetch() call.

import type { Job, JobApplication } from '../types/job.types';
import { MOCK_JOBS } from './mockData';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export const jobsService = {
  async getAvailableJobs(promoterId?: string): Promise<Job[]> {
    await delay(400);
    // promoterId kept for future server-side distance calculation
    void promoterId;
    return [...MOCK_JOBS];
  },

  async getJobById(jobId: string): Promise<Job | null> {
    await delay(150);
    return MOCK_JOBS.find(j => j.id === jobId) ?? null;
  },

  async applyForJob(jobId: string, promoterId: string): Promise<JobApplication> {
    await delay(600);
    const job = MOCK_JOBS.find(j => j.id === jobId);
    if (!job) throw new Error('Job not found');
    if (job.status !== 'open') throw new Error('This job is no longer accepting applications');
    const allocated = job.filledSlots < job.totalSlots;
    if (allocated) job.filledSlots += 1;
    if (job.filledSlots >= job.totalSlots) job.status = 'filled';
    return {
      id: `app-${Date.now()}`,
      jobId,
      promoterId,
      status: allocated ? 'allocated' : 'standby',
      appliedAt: new Date().toISOString(),
    };
  },

  /** Admin: create or update a job */
  async upsertJob(data: Partial<Job> & { id?: string }): Promise<Job> {
    await delay(500);
    const idx = data.id ? MOCK_JOBS.findIndex(j => j.id === data.id) : -1;
    if (idx > -1) {
      MOCK_JOBS[idx] = { ...MOCK_JOBS[idx], ...data } as Job;
      return MOCK_JOBS[idx];
    }
    const newJob = { ...data, id: `j-${Date.now()}`, createdAt: new Date().toISOString() } as Job;
    MOCK_JOBS.push(newJob);
    return newJob;
  },
};