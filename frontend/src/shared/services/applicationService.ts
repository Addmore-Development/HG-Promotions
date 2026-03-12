// shared/services/applicationService.ts
// Manages job applications with localStorage persistence.
// Includes standby list logic and auto-allocation when slots open.

import type { JobApplication } from '../types/job.types';
import { jobsService } from './jobsService';
import { showToast } from '../utils/toast';

const STORAGE_KEY = 'hg_applications';

// Extend JobApplication to include optional notified flag
interface ExtendedJobApplication extends JobApplication {
  notified?: boolean;
}

function getApplications(): ExtendedJobApplication[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveApplications(apps: ExtendedJobApplication[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}

export const applicationService = {
  async apply(jobId: string, promoterId: string): Promise<JobApplication> {
    const apps = getApplications();
    const existing = apps.find(a => a.jobId === jobId && a.promoterId === promoterId);
    if (existing) return existing;

    // Get current job to check available slots
    const jobs = JSON.parse(localStorage.getItem('hg_jobs') || '[]');
    const job = jobs.find((j: any) => j.id === jobId);
    const allocated = job && job.filledSlots < job.totalSlots;

    const newApp: ExtendedJobApplication = {
      id: `app_${Date.now()}`,
      jobId,
      promoterId,
      status: allocated ? 'allocated' : 'standby',
      appliedAt: new Date().toISOString(),
      notified: false,
    };
    apps.push(newApp);
    saveApplications(apps);

    // If allocated, update job filledSlots in the jobs store
    if (allocated && job) {
      job.filledSlots += 1;
      if (job.filledSlots >= job.totalSlots) job.status = 'filled';
      localStorage.setItem('hg_jobs', JSON.stringify(jobs));
    }

    return newApp;
  },

  async getApplications(promoterId: string): Promise<JobApplication[]> {
    return getApplications().filter(a => a.promoterId === promoterId);
  },

  async updateApplicationStatus(id: string, status: JobApplication['status']) {
    const apps = getApplications();
    const idx = apps.findIndex(a => a.id === id);
    if (idx !== -1) {
      apps[idx].status = status;
      saveApplications(apps);
    }
  },

  // Allocate the earliest standby applicant for a job
  async allocateFromStandby(jobId: string): Promise<JobApplication | null> {
    const apps = getApplications();
    const standbyApps = apps.filter(a => a.jobId === jobId && a.status === 'standby');
    if (standbyApps.length === 0) return null;

    // Sort by appliedAt (oldest first)
    standbyApps.sort((a, b) => new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime());
    const toAllocate = standbyApps[0];

    // Update job filledSlots in the jobs store
    const jobs = JSON.parse(localStorage.getItem('hg_jobs') || '[]');
    const jobIdx = jobs.findIndex((j: any) => j.id === jobId);
    if (jobIdx !== -1) {
      const job = jobs[jobIdx];
      if (job.filledSlots < job.totalSlots) {
        job.filledSlots += 1;
        if (job.filledSlots >= job.totalSlots) job.status = 'filled';
        localStorage.setItem('hg_jobs', JSON.stringify(jobs));
      } else {
        return null; // no slot actually open
      }
    } else {
      return null;
    }

    // Update application status
    const appIdx = apps.findIndex(a => a.id === toAllocate.id);
    apps[appIdx].status = 'allocated';
    saveApplications(apps);
    return { ...apps[appIdx] };
  },

  // Check for open slots and notify/allocate
  async checkForOpenSlots(promoterId: string): Promise<{ allocated: JobApplication[], notified: JobApplication[] }> {
    const apps = getApplications();
    const standbyApps = apps.filter(a => a.promoterId === promoterId && a.status === 'standby' && !a.notified);
    const jobs = JSON.parse(localStorage.getItem('hg_jobs') || '[]');
    
    const allocated: JobApplication[] = [];
    const notified: JobApplication[] = [];

    for (const app of standbyApps) {
      const job = jobs.find((j: any) => j.id === app.jobId);
      if (job && job.filledSlots < job.totalSlots) {
        // Try to allocate this user (but only one per slot)
        const allocatedApp = await this.allocateFromStandby(app.jobId);
        if (allocatedApp && allocatedApp.promoterId === promoterId) {
          allocated.push(allocatedApp);
          // Mark as notified so we don't notify again
          const idx = apps.findIndex(a => a.id === app.id);
          if (idx !== -1) apps[idx].notified = true;
        } else {
          // Not allocated (maybe someone else got it first), but still notify
          notified.push(app);
          const idx = apps.findIndex(a => a.id === app.id);
          if (idx !== -1) apps[idx].notified = true;
        }
      }
    }
    
    saveApplications(apps);
    return { allocated, notified };
  }
};