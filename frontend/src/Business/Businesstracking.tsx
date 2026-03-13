import { useState, useEffect, useRef } from 'react'
import { getBusinessJobs, calcHours, calcPayout, type Job, type Applicant } from './jobsStore'

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

/* ─── PROMOTER LIVE CARD (view-only) ───────────────────────── */
// ── CHANGE: removed all check-in / check-out buttons; view-only display of live promoters ──
function PromoterLiveCard({ applicant, job }: {
  applicant: Applicant; job: Job
}) {
  const activeShift = applicant.shifts.find(s => !s.checkOut)
  const completedShifts = applicant.shifts.filter(s => s.checkOut)
  const totalHours = calcHours(applicant.shifts)
  const totalPayout = calcPayout(applicant.shifts, job.ratePerHour)

  // Only render if there's an active shift
  if (!activeShift) return null

  return (
    <div style={{
      background: BLACK_CARD,
      border: `1px solid ${GREEN}30`,
      position: 'relative', overflow: 'hidden',
      boxShadow: `0 0 24px rgba(74,222,128,0.06)`,
    }}>
      <div style={{ height: 3, background: GREEN }} />

      <div style={{ padding: '20px 22px' }}>
        {/* Promoter info */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
              background: `${GREEN}15`,
              border: `1px solid ${GREEN}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: FD, fontSize: 15, color: GREEN,
            }}>
              {applicant.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p style={{ fontFamily: FB, fontSize: 13, fontWeight: 600, color: WHITE, marginBottom: 2 }}>{applicant.fullName}</p>
              <p style={{ fontFamily: FB, fontSize: 11, color: WHITE_MUTED }}>{applicant.phone || applicant.email}</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', padding: '4px 10px' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, boxShadow: `0 0 8px ${GREEN}`, animation: 'pulse 2s infinite' }} />
              <span style={{ fontFamily: FB, fontSize: 9, fontWeight: 600, letterSpacing: '0.22em', color: GREEN }}>ON SHIFT</span>
            </div>
            <LiveTimer checkIn={activeShift.checkIn} />
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 18, border: `1px solid ${BLACK_BORDER}` }}>
          {[
            { label: 'Shifts Done', value: String(completedShifts.length) },
            { label: 'Hours Total', value: totalHours.toFixed(2) },
            { label: 'Payout', value: `R ${totalPayout.toFixed(2)}` },
          ].map((s, i) => (
            <div key={s.label} style={{ flex: 1, padding: '12px 14px', borderRight: i < 2 ? `1px solid ${BLACK_BORDER}` : 'none', textAlign: 'center' }}>
              <p style={{ fontFamily: FB, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: WHITE_DIM, marginBottom: 4 }}>{s.label}</p>
              <p style={{ fontFamily: FD, fontSize: 16, fontWeight: 700, color: i === 2 ? GOLD : WHITE }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Active shift info */}
        <div style={{ padding: '12px 14px', background: 'rgba(74,222,128,0.04)', border: '1px solid rgba(74,222,128,0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontFamily: FB, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: WHITE_DIM, marginBottom: 3 }}>Checked in</p>
              <p style={{ fontFamily: FB, fontSize: 12, color: WHITE }}>{new Date(activeShift.checkIn).toLocaleTimeString('en-ZA')}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontFamily: FB, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: WHITE_DIM, marginBottom: 3 }}>Est. earning</p>
              <p style={{ fontFamily: FB, fontSize: 13, color: GREEN }}>
                R {((Date.now() - new Date(activeShift.checkIn).getTime()) / 3600000 * job.ratePerHour).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        {/* ── CHANGE: no check-in / check-out buttons — view only ── */}
        <p style={{ fontFamily: FB, fontSize: 10, color: WHITE_DIM, textAlign: 'center', marginTop: 14, letterSpacing: '0.1em' }}>
          View only · Shift management is handled by promoters
        </p>
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
      // ── CHANGE: only load active jobs ──
      const bizJobs = getBusinessJobs(parsed.email).filter(j => j.status === 'active')
      setJobs(bizJobs)
      if (bizJobs.length > 0) setSelectedJob(bizJobs[0].id)
    }
  }, [])

  // Refresh payout display every 10 seconds while shifts are live
  useEffect(() => {
    const interval = setInterval(() => forceUpdate(n => n + 1), 10000)
    return () => clearInterval(interval)
  }, [])

  const reload = () => {
    if (session) {
      const fresh = getBusinessJobs(session.email).filter(j => j.status === 'active')
      setJobs(fresh)
    }
  }

  // ── CHANGE: only active jobs, only promoters with a live shift ──
  const activeJobs = jobs  // already filtered to active only
  const currentJob = jobs.find(j => j.id === selectedJob)

  // Only promoters currently on an active shift
  const livePromoters = currentJob
    ? currentJob.applicants.filter(a => a.shifts.some(s => !s.checkOut))
    : []

  const liveCount = livePromoters.length

  return (
    <div>
      {/* Header */}
      <div className="biz-page" style={{ marginBottom: 32 }}>
        <p style={{ fontFamily: FB, fontSize: 10, fontWeight: 600, letterSpacing: '0.38em', textTransform: 'uppercase', color: GOLD, marginBottom: 8 }}>
          Live Tracking
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <h1 style={{ fontFamily: FD, fontSize: 'clamp(24px,3vw,36px)', fontWeight: 700, color: WHITE, lineHeight: 1.1 }}>
            Live Promoters
          </h1>
          {liveCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)', padding: '8px 16px' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: GREEN, boxShadow: `0 0 8px ${GREEN}` }} />
              <span style={{ fontFamily: FB, fontSize: 11, fontWeight: 600, color: GREEN }}>{liveCount} promoter{liveCount !== 1 ? 's' : ''} currently on shift</span>
            </div>
          )}
        </div>
      </div>

      {activeJobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', border: `1px dashed ${BLACK_BORDER}` }}>
          <p style={{ fontFamily: FD, fontSize: 22, color: WHITE_MUTED, marginBottom: 8 }}>No active jobs</p>
          <p style={{ fontFamily: FB, fontSize: 13, color: WHITE_DIM }}>Create and activate a job to start tracking live shifts.</p>
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
                    <p style={{ fontFamily: FB, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: WHITE_DIM, marginBottom: 3 }}>Team Total</p>
                    <p style={{ fontFamily: FD, fontSize: 20, color: WHITE }}>{currentJob.applicants.length}</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontFamily: FB, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: WHITE_DIM, marginBottom: 3 }}>On Shift Now</p>
                    <p style={{ fontFamily: FD, fontSize: 20, color: GREEN }}>{liveCount}</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontFamily: FB, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: WHITE_DIM, marginBottom: 3 }}>Live Earning</p>
                    <p style={{ fontFamily: FD, fontSize: 20, color: GOLD }}>
                      R {livePromoters.reduce((acc, a) => {
                        const activeShift = a.shifts.find(s => !s.checkOut)
                        if (!activeShift) return acc
                        return acc + (Date.now() - new Date(activeShift.checkIn).getTime()) / 3600000 * currentJob.ratePerHour
                      }, 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── CHANGE: only show live promoters, or empty state if none ── */}
              {liveCount === 0 ? (
                <div style={{ textAlign: 'center', padding: '52px 20px', border: `1px dashed ${BLACK_BORDER}` }}>
                  <div style={{ fontSize: 32, marginBottom: 16 }}>◎</div>
                  <p style={{ fontFamily: FD, fontSize: 20, color: WHITE_MUTED, marginBottom: 8 }}>No one on shift right now</p>
                  <p style={{ fontFamily: FB, fontSize: 13, color: WHITE_DIM }}>
                    Promoters will appear here automatically once they check in to their shifts.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                  {livePromoters.map(ap => (
                    <PromoterLiveCard
                      key={ap.email}
                      applicant={ap}
                      job={currentJob}
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