// shared/services/jobsService.ts
// Reads/writes jobs from localStorage (hg_jobs) for persistence.
// Initializes from mock data if not present.

import type { Job, JobApplication } from '../types/job.types';
import { MOCK_JOBS } from './mockData';

const STORAGE_KEY = 'hg_jobs';

// Initialize localStorage with mock jobs if empty
function initializeJobs(): void {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (!existing) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_JOBS));
    }
  } catch (e) {
    console.warn('Failed to initialize jobs', e);
  }
}

// Call once on module load
initializeJobs();

function getJobs(): Job[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveJobs(jobs: Job[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  } catch (e) {
    console.warn('Failed to save jobs', e);
  }
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export const jobsService = {
  async getAvailableJobs(promoterId?: string): Promise<Job[]> {
    await delay(400);
    // promoterId kept for future server-side distance calculation
    void promoterId;
    return getJobs();
  },

  async getJobById(jobId: string): Promise<Job | null> {
    await delay(150);
    const jobs = getJobs();
    return jobs.find(j => j.id === jobId) ?? null;
  },

  async applyForJob(jobId: string, promoterId: string): Promise<JobApplication> {
    await delay(600);
    const jobs = getJobs();
    const job = jobs.find(j => j.id === jobId);
    if (!job) throw new Error('Job not found');
    if (job.status !== 'open') throw new Error('This job is no longer accepting applications');
    
    const allocated = job.filledSlots < job.totalSlots;
    if (allocated) {
      job.filledSlots += 1;
      if (job.filledSlots >= job.totalSlots) job.status = 'filled';
    }
    saveJobs(jobs);
    
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
    const jobs = getJobs();
    const idx = data.id ? jobs.findIndex(j => j.id === data.id) : -1;
    if (idx > -1) {
      jobs[idx] = { ...jobs[idx], ...data } as Job;
      saveJobs(jobs);
      return jobs[idx];
    }
    const newJob = { ...data, id: `j-${Date.now()}`, createdAt: new Date().toISOString() } as Job;
    jobs.push(newJob);
    saveJobs(jobs);
    return newJob;
  },

  /** Delete a job (admin) */
  async deleteJob(jobId: string): Promise<void> {
    await delay(300);
    const jobs = getJobs();
    const filtered = jobs.filter(j => j.id !== jobId);
    saveJobs(filtered);
  },
};