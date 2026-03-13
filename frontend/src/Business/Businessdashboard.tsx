import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getBusinessJobs, type Job } from './jobsStore'

const GOLD         = '#C4973A'
const GOLD_LIGHT   = '#DDB55A'
const BLACK_CARD   = '#161616'
const BLACK_BORDER = 'rgba(255,255,255,0.07)'
const WHITE        = '#F4EFE6'
const WHITE_MUTED  = 'rgba(244,239,230,0.55)'
const WHITE_DIM    = 'rgba(244,239,230,0.18)'
const FD           = "'Playfair Display', Georgia, serif"
const FB           = "'DM Sans', system-ui, sans-serif"

function StatCard({ label, value, sub, accent, delay }: {
  label: string; value: string | number; sub?: string; accent?: string; delay?: number
}) {
  return (
    <div className="biz-page" style={{
      animationDelay: `${delay || 0}ms`,
      background: BLACK_CARD, border: `1px solid ${BLACK_BORDER}`,
      padding: '28px 28px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accent || GOLD }} />
      <p style={{ fontFamily: FB, fontSize: 9, fontWeight: 600, letterSpacing: '0.3em', textTransform: 'uppercase', color: accent || GOLD, marginBottom: 14 }}>{label}</p>
      <p style={{ fontFamily: FD, fontSize: 38, fontWeight: 700, color: WHITE, lineHeight: 1, marginBottom: 8 }}>{value}</p>
      {sub && <p style={{ fontFamily: FB, fontSize: 11, color: WHITE_MUTED }}>{sub}</p>}
    </div>
  )
}

export default function BusinessDashboard() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState<Job[]>([])
  const [session, setSession] = useState<Record<string, string> | null>(null)

  useEffect(() => {
    const s = localStorage.getItem('hg_session')
    if (s) {
      const parsed = JSON.parse(s)
      setSession(parsed)
      setJobs(getBusinessJobs(parsed.email))
    }
  }, [])

  const activeJobs     = jobs.filter(j => j.status === 'active')
  const totalPromoters = jobs.reduce((acc, j) => acc + (j.applicants?.length || 0), 0)

  const allShifts = jobs.flatMap(j =>
    (j.applicants || []).flatMap(a =>
      (a.shifts || []).filter(s => s.checkOut)
    )
  )
  const totalHours = allShifts.reduce((acc, s) => {
    const h = (new Date(s.checkOut!).getTime() - new Date(s.checkIn).getTime()) / 3600000
    return acc + h
  }, 0)
  const totalPayout = jobs.reduce((acc, j) => {
    return acc + (j.applicants || []).reduce((a2, ap) => {
      const hrs = (ap.shifts || []).filter(s => s.checkOut).reduce((h, s) => {
        return h + (new Date(s.checkOut!).getTime() - new Date(s.checkIn).getTime()) / 3600000
      }, 0)
      return a2 + hrs * j.ratePerHour
    }, 0)
  }, 0)

  const recentJobs = [...jobs]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  // ── Resolve the business display name in priority order:
  // 1. companyName stored directly on session (set by updated AuthContext login)
  // 2. name field if it isn't just the email (set by RegisterPage for business accounts)
  // 3. Look up hg_users directly as a last resort
  const resolveDisplayName = (): string => {
    if (!session) return 'My Business'

    if (session.companyName) return session.companyName

    if (session.name && session.name !== session.email) return session.name

    try {
      const users: any[] = JSON.parse(localStorage.getItem('hg_users') || '[]')
      const found = users.find(u => u.email === session.email)
      if (found?.companyName) return found.companyName
      if (found?.fullName)    return found.fullName
    } catch { /* ignore */ }

    return session.email || 'My Business'
  }

  const displayName = resolveDisplayName()

  return (
    <div>
      {/* Header */}
      <div className="biz-page" style={{ marginBottom: 36 }}>
        <p style={{ fontFamily: FB, fontSize: 10, fontWeight: 600, letterSpacing: '0.38em', textTransform: 'uppercase', color: GOLD, marginBottom: 8 }}>
          Welcome Back
        </p>
        <h1 style={{ fontFamily: FD, fontSize: 'clamp(26px,3vw,40px)', fontWeight: 700, color: WHITE, lineHeight: 1.1 }}>
          {displayName}
        </h1>
      </div>

      {/* Stat grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 36 }}>
        <StatCard label="Total Jobs"      value={jobs.length}                   sub="All time"                               delay={0}   />
        <StatCard label="Active Jobs"     value={activeJobs.length}             sub="Currently live"      accent="#4ade80"   delay={60}  />
        <StatCard label="Promoters Hired" value={totalPromoters}                sub="Across all jobs"     accent="#3A7BD5"   delay={120} />
        <StatCard label="Total Payout"    value={`R ${totalPayout.toFixed(2)}`} sub={`${totalHours.toFixed(1)} hrs tracked`} delay={180} />
      </div>

      {/* Recent jobs table */}
      <div className="biz-page" style={{ animationDelay: '220ms', background: BLACK_CARD, border: `1px solid ${BLACK_BORDER}` }}>
        <div style={{ padding: '22px 28px', borderBottom: `1px solid ${BLACK_BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontFamily: FB, fontSize: 10, fontWeight: 600, letterSpacing: '0.28em', textTransform: 'uppercase', color: GOLD }}>Recent Jobs</p>
          <button
            onClick={() => navigate('/business/jobs')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: FB, fontSize: 11, color: WHITE_MUTED, transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
            onMouseLeave={e => (e.currentTarget.style.color = WHITE_MUTED)}
          >View all →</button>
        </div>

        {recentJobs.length === 0 ? (
          <div style={{ padding: '52px 28px', textAlign: 'center' }}>
            <p style={{ fontFamily: FD, fontSize: 22, color: WHITE_MUTED, marginBottom: 8 }}>No jobs yet</p>
            <p style={{ fontFamily: FB, fontSize: 13, color: WHITE_DIM, marginBottom: 24 }}>Create your first promotion job to get started.</p>
            <button
              onClick={() => navigate('/business/jobs')}
              style={{ fontFamily: FB, fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', background: GOLD, color: '#080808', border: 'none', padding: '13px 32px', cursor: 'pointer', transition: 'all 0.3s' }}
              onMouseEnter={e => { e.currentTarget.style.background = GOLD_LIGHT }}
              onMouseLeave={e => { e.currentTarget.style.background = GOLD }}
            >Create Job</button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BLACK_BORDER}` }}>
                {['Title', 'Location', 'Promoters', 'Rate/hr', 'End Date', 'Status'].map(h => (
                  <th key={h} style={{ padding: '12px 28px', textAlign: 'left', fontFamily: FB, fontSize: 9, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: WHITE_MUTED }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentJobs.map(job => (
                <tr
                  key={job.id}
                  onClick={() => navigate('/business/jobs')}
                  style={{ borderBottom: `1px solid ${BLACK_BORDER}`, cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '16px 28px', fontFamily: FB, fontSize: 13, color: WHITE }}>{job.title}</td>
                  <td style={{ padding: '16px 28px', fontFamily: FB, fontSize: 12, color: WHITE_MUTED }}>{job.location}</td>
                  <td style={{ padding: '16px 28px', fontFamily: FB, fontSize: 12, color: WHITE_MUTED }}>{job.applicants?.length || 0} / {job.promotersNeeded}</td>
                  <td style={{ padding: '16px 28px', fontFamily: FB, fontSize: 12, color: GOLD }}>R {job.ratePerHour}/hr</td>
                  <td style={{ padding: '16px 28px', fontFamily: FB, fontSize: 12, color: WHITE_MUTED }}>{new Date(job.endDate).toLocaleDateString('en-ZA')}</td>
                  <td style={{ padding: '16px 28px' }}>
                    <span style={{
                      fontFamily: FB, fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase',
                      color:      job.status === 'active' ? '#4ade80' : '#ff6b6b',
                      background: job.status === 'active' ? 'rgba(74,222,128,0.1)' : 'rgba(255,107,107,0.1)',
                      padding: '4px 10px',
                    }}>
                      {job.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}