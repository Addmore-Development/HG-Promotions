import { useState, useEffect, useRef } from 'react'
import { getBusinessJobs, upsertJob, calcHours, calcPayout, type Job, type Applicant, type Shift } from './jobsStore'

const BLACK        = '#080808'
const BLACK_CARD   = '#161616'
const BLACK_BORDER = 'rgba(255,255,255,0.07)'
const GOLD         = '#C4973A'
const WHITE        = '#F4EFE6'
const WHITE_MUTED  = 'rgba(244,239,230,0.55)'
const WHITE_DIM    = 'rgba(244,239,230,0.18)'
const GREEN        = '#4ade80'
const FD           = "'Playfair Display', Georgia, serif"
const FB           = "'DM Sans', system-ui, sans-serif"

/* ─── LIVE TIMER ───────────────────────────────────────────── */
function LiveTimer({ checkIn }: { checkIn: string }) {
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const update = () => {
      setElapsed((Date.now() - new Date(checkIn).getTime()) / 1000)
    }
    update()
    timerRef.current = setInterval(update, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [checkIn])

  const h = Math.floor(elapsed / 3600)
  const m = Math.floor((elapsed % 3600) / 60)
  const s = Math.floor(elapsed % 60)

  return (
    <span style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, color: GREEN, letterSpacing: '0.1em' }}>
      {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  )
}

/* ─── PROMOTER TRACKING CARD ───────────────────────────────── */
function PromoterTrackCard({ applicant, job, onCheckIn, onCheckOut }: {
  applicant: Applicant; job: Job
  onCheckIn: (apEmail: string, jobId: string) => void
  onCheckOut: (apEmail: string, jobId: string, shiftId: string) => void
}) {
  const activeShift = applicant.shifts.find(s => !s.checkOut)
  const completedShifts = applicant.shifts.filter(s => s.checkOut)
  const totalHours = calcHours(applicant.shifts)
  const totalPayout = calcPayout(applicant.shifts, job.ratePerHour)
  const isActive = !!activeShift

  return (
    <div style={{
      background: BLACK_CARD,
      border: `1px solid ${isActive ? `${GREEN}30` : BLACK_BORDER}`,
      position: 'relative', overflow: 'hidden', transition: 'border-color 0.3s',
      boxShadow: isActive ? `0 0 24px rgba(74,222,128,0.06)` : 'none',
    }}>
      <div style={{ height: 3, background: isActive ? GREEN : BLACK_BORDER, transition: 'background 0.3s' }} />

      <div style={{ padding: '20px 22px' }}>
        {/* Promoter info */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
              background: isActive ? `${GREEN}15` : `${GOLD}15`,
              border: `1px solid ${isActive ? `${GREEN}40` : `${GOLD}40`}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: FD, fontSize: 15, color: isActive ? GREEN : GOLD,
            }}>
              {applicant.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p style={{ fontFamily: FB, fontSize: 13, fontWeight: 600, color: WHITE, marginBottom: 2 }}>{applicant.fullName}</p>
              <p style={{ fontFamily: FB, fontSize: 11, color: WHITE_MUTED }}>{applicant.phone || applicant.email}</p>
            </div>
          </div>
          {isActive ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', padding: '4px 10px' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, boxShadow: `0 0 8px ${GREEN}`, animation: 'pulse 2s infinite' }} />
                <span style={{ fontFamily: FB, fontSize: 9, fontWeight: 600, letterSpacing: '0.22em', color: GREEN }}>ON SHIFT</span>
              </div>
              <LiveTimer checkIn={activeShift!.checkIn} />
            </div>
          ) : (
            <span style={{ fontFamily: FB, fontSize: 9, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: WHITE_MUTED, background: 'rgba(255,255,255,0.05)', padding: '4px 10px' }}>Off Shift</span>
          )}
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 18, border: `1px solid ${BLACK_BORDER}` }}>
          {[
            { label: 'Shifts', value: String(completedShifts.length + (isActive ? 1 : 0)) },
            { label: 'Hours', value: totalHours.toFixed(2) },
            { label: 'Payout', value: `R ${totalPayout.toFixed(2)}` },
          ].map((s, i) => (
            <div key={s.label} style={{ flex: 1, padding: '12px 14px', borderRight: i < 2 ? `1px solid ${BLACK_BORDER}` : 'none', textAlign: 'center' }}>
              <p style={{ fontFamily: FB, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: WHITE_DIM, marginBottom: 4 }}>{s.label}</p>
              <p style={{ fontFamily: FD, fontSize: 16, fontWeight: 700, color: i === 2 ? GOLD : WHITE }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Active shift info */}
        {isActive && (
          <div style={{ padding: '12px 14px', background: 'rgba(74,222,128,0.04)', border: '1px solid rgba(74,222,128,0.15)', marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontFamily: FB, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: WHITE_DIM, marginBottom: 3 }}>Checked in</p>
                <p style={{ fontFamily: FB, fontSize: 12, color: WHITE }}>{new Date(activeShift!.checkIn).toLocaleTimeString('en-ZA')}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontFamily: FB, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: WHITE_DIM, marginBottom: 3 }}>Est. earning</p>
                <p style={{ fontFamily: FB, fontSize: 13, color: GREEN }}>
                  R {((Date.now() - new Date(activeShift!.checkIn).getTime()) / 3600000 * job.ratePerHour).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action button */}
        {job.status === 'active' && (
          isActive ? (
            <button
              onClick={() => onCheckOut(applicant.email, job.id, activeShift!.id)}
              style={{ width: '100%', padding: '12px 0', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.4)', fontFamily: FB, fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#ff6b6b', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,107,107,0.18)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,107,107,0.1)' }}
            >
              ■ Check Out
            </button>
          ) : (
            <button
              onClick={() => onCheckIn(applicant.email, job.id)}
              style={{ width: '100%', padding: '12px 0', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.35)', fontFamily: FB, fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: GREEN, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(74,222,128,0.18)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(74,222,128,0.1)' }}
            >
              ▶ Check In
            </button>
          )
        )}
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  )
}

/* ─── MAIN TRACKING PAGE ───────────────────────────────────── */
export default function BusinessTracking() {
  const [jobs,       setJobs]       = useState<Job[]>([])
  const [session,    setSession]    = useState<Record<string,string> | null>(null)
  const [selectedJob, setSelectedJob] = useState<string>('')
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    const s = localStorage.getItem('hg_session')
    if (s) {
      const parsed = JSON.parse(s)
      setSession(parsed)
      const bizJobs = getBusinessJobs(parsed.email)
      setJobs(bizJobs)
      const activeOnes = bizJobs.filter(j => j.status === 'active')
      if (activeOnes.length > 0) setSelectedJob(activeOnes[0].id)
    }
  }, [])

  // Refresh payout display every 10 seconds while shifts are live
  useEffect(() => {
    const interval = setInterval(() => forceUpdate(n => n + 1), 10000)
    return () => clearInterval(interval)
  }, [])

  const reload = () => {
    if (session) {
      const fresh = getBusinessJobs(session.email)
      setJobs(fresh)
    }
  }

  const handleCheckIn = (apEmail: string, jobId: string) => {
    const allJobs = getBusinessJobs(session?.email || '')
    const job = allJobs.find(j => j.id === jobId)
    if (!job) return
    const apIdx = job.applicants.findIndex(a => a.email === apEmail)
    if (apIdx < 0) return
    const newShift: Shift = {
      id: `shift-${Date.now()}`,
      checkIn: new Date().toISOString(),
    }
    job.applicants[apIdx].shifts.push(newShift)
    upsertJob(job)
    reload()
  }

  const handleCheckOut = (apEmail: string, jobId: string, shiftId: string) => {
    const allJobs = getBusinessJobs(session?.email || '')
    const job = allJobs.find(j => j.id === jobId)
    if (!job) return
    const apIdx = job.applicants.findIndex(a => a.email === apEmail)
    if (apIdx < 0) return
    const shiftIdx = job.applicants[apIdx].shifts.findIndex(s => s.id === shiftId)
    if (shiftIdx < 0) return
    job.applicants[apIdx].shifts[shiftIdx].checkOut = new Date().toISOString()
    upsertJob(job)
    reload()
  }

  const activeJobs = jobs.filter(j => j.status === 'active')
  const currentJob = jobs.find(j => j.id === selectedJob)
  const liveCount  = currentJob?.applicants.filter(a => a.shifts.some(s => !s.checkOut)).length || 0

  return (
    <div>
      {/* Header */}
      <div className="biz-page" style={{ marginBottom: 32 }}>
        <p style={{ fontFamily: FB, fontSize: 10, fontWeight: 600, letterSpacing: '0.38em', textTransform: 'uppercase', color: GOLD, marginBottom: 8 }}>
          Live Tracking
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <h1 style={{ fontFamily: FD, fontSize: 'clamp(24px,3vw,36px)', fontWeight: 700, color: WHITE, lineHeight: 1.1 }}>
            Shift Operations
          </h1>
          {liveCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)', padding: '8px 16px' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: GREEN, boxShadow: `0 0 8px ${GREEN}` }} />
              <span style={{ fontFamily: FB, fontSize: 11, fontWeight: 600, color: GREEN }}>{liveCount} promoter{liveCount !== 1 ? 's' : ''} on shift</span>
            </div>
          )}
        </div>
      </div>

      {activeJobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', border: `1px dashed ${BLACK_BORDER}` }}>
          <p style={{ fontFamily: FD, fontSize: 22, color: WHITE_MUTED, marginBottom: 8 }}>No active jobs</p>
          <p style={{ fontFamily: FB, fontSize: 13, color: WHITE_DIM }}>Create and activate a job to start tracking shifts.</p>
        </div>
      ) : (
        <>
          {/* Job selector */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
            {activeJobs.map(job => {
              const live = job.applicants.filter(a => a.shifts.some(s => !s.checkOut)).length
              const active = selectedJob === job.id
              return (
                <button key={job.id} onClick={() => setSelectedJob(job.id)}
                  style={{ padding: '10px 20px', background: active ? 'rgba(196,151,58,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? `${GOLD}55` : BLACK_BORDER}`, fontFamily: FB, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: active ? GOLD : WHITE_MUTED, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  {job.title}
                  {live > 0 && (
                    <span style={{ background: `${GREEN}20`, border: `1px solid ${GREEN}40`, color: GREEN, fontSize: 9, padding: '2px 6px', fontWeight: 700 }}>{live} live</span>
                  )}
                </button>
              )
            })}
          </div>

          {currentJob && (
            <>
              {/* Job summary bar */}
              <div className="biz-page" style={{ background: BLACK_CARD, border: `1px solid ${BLACK_BORDER}`, padding: '18px 24px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontFamily: FD, fontSize: 18, fontWeight: 700, color: WHITE, marginBottom: 4 }}>{currentJob.title}</p>
                  <p style={{ fontFamily: FB, fontSize: 12, color: WHITE_MUTED }}>📍 {currentJob.location} · R {currentJob.ratePerHour}/hr · Ends {new Date(currentJob.endDate).toLocaleDateString('en-ZA')}</p>
                </div>
                <div style={{ display: 'flex', gap: 20 }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontFamily: FB, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: WHITE_DIM, marginBottom: 3 }}>Team</p>
                    <p style={{ fontFamily: FD, fontSize: 20, color: WHITE }}>{currentJob.applicants.length}</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontFamily: FB, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: WHITE_DIM, marginBottom: 3 }}>On Shift</p>
                    <p style={{ fontFamily: FD, fontSize: 20, color: GREEN }}>{liveCount}</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontFamily: FB, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: WHITE_DIM, marginBottom: 3 }}>Total Payout</p>
                    <p style={{ fontFamily: FD, fontSize: 20, color: GOLD }}>
                      R {currentJob.applicants.reduce((acc, a) => acc + calcPayout(a.shifts, currentJob.ratePerHour), 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {currentJob.applicants.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '52px 20px', border: `1px dashed ${BLACK_BORDER}` }}>
                  <p style={{ fontFamily: FB, fontSize: 13, color: WHITE_DIM }}>No promoters have joined this job yet.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                  {currentJob.applicants.map(ap => (
                    <PromoterTrackCard
                      key={ap.email}
                      applicant={ap}
                      job={currentJob}
                      onCheckIn={handleCheckIn}
                      onCheckOut={handleCheckOut}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}