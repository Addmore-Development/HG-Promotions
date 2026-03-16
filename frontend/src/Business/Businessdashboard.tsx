import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// ─── Strict Gold & Black Palette ──────────────────────────────────────────────
const BLK  = '#050402'
const BLK1 = '#0A0804'
const BLK2 = '#100C05'
const BLK3 = '#181206'
const GL   = '#E8A820'
const GD   = '#C07818'
const GD2  = '#8B5A1A'
const GD3  = '#6B3F10'
const BB   = 'rgba(212,136,10,0.16)'
const BB2  = 'rgba(212,136,10,0.08)'
const W    = '#FAF3E8'
const W7   = 'rgba(250,243,232,0.70)'
const W4   = 'rgba(250,243,232,0.40)'
const W2   = 'rgba(250,243,232,0.20)'
const FD   = "'Playfair Display', Georgia, serif"
const FB   = "'DM Sans', system-ui, sans-serif"

function hex2rgba(hex: string, a: number) {
  const h = hex.replace('#', '')
  return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${a})`
}

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
function authHdr() {
  const t = localStorage.getItem('hg_token')
  return t ? { Authorization: `Bearer ${t}` } : {}
}

function StatCard({ label, value, sub, color, delay = 0 }: { label: string; value: string | number; sub?: string; color?: string; delay?: number }) {
  const c = color || GL
  return (
    <div className="biz-page" style={{ animationDelay: `${delay}ms`, background: BLK2, border: `1px solid ${BB}`, padding: '24px 22px', position: 'relative', overflow: 'hidden', borderRadius: 3 }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${GD3}, ${c}, ${GD3})` }} />
      <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: W4, fontFamily: FD, marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: FD, fontSize: 36, fontWeight: 700, color: W, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: c, marginTop: 8, fontWeight: 700, fontFamily: FD }}>{sub}</div>}
    </div>
  )
}

export default function BusinessDashboard() {
  const navigate = useNavigate()
  const [session,     setSession]     = useState<any>(null)
  const [jobs,        setJobs]        = useState<any[]>([])
  const [loading,     setLoading]      = useState(true)
  const [time,        setTime]         = useState(new Date())
  const [companyName, setCompanyName]  = useState('')

  useEffect(() => {
    const s = localStorage.getItem('hg_session')
    if (s) {
      const parsed = JSON.parse(s)
      setSession(parsed)
      // Fetch profile from API to get the stored company name (fullName)
      const token = localStorage.getItem('hg_token')
      if (token) {
        fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.ok ? r.json() : null)
          .then(data => { if (data?.fullName) setCompanyName(data.fullName) })
          .catch(() => {})
      }
    }
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API}/jobs`, { headers: authHdr() as any })
        if (res.ok) setJobs(await res.json())
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const displayName = companyName || session?.companyName || session?.name || session?.email || 'My Business'
  const h = time.getHours()
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'

  const openJobs  = jobs.filter(j => j.status === 'OPEN').length
  const filledJobs = jobs.filter(j => j.status === 'FILLED').length
  const totalAllocated = jobs.reduce((acc, j) => acc + (j.filledSlots || 0), 0)

  const recentJobs = [...jobs].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 6)

  const quickActions = [
    { label: 'View Jobs',      icon: '◎', path: '/business/jobs',      color: GL  },
    { label: 'Live Tracking',  icon: '⊙', path: '/business/tracking',  color: GD  },
    { label: 'Payroll',        icon: '◆', path: '/business/payroll',   color: GD2 },
  ]

  return (
    <div>
      {/* Header */}
      <div className="biz-page" style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: '0.36em', textTransform: 'uppercase', color: GL, marginBottom: 8, fontWeight: 700, fontFamily: FD }}>Business Portal</div>
            <h1 style={{ fontFamily: FD, fontSize: 'clamp(24px,3vw,38px)', fontWeight: 700, color: W, lineHeight: 1.1 }}>
              {greeting},<br />
              <span style={{ color: GL }}>{displayName}</span>
            </h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: FD, fontSize: 24, color: GL }}>{time.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</div>
            <div style={{ fontSize: 11, color: W4, marginTop: 4, fontFamily: FB }}>{time.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: BB, marginBottom: 28 }}>
        <StatCard label="Total Jobs"       value={jobs.length}        sub="All campaigns"           color={GL}  delay={0}   />
        <StatCard label="Open Jobs"        value={openJobs}           sub="Accepting promoters"     color={GL}  delay={60}  />
        <StatCard label="Filled Jobs"      value={filledJobs}         sub="Fully staffed"           color={GD}  delay={120} />
        <StatCard label="Promoters Placed" value={totalAllocated}     sub="Across all jobs"         color={GD2} delay={180} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: BB, marginBottom: 0 }}>
        {/* Quick actions */}
        <div style={{ background: BLK2, padding: 24 }}>
          <div style={{ fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: GL, fontWeight: 700, fontFamily: FD, marginBottom: 18 }}>Quick Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {quickActions.map(a => (
              <button key={a.path} onClick={() => navigate(a.path)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: BLK3, border: `1px solid ${BB}`, cursor: 'pointer', transition: 'all 0.2s', borderRadius: 2 }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = BLK4; (e.currentTarget as HTMLElement).style.borderColor = hex2rgba(a.color, 0.4) }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = BLK3; (e.currentTarget as HTMLElement).style.borderColor = BB }}>
                <span style={{ fontSize: 16, color: a.color }}>{a.icon}</span>
                <span style={{ fontFamily: FD, fontSize: 13, fontWeight: 700, color: W }}>{a.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: 14, color: a.color }}>→</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent jobs */}
        <div style={{ background: BLK2, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: GL, fontWeight: 700, fontFamily: FD }}>Recent Jobs</div>
            <button onClick={() => navigate('/business/jobs')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: FD, fontSize: 11, color: W4, transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = GL)}
              onMouseLeave={e => (e.currentTarget.style.color = W4)}>
              View all →
            </button>
          </div>

          {loading ? (
            <div style={{ color: W4, fontFamily: FD, fontSize: 12 }}>Loading…</div>
          ) : recentJobs.length === 0 ? (
            <div style={{ color: W4, fontFamily: FD, fontSize: 13 }}>No jobs yet. Contact your account manager to get started.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentJobs.map(job => {
                const statusColor = job.status === 'OPEN' ? GL : job.status === 'FILLED' ? GD : W4
                return (
                  <div key={job.id} onClick={() => navigate('/business/jobs')}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: BLK3, border: `1px solid ${BB}`, cursor: 'pointer', transition: 'background 0.18s', borderRadius: 2 }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = BLK4}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = BLK3}>
                    <div>
                      <div style={{ fontFamily: FD, fontSize: 12, fontWeight: 700, color: W, marginBottom: 2 }}>{job.title}</div>
                      <div style={{ fontSize: 10, color: W4, fontFamily: FB }}>{job.filledSlots}/{job.totalSlots} · R{job.hourlyRate}/hr</div>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 700, color: statusColor, background: hex2rgba(statusColor, 0.1), border: `1px solid ${hex2rgba(statusColor, 0.35)}`, padding: '2px 8px', borderRadius: 2, fontFamily: FD, letterSpacing: '0.1em', flexShrink: 0 }}>
                      {job.status}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}