export interface Shift {
  id:        string
  checkIn:   string       // ISO datetime
  checkOut?: string       // ISO datetime, undefined = still working
}

export interface Applicant {
  email:     string
  fullName:  string
  phone?:    string
  idNumber?: string
  shifts:    Shift[]
  joinedAt:  string
}

export interface Job {
  id:              string
  businessEmail:   string
  title:           string
  promotersNeeded: number
  location:        string
  terms:           string
  ratePerHour:     number
  startDate?:      string  // ── CHANGE: ISO date string, optional for backwards compat
  endDate:         string  // ISO date string
  status:          'active' | 'cancelled'
  createdAt:       string
  applicants:      Applicant[]
}

const KEY = 'hg_jobs'

export function getAllJobs(): Job[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as Job[]
  } catch {
    return []
  }
}

export function saveAllJobs(jobs: Job[]): void {
  localStorage.setItem(KEY, JSON.stringify(jobs))
}

export function getBusinessJobs(businessEmail: string): Job[] {
  return getAllJobs().filter(j => j.businessEmail === businessEmail)
}

export function upsertJob(job: Job): void {
  const all = getAllJobs()
  const idx = all.findIndex(j => j.id === job.id)
  if (idx >= 0) {
    all[idx] = job
  } else {
    all.push(job)
  }
  saveAllJobs(all)
}

export function getJobById(id: string): Job | undefined {
  return getAllJobs().find(j => j.id === id)
}

export function calcHours(shifts: Shift[]): number {
  return shifts
    .filter(s => s.checkOut)
    .reduce((acc, s) => {
      return acc + (new Date(s.checkOut!).getTime() - new Date(s.checkIn).getTime()) / 3600000
    }, 0)
}

export function calcPayout(shifts: Shift[], ratePerHour: number): number {
  return calcHours(shifts) * ratePerHour
}

// Seed some mock promoter applicants for demo purposes
export function seedMockApplicants(businessEmail: string): void {
  const all = getAllJobs()
  const bizJobs = all.filter(j => j.businessEmail === businessEmail && j.applicants.length === 0 && j.status === 'active')
  if (bizJobs.length === 0) return

  const mockPromoters: Omit<Applicant, 'shifts' | 'joinedAt'>[] = [
    { email: 'ayanda@promo.co.za',  fullName: 'Ayanda Dlamini',  phone: '+27711234567', idNumber: '9501015009087' },
    { email: 'sipho@promo.co.za',   fullName: 'Sipho Nkosi',     phone: '+27829876543', idNumber: '9203025008083' },
    { email: 'lerato@promo.co.za',  fullName: 'Lerato Mokoena',  phone: '+27613334455', idNumber: '9807060009081' },
  ]

  const now = new Date()
  const twoHoursAgo = new Date(now.getTime() - 2 * 3600000).toISOString()
  const oneHourAgo  = new Date(now.getTime() - 1 * 3600000).toISOString()
  const thirtyMinsAgo = new Date(now.getTime() - 0.5 * 3600000).toISOString()

  bizJobs.forEach((job, ji) => {
    job.applicants = mockPromoters.slice(0, Math.min(2, job.promotersNeeded)).map((p, pi) => ({
      ...p,
      joinedAt: new Date(Date.now() - (ji + pi) * 3600000 * 24).toISOString(),
      shifts: pi === 0 ? [
        { id: `s-${Date.now()}-1`, checkIn: twoHoursAgo, checkOut: oneHourAgo },
        { id: `s-${Date.now()}-2`, checkIn: thirtyMinsAgo },
      ] : [
        { id: `s-${Date.now()}-3`, checkIn: oneHourAgo, checkOut: thirtyMinsAgo },
      ],
    }))
  })

  saveAllJobs(all)
}